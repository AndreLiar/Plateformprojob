
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, Info, ShoppingCart, AlertTriangle } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import type { ContractType, ExperienceLevel, UserProfile } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { STRIPE_PUBLISHABLE_KEY, STRIPE_JOB_POST_PRICE_ID } from "@/lib/stripeConfig"; 
import getStripe from "@/lib/getStripe";

const jobSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(100),
  description: z.string().min(20, "Description must be at least 20 characters.").max(5000),
  platform: z.string().min(2, "Platform details are required.").max(100),
  location: z.string().min(2, "Location is required.").max(100),
  contractType: z.enum(["Full-time", "Part-time", "Contract"]),
  experienceLevel: z.enum(["Entry", "Mid", "Senior"]),
});

const contractTypes: ContractType[] = ["Full-time", "Part-time", "Contract"];
const experienceLevels: ExperienceLevel[] = ["Entry", "Mid", "Senior"];

// Client-side check for basic Stripe.js initialization capability
// STRIPE_PUBLISHABLE_KEY is imported and directly usable client-side
const canInitializeStripeJs = !!STRIPE_PUBLISHABLE_KEY;

export default function JobPostForm() {
  const { toast } = useToast();
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  const [freePosts, setFreePosts] = useState<number | undefined>(undefined);
  const [purchasedPosts, setPurchasedPosts] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (userProfile) {
      setFreePosts(userProfile.freePostsRemaining ?? 0);
      setPurchasedPosts(userProfile.purchasedPostsRemaining ?? 0);
    }
  }, [userProfile]);

  const form = useForm<z.infer<typeof jobSchema>>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      description: "",
      platform: "",
      location: "",
      contractType: "Full-time",
      experienceLevel: "Mid",
    },
  });

  const canPostJobWithCredits = (freePosts ?? 0) > 0 || (purchasedPosts ?? 0) > 0;

  async function onSubmit(values: z.infer<typeof jobSchema>) {
    if (!user || !userProfile) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to post a job." });
      return;
    }

    if (!canPostJobWithCredits) {
      toast({ variant: "destructive", title: "No Posts Remaining", description: "Please purchase more job posts." });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "jobs"), {
        ...values,
        recruiterId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const userDocRef = doc(db, "users", user.uid);
      if ((freePosts ?? 0) > 0) {
        await updateDoc(userDocRef, {
          freePostsRemaining: increment(-1)
        });
        setFreePosts(prev => (prev ?? 0) - 1);
        toast({ title: "Job Posted!", description: "Your job listing is now live. One free post used." });
      } else if ((purchasedPosts ?? 0) > 0) {
        await updateDoc(userDocRef, {
          purchasedPostsRemaining: increment(-1)
        });
        setPurchasedPosts(prev => (prev ?? 0) - 1);
        toast({ title: "Job Posted!", description: "Your job listing is now live. One purchased post used." });
      }
      
      form.reset();
      router.push('/dashboard/my-jobs'); 
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Posting Job",
        description: error.message || "Could not post job. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handlePurchase = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to purchase posts." });
      return;
    }

    if (!canInitializeStripeJs) {
      toast({ 
        variant: "destructive", 
        title: "Stripe Error", 
        description: "Stripe Publishable Key (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) is missing. Cannot initiate purchase." 
      });
      return;
    }
    
    if (!STRIPE_JOB_POST_PRICE_ID) {
        toast({
            variant: "destructive",
            title: "Configuration Error",
            description: "Cannot proceed: Stripe Price ID for job posts (NEXT_PUBLIC_STRIPE_PRICE_PREMIUM) is missing. Please ensure this is set in your environment variables.",
        });
        setIsPurchasing(false);
        return;
    }

    setIsPurchasing(true);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid, priceId: STRIPE_JOB_POST_PRICE_ID }),
      });

      if (!response.ok) {
        let errorData = { error: `API request failed with status ${response.status}` };
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          try {
            errorData = await response.json();
          } catch (e) {
            console.error("Failed to parse JSON error response:", e);
            // errorData already has a default message if parsing fails
          }
        } else {
          // If not JSON, try to get text for more context
          const textError = await response.text();
          console.error("API Error (HTML/Text Response):", textError); // Log the HTML/text
          errorData.error = `API returned non-JSON response. Status: ${response.status}. Check browser console for full error text.`;
        }
        
        toast({ 
            variant: "destructive", 
            title: "Checkout Creation Failed", 
            description: errorData.error || 'Failed to create Stripe session. Check server logs and console.' 
        });
        setIsPurchasing(false);
        return;
      }

      const { sessionId } = await response.json(); // This should be safe if response.ok is true
      const stripe = await getStripe();

      if (!stripe) {
        throw new Error('Stripe.js failed to load. Ensure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set.');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        console.error("Stripe redirect error:", error);
        toast({ variant: "destructive", title: "Stripe Error", description: error.message || "Failed to redirect to Stripe." });
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast({ variant: "destructive", title: "Purchase Error", description: error.message || "An unexpected error occurred." });
    } finally {
      // Only set isPurchasing to false if not redirecting, or if an error occurred before redirect
      setIsPurchasing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-primary">Post a New Job</CardTitle>
        <CardDescription>Fill in the details below to create a new job listing.</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant={canPostJobWithCredits ? "default" : "destructive"} className="mb-6 bg-muted/30">
          <Info className="h-4 w-4" />
          <AlertTitle>{canPostJobWithCredits ? "Job Post Credits" : "Out of Job Posts"}</AlertTitle>
          <AlertDescription>
            {freePosts !== undefined && purchasedPosts !== undefined ? (
              <>
                You have <strong>{freePosts}</strong> free post(s) and <strong>{purchasedPosts}</strong> purchased post(s) remaining.
                {!canPostJobWithCredits && " Please purchase more to continue posting."}
              </>
            ) : (
              "Loading post credit information..."
            )}
          </AlertDescription>
        </Alert>

        {!canInitializeStripeJs && !authLoading && (
             <Alert variant="destructive" className="mb-4 text-left">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Stripe Client Configuration Incomplete</AlertTitle>
                <AlertDescription>
                    The Stripe Publishable Key (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) is not configured.
                    The purchase button is disabled. Please ensure this is set in your environment variables and the server is restarted.
                    Your site administrator should also check server logs for details on 'NEXT_STRIPE_SECRET_KEY' for full payment functionality.
                </AlertDescription>
            </Alert>
        )}

        {!canPostJobWithCredits && !authLoading && (
          <div className="text-center my-8 p-6 border border-dashed rounded-md bg-card">
            <h3 className="text-xl font-semibold mb-2 text-foreground">No Job Posts Left</h3>
            <p className="text-muted-foreground mb-4">You've used all your available job posts. To post more jobs, please purchase additional credits.</p>
            
            <Button 
              onClick={handlePurchase}
              disabled={isPurchasing || !canInitializeStripeJs} 
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              aria-disabled={!canInitializeStripeJs}
            >
              {isPurchasing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShoppingCart className="mr-2 h-5 w-5" />}
              Purchase Job Posts (5 EUR per post)
            </Button>

            {canInitializeStripeJs && !STRIPE_JOB_POST_PRICE_ID && (
                 <Alert variant="warning" className="mt-4 text-left max-w-md mx-auto">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Price Not Configured for Purchase</AlertTitle>
                    <AlertDescription>
                        The purchase button is enabled, but the specific Price ID for job posts (NEXT_PUBLIC_STRIPE_PRICE_PREMIUM) is missing in your environment configuration.
                        Purchases cannot be completed until this is set.
                    </AlertDescription>
                </Alert>
            )}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <fieldset disabled={!canPostJobWithCredits || isSubmitting || authLoading || isPurchasing} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Senior Platform Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the role, responsibilities, and requirements..." {...field} rows={6} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform/Technologies</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Kubernetes, AWS, Terraform" {...field} />
                      </FormControl>
                      <FormDescription>Comma-separated list of key platforms or technologies.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., San Francisco, CA or Remote" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="contractType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select contract type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contractTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="experienceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select experience level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {experienceLevels.map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </fieldset>
            {canPostJobWithCredits && ( 
              <Button type="submit" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground transition-transform hover:scale-105" disabled={isSubmitting || authLoading || isPurchasing}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting...
                  </>
                ) : "Post Job"}
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}



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
import { stripeSuccessfullyInitialized, STRIPE_JOB_POST_PRICE_ID } from "@/lib/stripeConfig";
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

  const canPostJob = (freePosts ?? 0) > 0 || (purchasedPosts ?? 0) > 0;

  async function onSubmit(values: z.infer<typeof jobSchema>) {
    if (!user || !userProfile) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to post a job." });
      return;
    }

    if (!canPostJob) {
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

    if (!stripeSuccessfullyInitialized) {
      toast({ 
        variant: "destructive", 
        title: "Stripe Error", 
        description: "Core Stripe keys (Publishable or Secret) are missing. Cannot initiate purchase. Please check server logs." 
      });
      return;
    }
    
    if (!STRIPE_JOB_POST_PRICE_ID) {
        toast({
            variant: "destructive",
            title: "Configuration Error",
            description: "Cannot proceed: Stripe Price ID for job posts (STRIPE_PRICE_PREMIUM) is not configured by the site administrator. Please set this in the environment variables.",
        });
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create Stripe session.');
      }

      const { sessionId } = await response.json();
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
        <Alert variant={canPostJob ? "default" : "destructive"} className="mb-6 bg-muted/30">
          <Info className="h-4 w-4" />
          <AlertTitle>{canPostJob ? "Job Post Credits" : "Out of Job Posts"}</AlertTitle>
          <AlertDescription>
            {freePosts !== undefined && purchasedPosts !== undefined ? (
              <>
                You have <strong>{freePosts}</strong> free post(s) and <strong>{purchasedPosts}</strong> purchased post(s) remaining.
                {!canPostJob && " Please purchase more to continue posting."}
              </>
            ) : (
              "Loading post credit information..."
            )}
          </AlertDescription>
        </Alert>

        {!canPostJob && !authLoading && (
          <div className="text-center my-8 p-6 border border-dashed rounded-md bg-card">
            <h3 className="text-xl font-semibold mb-2 text-foreground">No Job Posts Left</h3>
            <p className="text-muted-foreground mb-4">You've used all your available job posts. To post more jobs, please purchase additional credits.</p>
            
            {!stripeSuccessfullyInitialized && (
                <Alert variant="destructive" className="mb-4 text-left">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Stripe Configuration Incomplete</AlertTitle>
                    <AlertDescription>
                        The payment system's core keys (Publishable Key or Secret Key) are not fully configured by the site administrator.
                        The purchase button is disabled. Please check server logs for details on missing Stripe environment variables.
                    </AlertDescription>
                </Alert>
            )}
            
            <Button 
              onClick={handlePurchase}
              disabled={isPurchasing || !stripeSuccessfullyInitialized} 
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              aria-disabled={!stripeSuccessfullyInitialized}
            >
              {isPurchasing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShoppingCart className="mr-2 h-5 w-5" />}
              Purchase Job Posts (5 EUR per post)
            </Button>

            {stripeSuccessfullyInitialized && !STRIPE_JOB_POST_PRICE_ID && (
                 <Alert variant="warning" className="mt-4 text-left max-w-md mx-auto">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Price Not Configured</AlertTitle>
                    <AlertDescription>
                        The purchase button is enabled, but the specific Price ID for job posts (STRIPE_PRICE_PREMIUM) is missing in the server configuration.
                        Purchases cannot be completed. The site administrator needs to set this environment variable.
                    </AlertDescription>
                </Alert>
            )}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <fieldset disabled={!canPostJob || isSubmitting || authLoading || isPurchasing} className="space-y-8">
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
            {canPostJob && (
              <Button type="submit" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground transition-transform hover:scale-105" disabled={isSubmitting || authLoading || !canPostJob || isPurchasing}>
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


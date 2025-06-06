
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
import { STRIPE_PUBLISHABLE_KEY, STRIPE_JOB_POST_PRICE_ID, clientSideStripePublishableKeyPresent, clientSideStripePriceIdPresent } from "@/lib/stripeConfig"; 
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

// const canInitializeStripeJs = !!STRIPE_PUBLISHABLE_KEY; // Replaced with clientSideStripePublishableKeyPresent

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

    if (!clientSideStripePublishableKeyPresent) {
      toast({ 
        variant: "destructive", 
        title: "Stripe Error", 
        description: "Stripe Publishable Key (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) is missing. Cannot initiate purchase." 
      });
      return;
    }
    
    if (!clientSideStripePriceIdPresent || !STRIPE_JOB_POST_PRICE_ID) { // Check both, STRIPE_JOB_POST_PRICE_ID is the actual value
        toast({
            variant: "destructive",
            title: "Configuration Error",
            description: "Cannot proceed: Stripe Price ID for job posts (NEXT_PUBLIC_STRIPE_PRICE_PREMIUM) is missing. Please ensure this is set in your environment variables and available to the client.",
        });
        return;
    }

    setIsPurchasing(true);
    let checkoutSessionId: string | undefined; 

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // STRIPE_JOB_POST_PRICE_ID from stripeConfig is guaranteed to be a string if clientSideStripePriceIdPresent is true
        body: JSON.stringify({ userId: user.uid, priceId: STRIPE_JOB_POST_PRICE_ID }), 
      });

      if (!response.ok) {
        let errorData = { message: `API request failed with status ${response.status}` };
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          try {
            const parsedError = await response.json();
            errorData.message = parsedError.error || parsedError.message || errorData.message;
          } catch (e) {
            console.error("Failed to parse JSON error response:", e);
          }
        } else {
          const textError = await response.text();
          console.error("API Error (HTML/Text Response):", textError);
          errorData.message = `API returned non-JSON response. Status: ${response.status}.`;
        }
        toast({ 
            variant: "destructive", 
            title: "Checkout Creation Failed", 
            description: errorData.message 
        });
        throw new Error(errorData.message); 
      }

      const sessionData = await response.json();
      checkoutSessionId = sessionData.sessionId;

      if (!checkoutSessionId) {
        console.error("Frontend Error: Received successful API response but no sessionId.", sessionData);
        toast({ variant: "destructive", title: "Checkout Error", description: "Failed to get a valid session ID from the server. Please try again or contact support." });
        throw new Error('Frontend Error: Failed to retrieve a valid session ID from server response.');
      }

      const stripe = await getStripe();
      if (!stripe) { // getStripe returns null if STRIPE_PUBLISHABLE_KEY is missing
        toast({ variant: "destructive", title: "Stripe Error", description: "Stripe.js failed to load. Ensure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set." });
        throw new Error('Stripe.js failed to load. Ensure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set.');
      }

      const { error: stripeJsError } = await stripe.redirectToCheckout({ sessionId: checkoutSessionId });

      if (stripeJsError) {
        console.error("Stripe.js redirect error object:", stripeJsError);
        throw new Error(stripeJsError.message || "Stripe.js reported an error during redirect setup.");
      }
    } catch (error: any) {
      console.error("Purchase error or redirect exception:", error); 

      if (checkoutSessionId && error.message && (error.message.includes("Failed to set a named property 'href' on 'Location'") || error.message.includes("navigation was blocked because it should not be allowed by the sandboxing flags"))) {
        const checkoutUrl = `https://checkout.stripe.com/c/pay/${checkoutSessionId}`;
        console.log(`Attempting to open Stripe Checkout in new tab: ${checkoutUrl}`); // Log for debugging
        toast({
          variant: "warning",
          title: "Stripe Checkout: New Tab Needed",
          description: `Automatic redirect to Stripe was blocked (common in embedded windows). We've tried to open Stripe Checkout in a new browser tab. URL: ${checkoutUrl}. Please check for it and complete your purchase. If no new tab appeared, check your browser's pop-up blocker.`,
          duration: 20000, // Increased duration for visibility
        });
        const newWindow = window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            toast({
                variant: "destructive",
                title: "Popup Blocker Active?",
                description: `Opening Stripe Checkout (URL: ${checkoutUrl}) in a new tab failed. Your browser's pop-up blocker might have stopped it. Please temporarily disable your pop-up blocker for this site and try purchasing again.`,
                duration: 20000, 
            });
        }
      } else {
        toast({ variant: "destructive", title: "Purchase Error", description: error.message || "An unexpected error occurred. Please try again." });
      }
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

        {!clientSideStripePublishableKeyPresent && !authLoading && (
             <Alert variant="destructive" className="mb-4 text-left">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Stripe Client Configuration Incomplete</AlertTitle>
                <AlertDescription>
                    The Stripe Publishable Key (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) is not configured.
                    The purchase button is disabled. Please ensure this is set in your environment variables and the server is restarted.
                </AlertDescription>
            </Alert>
        )}

        {!canPostJobWithCredits && !authLoading && (
          <div className="text-center my-8 p-6 border border-dashed rounded-md bg-card">
            <h3 className="text-xl font-semibold mb-2 text-foreground">No Job Posts Left</h3>
            <p className="text-muted-foreground mb-4">You've used all your available job posts. To post more jobs, please purchase additional credits.</p>
            
            <Button 
              onClick={handlePurchase}
              disabled={isPurchasing || !clientSideStripePublishableKeyPresent || !clientSideStripePriceIdPresent} 
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              aria-disabled={!clientSideStripePublishableKeyPresent || !clientSideStripePriceIdPresent}
            >
              {isPurchasing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShoppingCart className="mr-2 h-5 w-5" />}
              Purchase Job Posts (5 EUR per post)
            </Button>

            {clientSideStripePublishableKeyPresent && !clientSideStripePriceIdPresent && (
                 <Alert variant="warning" className="mt-4 text-left max-w-md mx-auto">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Price Not Configured for Purchase</AlertTitle>
                    <AlertDescription>
                        The purchase button might be enabled, but the specific Price ID for job posts (NEXT_PUBLIC_STRIPE_PRICE_PREMIUM) is missing in your client-side environment configuration.
                        Purchases cannot be completed until this is set and the application is rebuilt/restarted.
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

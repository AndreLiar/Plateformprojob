
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
import { useState, useEffect, useCallback } from "react";
import { Loader2, Info, ShoppingCart, AlertTriangle, ChevronsUpDown, ListChecks, Sparkles, Check } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import type { ContractType, ExperienceLevel } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { STRIPE_PUBLISHABLE_KEY, STRIPE_JOB_POST_PRICE_ID, clientSideStripePublishableKeyPresent, clientSideStripePriceIdPresent } from "@/lib/stripeConfig"; 
import getStripe from "@/lib/getStripe";
import jobTitlesData from '@/lib/job-titles.json';
import platformTechnologiesData from '@/lib/platform-technologies.json';
import platformModulesData from '@/lib/platforms-modules.json';
import locationsListFromJson from '@/lib/locations-fr.json';
import Fuse from 'fuse.js';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { generateJobDescription, type GenerateJobDescriptionInput } from "@/ai/flows/job-description-generator";


const platforms = Object.keys(jobTitlesData) as (keyof typeof jobTitlesData)[];
type PlatformKey = keyof typeof jobTitlesData; 

const jobSchema = z.object({
  platform: z.enum(platforms, { required_error: "Platform category selection is required." }),
  title: z.string().min(1, "Job title is required.").max(100),
  description: z.string().min(20, "Description must be at least 20 characters.").max(5000),
  technologies: z.string().min(1, "Specific technologies are required (at least one).").max(200),
  modules: z.string().optional(), 
  location: z.string().min(2, "Location is required.").max(100),
  contractType: z.enum(["Full-time", "Part-time", "Contract"]),
  experienceLevel: z.enum(["Entry", "Mid", "Senior"]),
  keyResponsibilitiesSummary: z.string().optional(),
  companyCultureSnippet: z.string().optional(),
});

const contractTypes: ContractType[] = ["Full-time", "Part-time", "Contract"];
const experienceLevels: ExperienceLevel[] = ["Entry", "Mid", "Senior"];
const alwaysShownLocations = ["Remote", "Hybrid (Remote + On-site)"];

export default function JobPostForm() {
  const { toast } = useToast();
  const { user, userProfile, loading: authLoading, refreshUserProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isFulfillingOrder, setIsFulfillingOrder] = useState(false);
  const [isGeneratingAIDescription, setIsGeneratingAIDescription] = useState(false);
  
  const [freePosts, setFreePosts] = useState<number | undefined>(undefined);
  const [purchasedPosts, setPurchasedPosts] = useState<number | undefined>(undefined);

  const form = useForm<z.infer<typeof jobSchema>>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      platform: undefined,
      title: "",
      description: "",
      technologies: "",
      modules: "", 
      location: "",
      contractType: "Full-time",
      experienceLevel: "Mid",
      keyResponsibilitiesSummary: "",
      companyCultureSnippet: "",
    },
  });

  const [selectedPlatform, setSelectedPlatform] = useState<PlatformKey | ''>(() => form.getValues('platform') || '');
  const [availableJobTitles, setAvailableJobTitles] = useState<string[]>([]);
  const [suggestedTechnologies, setSuggestedTechnologies] = useState<string[]>([]);
  const [availableModules, setAvailableModules] = useState<string[]>([]); 

  const [multiSelectSelectedTech, setMultiSelectSelectedTech] = useState<string[]>(() => {
    const initialTechString = form.getValues('technologies');
    return initialTechString ? initialTechString.split(',').map(t => t.trim()).filter(t => t) : [];
  });
  const [multiSelectSelectedModules, setMultiSelectSelectedModules] = useState<string[]>(() => { 
    const initialModulesString = form.getValues('modules');
    return initialModulesString ? initialModulesString.split(',').map(m => m.trim()).filter(m => m) : [];
  });

  // For Location Combobox
  const [allLocationsList, setAllLocationsList] = useState<string[]>([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const [isLocationPopoverOpen, setIsLocationPopoverOpen] = useState(false);
  const [locationFuse, setLocationFuse] = useState<Fuse<string> | null>(null);

  useEffect(() => {
    // Initialize locations data and Fuse instance
    const uniqueInitialLocations = Array.from(new Set([...alwaysShownLocations, ...locationsListFromJson]));
    setAllLocationsList(uniqueInitialLocations);
    setFilteredLocations(uniqueInitialLocations);

    const searchableOnlyLocations = locationsListFromJson.filter(loc => !alwaysShownLocations.includes(loc));
    setLocationFuse(new Fuse(searchableOnlyLocations, {
        threshold: 0.3, // Adjust for fuzziness (0 perfect match, 1 any match)
    }));
  }, []);

  useEffect(() => {
    // Filter locations for combobox based on search query
    if (!locationSearch.trim()) {
        setFilteredLocations(allLocationsList); // Show all if no search
        return;
    }

    let fuseResults: string[] = [];
    if (locationFuse) {
        fuseResults = locationFuse.search(locationSearch.trim()).map(item => item.item);
    }

    const matchingAlwaysShown = alwaysShownLocations.filter(loc =>
        loc.toLowerCase().includes(locationSearch.trim().toLowerCase())
    );
    
    const combined = Array.from(new Set([...matchingAlwaysShown, ...fuseResults]));
    setFilteredLocations(combined);
  }, [locationSearch, locationFuse, allLocationsList]);


  useEffect(() => {
    if (selectedPlatform && jobTitlesData[selectedPlatform]) {
      setAvailableJobTitles(jobTitlesData[selectedPlatform]);
      setSuggestedTechnologies(platformTechnologiesData[selectedPlatform as keyof typeof platformTechnologiesData] || []);
      setAvailableModules(platformModulesData[selectedPlatform as keyof typeof platformModulesData] || []); 
    } else {
      setAvailableJobTitles([]);
      setSuggestedTechnologies([]);
      setAvailableModules([]); 
    }
  }, [selectedPlatform]);


  useEffect(() => {
    const currentTechValue = form.watch('technologies');
    if (selectedPlatform && suggestedTechnologies.length > 0) {
        const newSelected = currentTechValue ? currentTechValue.split(',').map(t => t.trim()).filter(t => t) : [];
        if (JSON.stringify(newSelected) !== JSON.stringify(multiSelectSelectedTech)) {
            setMultiSelectSelectedTech(newSelected);
        }
    }
    const currentModulesValue = form.watch('modules');
    if (selectedPlatform && availableModules.length > 0) {
      const newSelectedModules = currentModulesValue ? currentModulesValue.split(',').map(m => m.trim()).filter(m => m) : [];
      if (JSON.stringify(newSelectedModules) !== JSON.stringify(multiSelectSelectedModules)) {
        setMultiSelectSelectedModules(newSelectedModules);
      }
    }
  }, [form.watch('technologies'), form.watch('modules'), selectedPlatform, suggestedTechnologies, availableModules, multiSelectSelectedTech, multiSelectSelectedModules]);


  useEffect(() => {
    if (userProfile) {
      setFreePosts(userProfile.freePostsRemaining ?? 0);
      setPurchasedPosts(userProfile.purchasedPostsRemaining ?? 0);
    }
  }, [userProfile]);

  const handleStripeSuccessRedirect = useCallback(async () => {
    const purchaseStatus = searchParams.get('purchase');
    const sessionId = searchParams.get('session_id');

    if (purchaseStatus === 'success' && sessionId && user && !isFulfillingOrder) {
      setIsFulfillingOrder(true);
      try {
        const response = await fetch('/api/stripe/fulfill-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, userId: user.uid }),
        });

        if (response.ok) {
          toast({
            title: "Payment Successful!",
            description: "Your job post credits have been updated.",
          });
          await refreshUserProfile(); 
        } else {
          const errorData = await response.json();
          toast({
            variant: "destructive",
            title: "Order Fulfillment Failed",
            description: errorData.error || "Could not update your job posts. Please contact support.",
          });
        }
      } catch (error) {
        console.error("Fulfill order client error:", error);
        toast({
          variant: "destructive",
          title: "Fulfillment Error",
          description: "An unexpected error occurred while updating your posts. Please contact support.",
        });
      } finally {
        router.replace('/dashboard/post-job', { scroll: false });
        setIsFulfillingOrder(false);
      }
    }
  }, [searchParams, user, router, toast, refreshUserProfile, isFulfillingOrder]);

  useEffect(() => {
    handleStripeSuccessRedirect();
  }, [handleStripeSuccessRedirect]);

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
        title: values.title,
        description: values.description,
        platform: values.platform, 
        technologies: values.technologies,
        modules: values.modules || "", 
        location: values.location,
        contractType: values.contractType,
        experienceLevel: values.experienceLevel,
        recruiterId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const userDocRef = doc(db, "users", user.uid);
      if ((freePosts ?? 0) > 0) {
        await updateDoc(userDocRef, {
          freePostsRemaining: increment(-1)
        });
      } else if ((purchasedPosts ?? 0) > 0) {
        await updateDoc(userDocRef, {
          purchasedPostsRemaining: increment(-1)
        });
      }
      await refreshUserProfile(); 
      toast({ title: "Job Posted!", description: "Your job listing is now live." });
      form.reset();
      setSelectedPlatform('');
      setMultiSelectSelectedTech([]);
      setMultiSelectSelectedModules([]); 
      setLocationSearch('');
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
    
    if (!clientSideStripePriceIdPresent || !STRIPE_JOB_POST_PRICE_ID) {
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
        body: JSON.stringify({ userId: user.uid, priceId: STRIPE_JOB_POST_PRICE_ID }), 
      });

      if (!response.ok) {
        let errorData = { message: `API request failed with status ${response.status}` };
        try {
            const parsedError = await response.json();
            errorData.message = parsedError.error || parsedError.message || errorData.message;
        } catch (e) { /* Ignore if not JSON */ }
        console.error("Checkout creation API error:", errorData.message);
        toast({ variant: "destructive", title: "Checkout Creation Failed", description: errorData.message });
        throw new Error(errorData.message); 
      }

      const sessionData = await response.json();
      checkoutSessionId = sessionData.sessionId;

      if (!checkoutSessionId) {
        const errorMsg = "Failed to get a valid session ID from the server. The Price ID used might be incorrect or for a different mode (e.g. subscription instead of one-time). Please check Stripe Price ID configuration or contact support.";
        toast({ variant: "destructive", title: "Checkout Error", description: errorMsg });
        console.error("Frontend Error: Received successful API response but no sessionId.", sessionData);
        throw new Error('Frontend Error: Failed to retrieve a valid session ID from server response.');
      }
      
      const stripe = await getStripe();
      if (!stripe) {
        const errorMsg = "Stripe.js failed to load. Ensure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set.";
        toast({ variant: "destructive", title: "Stripe Error", description: errorMsg });
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      const checkoutUrl = `https://checkout.stripe.com/c/pay/${checkoutSessionId}`;
      console.log(`Attempting Stripe redirect with sessionId: ${checkoutSessionId}, URL: ${checkoutUrl}`);
      
      const { error: stripeJsError } = await stripe.redirectToCheckout({ sessionId: checkoutSessionId });

      if (stripeJsError) {
         if (stripeJsError.message?.includes("Failed to set a named property 'href' on 'Location'") || 
            stripeJsError.message?.includes("navigation was blocked")) {
            throw stripeJsError; 
        }
        throw new Error(stripeJsError.message || "Stripe.js reported an error during redirect setup.");
      }
    } catch (error: any) {
      const checkoutUrl = checkoutSessionId ? `https://checkout.stripe.com/c/pay/${checkoutSessionId}` : '';
      console.error("Purchase error or redirect exception:", { error, checkoutUrl }); 

      if (checkoutSessionId && error.message && (error.message.includes("Failed to set a named property 'href' on 'Location'") || error.message.includes("navigation was blocked"))) {
        console.warn(`Attempting to open Stripe Checkout in new tab due to navigation block: ${checkoutUrl}`);
        toast({
          variant: "warning",
          title: "Stripe Checkout: New Tab Action Required",
          description: `Automatic redirect to Stripe was blocked. We will attempt to open Stripe Checkout in a new browser tab. Please check for it. If no new tab appeared, check your browser's pop-up blocker. URL (for manual copy): ${checkoutUrl}`,
          duration: 30000, 
        });
        const newWindow = window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            toast({
                variant: "destructive",
                title: "Popup Blocker Active?",
                description: `Opening Stripe Checkout in a new tab failed. Your browser's pop-up blocker might have stopped it. Please temporarily disable your pop-up blocker for this site and try purchasing again, or copy the URL to open it manually: ${checkoutUrl}`,
                duration: 30000, 
            });
        }
      } else if (checkoutUrl && error.message && error.message.includes("The \`price\` parameter is not allowed")) {
         toast({
            variant: "destructive",
            title: "Stripe Configuration Error",
            description: "There's an issue with the product pricing configuration on Stripe. The 'price' parameter is not allowed for this Checkout session. This can happen if the Price ID is for a subscription but 'payment' mode is used. Please verify the Price ID and product setup in your Stripe Dashboard.",
            duration: 20000,
        });
      } else {
        const generalErrorMsg = error.message || "An unexpected error occurred. Please try again or contact support.";
        toast({ variant: "destructive", title: "Purchase Error", description: `${generalErrorMsg} (Checkout URL if available: ${checkoutUrl || 'N/A'})` });
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleGenerateAIDescription = async () => {
    const { platform, title, technologies, modules, experienceLevel, location, keyResponsibilitiesSummary, companyCultureSnippet, contractType } = form.getValues();

    if (!keyResponsibilitiesSummary) {
        form.setError("keyResponsibilitiesSummary", { type: "manual", message: "Please provide a summary of key responsibilities for AI generation." });
        toast({ variant: "destructive", title: "Input Missing", description: "Key responsibilities summary is required to generate AI description." });
        return;
    }
    if (!platform || !title || !technologies || !experienceLevel || !location) {
        toast({ variant: "destructive", title: "Input Missing", description: "Platform, Title, Technologies, Experience Level, and Location are needed to generate a good AI description."});
    }

    setIsGeneratingAIDescription(true);
    try {
        const aiInput: GenerateJobDescriptionInput = {
            platform: platform || "General Platform", 
            jobTitle: title || "General Role",
            technologies: technologies || "Relevant Technologies",
            modules: modules || "",
            experienceLevel: experienceLevel || "Any",
            location: location || "Any Location",
            keyResponsibilitiesSummary,
            companyCultureSnippet: companyCultureSnippet || "",
            contractType: contractType || "",
        };
        const result = await generateJobDescription(aiInput);
        if (result.generatedDescription && !result.generatedDescription.startsWith("Error:")) {
            form.setValue("description", result.generatedDescription, { shouldValidate: true });
            toast({ title: "AI Description Generated!", description: "The job description has been populated." });
        } else {
            toast({ variant: "destructive", title: "AI Generation Failed", description: result.generatedDescription || "Could not generate description." });
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "AI Error", description: error.message || "An unexpected error occurred with AI generation." });
    } finally {
        setIsGeneratingAIDescription(false);
    }
  };

  if (authLoading && !userProfile && !searchParams.get('session_id')) { 
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
          { isFulfillingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : <Info className="h-4 w-4" /> }
          <AlertTitle>{canPostJobWithCredits ? "Job Post Credits" : "Out of Job Posts"}</AlertTitle>
          <AlertDescription>
            {isFulfillingOrder ? "Processing your purchase..." : 
              (freePosts !== undefined && purchasedPosts !== undefined ? (
                <>
                  You have <strong>{freePosts}</strong> free post(s) and <strong>{purchasedPosts}</strong> purchased post(s) remaining.
                  {!canPostJobWithCredits && " Please purchase more to continue posting."}
                </>
              ) : (
                authLoading ? "Loading post credit information..." : "Post credit information unavailable."
              ))
            }
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

        {!canPostJobWithCredits && !authLoading && !isFulfillingOrder && (
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
            <fieldset disabled={!canPostJobWithCredits || isSubmitting || authLoading || isPurchasing || isFulfillingOrder || isGeneratingAIDescription} className="space-y-8">
              
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform Category</FormLabel>
                    <Select 
                      onValueChange={(value: PlatformKey) => {
                        field.onChange(value); 
                        setSelectedPlatform(value); 
                        form.setValue('title', ''); 
                        form.setValue('technologies', ''); 
                        setMultiSelectSelectedTech([]); 
                        form.setValue('modules', ''); 
                        setMultiSelectSelectedModules([]); 
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a platform category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {platforms.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Select the main platform this job relates to.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value} 
                      disabled={!selectedPlatform || availableJobTitles.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={!selectedPlatform ? "Select a platform first" : "Select a job title"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableJobTitles.map(title => (
                          <SelectItem key={title} value={title}>{title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Select a job title based on the chosen platform.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                 <FormField
                    control={form.control}
                    name="keyResponsibilitiesSummary"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel htmlFor="keyResponsibilitiesSummary">Key Responsibilities Summary (for AI)</FormLabel>
                        <FormControl>
                        <Textarea
                            id="keyResponsibilitiesSummary"
                            placeholder="e.g., Design and implement new features. Collaborate with product teams. Write unit and integration tests."
                            {...field}
                            rows={3}
                        />
                        </FormControl>
                        <FormDescription>Provide 3-5 bullet points or a short summary. This helps the AI generate a detailed responsibilities section.</FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>

              <div className="space-y-2">
                <FormField
                    control={form.control}
                    name="companyCultureSnippet"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel htmlFor="companyCultureSnippet">Company Culture Snippet (Optional, for AI)</FormLabel>
                        <FormControl>
                        <Textarea
                            id="companyCultureSnippet"
                            placeholder="e.g., We foster a collaborative environment and value continuous learning. Our team is passionate about innovation."
                            {...field}
                            rows={2}
                        />
                        </FormControl>
                        <FormDescription>A brief 1-2 sentence description of your company or team culture.</FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>

              <div className="relative space-y-2">
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Job Description</FormLabel>
                        <FormControl>
                        <Textarea placeholder="Describe the role, responsibilities, and requirements..." {...field} rows={10} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleGenerateAIDescription} 
                    disabled={isGeneratingAIDescription || !form.getValues().keyResponsibilitiesSummary}
                    className="absolute top-0 right-0 mt-1 mr-1 bg-accent text-accent-foreground hover:bg-accent/90"
                    style={{transform: 'translateY(-100%)', marginBottom: '0.25rem'}}
                >
                    {isGeneratingAIDescription ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate with AI
                </Button>
              </div>

               <div className="grid md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="technologies"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Specific Technologies</FormLabel>
                      {!selectedPlatform ? (
                         <Input placeholder="Select a platform category first" disabled />
                      ) : suggestedTechnologies.length > 0 ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between h-10",
                                  multiSelectSelectedTech.length === 0 && "text-muted-foreground"
                                )}
                              >
                                {multiSelectSelectedTech.length > 0
                                  ? multiSelectSelectedTech.length === 1 
                                    ? multiSelectSelectedTech[0]
                                    : `${multiSelectSelectedTech.length} technologies selected`
                                  : "Select technologies..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <ScrollArea className="h-72">
                              <div className="p-4 space-y-2">
                                {suggestedTechnologies.map((tech) => (
                                  <FormItem 
                                    key={tech} 
                                    className="flex flex-row items-center space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={multiSelectSelectedTech.includes(tech)}
                                        onCheckedChange={(checked) => {
                                          let newSelected: string[];
                                          if (checked) {
                                            newSelected = [...multiSelectSelectedTech, tech];
                                          } else {
                                            newSelected = multiSelectSelectedTech.filter(
                                              (selectedTech) => selectedTech !== tech
                                            );
                                          }
                                          setMultiSelectSelectedTech(newSelected);
                                          form.setValue('technologies', newSelected.join(', '), { shouldValidate: true });
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal text-sm">
                                      {tech}
                                    </FormLabel>
                                  </FormItem>
                                ))}
                              </div>
                            </ScrollArea>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <FormControl>
                          <Input 
                            placeholder="e.g., Kubernetes, AWS, Terraform" 
                            {...field} 
                          />
                        </FormControl>
                      )}
                      <FormDescription>
                        {selectedPlatform && suggestedTechnologies.length > 0 
                          ? "Select relevant technologies from the list."
                          : selectedPlatform 
                            ? `No specific suggestions for ${selectedPlatform}. List key technologies comma-separated.`
                            : "Comma-separated list of key specific technologies or tools."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                    control={form.control}
                    name="modules"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Modules / Specializations (Optional)</FormLabel>
                        {!selectedPlatform ? (
                            <Input placeholder="Select a platform category first" disabled />
                        ) : availableModules.length > 0 ? (
                            <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                    "w-full justify-between h-10",
                                    multiSelectSelectedModules.length === 0 && "text-muted-foreground"
                                    )}
                                >
                                    {multiSelectSelectedModules.length > 0
                                    ? multiSelectSelectedModules.length === 1
                                        ? multiSelectSelectedModules[0]
                                        : `${multiSelectSelectedModules.length} modules selected`
                                    : "Select modules..."}
                                    <ListChecks className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <ScrollArea className="h-72">
                                <div className="p-4 space-y-2">
                                    {availableModules.map((mod) => (
                                    <FormItem 
                                        key={mod} 
                                        className="flex flex-row items-center space-x-3 space-y-0"
                                    >
                                        <FormControl>
                                        <Checkbox
                                            checked={multiSelectSelectedModules.includes(mod)}
                                            onCheckedChange={(checked) => {
                                            let newSelected: string[];
                                            if (checked) {
                                                newSelected = [...multiSelectSelectedModules, mod];
                                            } else {
                                                newSelected = multiSelectSelectedModules.filter(
                                                (selectedMod) => selectedMod !== mod
                                                );
                                            }
                                            setMultiSelectSelectedModules(newSelected);
                                            form.setValue('modules', newSelected.join(', '), { shouldValidate: true });
                                            }}
                                        />
                                        </FormControl>
                                        <FormLabel className="font-normal text-sm">
                                        {mod}
                                        </FormLabel>
                                    </FormItem>
                                    ))}
                                </div>
                                </ScrollArea>
                            </PopoverContent>
                            </Popover>
                        ) : (
                             <FormControl>
                                <Input 
                                    placeholder="e.g., Finance, Supply Chain (if applicable)" 
                                    {...field} 
                                />
                            </FormControl>
                        )}
                        <FormDescription>
                            {selectedPlatform && availableModules.length > 0
                            ? "Select relevant modules or specializations from the list."
                            : selectedPlatform
                                ? `No specific module suggestions for ${selectedPlatform}. List if applicable (comma-separated).`
                                : "Platform-specific modules or areas of specialization (optional)."}
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Location</FormLabel>
                      <Popover open={isLocationPopoverOpen} onOpenChange={setIsLocationPopoverOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled={allLocationsList.length === 0}
                              className={cn(
                                "w-full justify-between h-10",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? field.value 
                                : "Select location..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command shouldFilter={false}> {/* Custom filtering with Fuse.js */}
                            <CommandInput
                              placeholder="Search location..."
                              value={locationSearch}
                              onValueChange={setLocationSearch}
                            />
                            <CommandEmpty>No location found.</CommandEmpty>
                            <CommandGroup>
                              <ScrollArea className="h-72">
                                {filteredLocations.map((location) => (
                                  <CommandItem
                                    key={location}
                                    value={location} 
                                    onSelect={() => {
                                      form.setValue("location", location, { shouldValidate: true });
                                      setIsLocationPopoverOpen(false);
                                      setLocationSearch(''); // Clear search input after selection
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === location ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {location}
                                  </CommandItem>
                                ))}
                              </ScrollArea>
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Select a location or type to search. "Remote" and "Hybrid" are prioritized.
                      </FormDescription>
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
            {canPostJobWithCredits && !isFulfillingOrder && ( 
              <Button type="submit" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground transition-transform hover:scale-105" disabled={isSubmitting || authLoading || isPurchasing || isGeneratingAIDescription}>
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

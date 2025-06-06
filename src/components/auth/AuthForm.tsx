
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, type UserCredential } from "firebase/auth";
import { auth as firebaseAuth, db as firebaseDb, firebaseSuccessfullyInitialized } from "@/lib/firebase"; 
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";


const baseFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  role: z.enum(['recruiter', 'candidate']).optional(),
});

interface AuthFormProps {
  isSignUp?: boolean;
}

export default function AuthForm({ isSignUp = false }: AuthFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { firebaseInitializationError } = useAuth(); 
  const [isLoading, setIsLoading] = useState(false);

  const formSchema = isSignUp
    ? baseFormSchema.refine((data) => !!data.role, {
        message: "Please select your role.",
        path: ["role"],
      })
    : baseFormSchema;


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      role: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firebaseSuccessfullyInitialized || !firebaseAuth || !firebaseDb) {
      toast({ variant: "destructive", title: "Configuration Error", description: "Firebase is not configured. Cannot proceed." });
      return;
    }
    setIsLoading(true);
    try {
      let userCredential: UserCredential;
      if (isSignUp) {
        if (!values.role) { 
          toast({ variant: "destructive", title: "Validation Error", description: "Role selection is required to sign up." });
          setIsLoading(false);
          return;
        }
        userCredential = await createUserWithEmailAndPassword(firebaseAuth, values.email, values.password);
        const user = userCredential.user;
        const userDocRef = doc(firebaseDb, "users", user.uid);
        const newUserProfile: UserProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: values.role, 
            createdAt: serverTimestamp() as any,
        };
        await setDoc(userDocRef, newUserProfile);
        toast({ title: "Account Created", description: `Welcome! Your ${values.role} account is ready.` });
        
        if (values.role === 'candidate') {
          router.replace('/dashboard/candidate/profile'); // Redirect candidate to their profile
        } else if (values.role === 'recruiter') {
          router.replace('/dashboard');
        } else {
          router.replace('/'); // Fallback
        }

      } else { // Login
        userCredential = await signInWithEmailAndPassword(firebaseAuth, values.email, values.password);
        const user = userCredential.user;
        const userDocRef = doc(firebaseDb, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userProfile = userDocSnap.data() as UserProfile;
          toast({ title: "Logged In", description: "Welcome back!" });
          if (userProfile.role === 'candidate') {
            router.replace('/dashboard/candidate/profile'); // Redirect candidate to their profile
          } else if (userProfile.role === 'recruiter') {
            router.replace('/dashboard');
          } else {
            // Fallback, should not happen if role is always set
            router.replace('/');
            toast({ variant: "destructive", title: "Login Error", description: "User role is unclear. Redirecting to home." });
          }
        } else {
          toast({ variant: "destructive", title: "Login Error", description: "User profile not found. Please try signing up." });
          router.replace("/signup"); 
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (firebaseInitializationError) {
    return (
      <div className="max-w-md mx-auto mt-10 p-8 border rounded-lg shadow-xl bg-card text-center">
        <h2 className="text-2xl font-headline font-semibold text-destructive mb-4">
          {isSignUp ? "Create Account" : "Login"} Unavailable
        </h2>
        <p className="text-muted-foreground">
          Authentication services are currently unavailable due to a Firebase configuration issue.
          Please ensure environment variables (e.g., NEXT_PUBLIC_FIREBASE_API_KEY) are set correctly.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-8 border rounded-lg shadow-xl bg-card">
      <h2 className="text-3xl font-headline font-semibold text-center mb-8 text-primary">
        {isSignUp ? "Create an Account" : "Welcome Back"}
      </h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isSignUp && (
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>I am a...</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2 pt-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="candidate" />
                        </FormControl>
                        <FormLabel className="font-normal text-sm">
                          Candidate (Looking for jobs)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="recruiter" />
                        </FormControl>
                        <FormLabel className="font-normal text-sm">
                          Recruiter (Looking to post jobs)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-transform hover:scale-105" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignUp ? "Sign Up" : "Login"}
          </Button>
        </form>
      </Form>
    </div>
  );
}


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
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, type UserCredential } from "firebase/auth";
import { auth as firebaseAuth, db as firebaseDb, firebaseSuccessfullyInitialized } from "@/lib/firebase"; 
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";


const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

interface AuthFormProps {
  isSignUp?: boolean;
}

export default function AuthForm({ isSignUp = false }: AuthFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { firebaseInitializationError } = useAuth(); 
  const [isLoading, setIsLoading] = useState(false);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
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
        userCredential = await createUserWithEmailAndPassword(firebaseAuth, values.email, values.password);
        const user = userCredential.user;
        const userDocRef = doc(firebaseDb, "users", user.uid);
        const newUserProfile: UserProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: 'recruiter', 
            createdAt: serverTimestamp() as any,
        };
        await setDoc(userDocRef, newUserProfile);
        toast({ title: "Account Created", description: "Welcome! You can now post jobs." });
      } else {
        userCredential = await signInWithEmailAndPassword(firebaseAuth, values.email, values.password);
        toast({ title: "Logged In", description: "Welcome back!" });
      }
      router.push("/dashboard");
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
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-transform hover:scale-105" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignUp ? "Sign Up" : "Login"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

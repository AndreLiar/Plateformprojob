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
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, UserCredential } from "firebase/auth";
import { auth, db, googleProvider } from "@/lib/firebase";
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
  // Access the explicit setter from useAuth if needed, or rely on onAuthStateChanged
  // const { fetchSetUserProfile } = useAuth(); 
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      let userCredential: UserCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        // Set user role in Firestore
        const userDocRef = doc(db, "users", user.uid);
        const newUserProfile: UserProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: 'recruiter', // Default role
            createdAt: serverTimestamp() as any,
        };
        await setDoc(userDocRef, newUserProfile);
        // await fetchSetUserProfile(user, 'recruiter'); // Explicitly set profile
        toast({ title: "Account Created", description: "Welcome! You can now post jobs." });
      } else {
        userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
        // await fetchSetUserProfile(userCredential.user); // Ensure profile is loaded
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

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        const newUserProfile: UserProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: 'recruiter', // Default role
            createdAt: serverTimestamp() as any,
        };
        await setDoc(userDocRef, newUserProfile);
        // await fetchSetUserProfile(user, 'recruiter');
      } else {
        // await fetchSetUserProfile(user);
      }
      toast({ title: "Signed In with Google", description: "Welcome!" });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Sign-In Error",
        description: error.message || "Could not sign in with Google.",
      });
    } finally {
      setIsGoogleLoading(false);
    }
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
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-transform hover:scale-105" disabled={isLoading || isGoogleLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignUp ? "Sign Up" : "Login"}
          </Button>
        </form>
      </Form>
      <div className="mt-6 relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button variant="outline" className="w-full mt-6 transition-transform hover:scale-105" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
        {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
        }
        Google
      </Button>
    </div>
  );
}

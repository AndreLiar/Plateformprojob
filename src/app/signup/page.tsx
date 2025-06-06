"use client";
import AuthForm from "@/components/auth/AuthForm";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <AuthForm isSignUp={true} />
      <p className="text-center mt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}

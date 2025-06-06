"use client";
import AuthForm from "@/components/auth/AuthForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <AuthForm />
      <p className="text-center mt-6 text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

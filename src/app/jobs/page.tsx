"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Construction } from "lucide-react";

export default function BrowseJobsPage() {
  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-4 w-fit mb-4">
            <Construction className="h-12 w-12" />
          </div>
          <CardTitle className="text-3xl font-headline">Job Listings Coming Soon!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            We&apos;re working hard to bring you a comprehensive list of platform engineering jobs.
            Check back soon to find your next opportunity!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6">
            In the meantime, if you&apos;re a recruiter, you can post your job openings.
          </p>
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/dashboard/post-job">
              Post a Job
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

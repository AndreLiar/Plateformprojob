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
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import type { ContractType, ExperienceLevel } from "@/lib/types";
import { useRouter } from "next/navigation";

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
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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

  async function onSubmit(values: z.infer<typeof jobSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to post a job." });
      return;
    }
    setIsLoading(true);
    try {
      await addDoc(collection(db, "jobs"), {
        ...values,
        recruiterId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Job Posted!", description: "Your job listing is now live." });
      form.reset();
      router.push("/dashboard/my-jobs");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Posting Job",
        description: error.message || "Could not post job. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-primary">Post a New Job</CardTitle>
        <CardDescription>Fill in the details below to create a new job listing.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
            <Button type="submit" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground transition-transform hover:scale-105" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting...
                </>
              ) : "Post Job"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Need to ensure Card, CardHeader, CardTitle, CardDescription, CardContent are imported from shadcn/ui
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

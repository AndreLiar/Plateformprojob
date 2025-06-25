
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import Image from "next/image";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Building, Link as LinkIcon, Loader2, UploadCloud, Save } from "lucide-react";

const profileSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters.").max(100, "Company name is too long."),
  companyWebsite: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  companyDescription: z.string().max(1000, "Description is too long.").optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function CompanyProfileForm() {
  const { user, userProfile, loading: authLoading, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { companyName: "", companyWebsite: "", companyDescription: "" },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        companyName: userProfile.companyName || "",
        companyWebsite: userProfile.companyWebsite || "",
        companyDescription: userProfile.companyDescription || "",
      });
      if (userProfile.companyLogoUrl) {
        setLogoPreview(userProfile.companyLogoUrl);
      }
    }
  }, [userProfile, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setUploadError('File is too large. Max 2MB.');
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Invalid file type. Only JPG, PNG, WEBP, or SVG are allowed.');
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) {
      toast({ variant: "destructive", title: "Not authenticated" });
      return;
    }

    setIsSaving(true);
    let logoData: { companyLogoUrl?: string; companyLogoPublicId?: string } = {};

    if (logoFile) {
      try {
        const formData = new FormData();
        formData.append('logo', logoFile);
        const response = await fetch('/api/upload-logo', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Logo upload failed.');
        }
        logoData.companyLogoUrl = result.url;
        logoData.companyLogoPublicId = result.publicId;
      } catch (error: any) {
        toast({ variant: "destructive", title: "Upload Failed", description: error.message });
        setIsSaving(false);
        return;
      }
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const updateData = {
        ...data,
        ...logoData,
      };
      await updateDoc(userDocRef, updateData);
      
      await refreshUserProfile();
      setLogoFile(null); // Clear file input after successful save
      toast({ title: "Company Profile Saved!", description: "Your company information has been updated." });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save profile changes. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return <div className="flex justify-center items-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <Card className="shadow-xl rounded-lg">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3 mb-1">
            <Building className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-headline text-primary">Company Profile</CardTitle>
        </div>
        <CardDescription>This information will be displayed on your job postings to attract candidates.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-2">
                <FormLabel>Company Logo</FormLabel>
                <div className="relative w-40 h-40 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/30">
                  {logoPreview ? (
                    <Image src={logoPreview} alt="Company Logo Preview" layout="fill" objectFit="contain" className="rounded-lg" />
                  ) : (
                    <div className="text-center text-muted-foreground p-2">
                      <UploadCloud className="mx-auto h-8 w-8" />
                      <span className="text-xs">Upload Logo</span>
                    </div>
                  )}
                  <Input 
                    id="logo-upload"
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    disabled={isSaving}
                  />
                </div>
                {uploadError && <p className="text-sm text-destructive mt-2">{uploadError}</p>}
                <FormDescription>PNG, JPG, WEBP, or SVG. Max 2MB.</FormDescription>
              </div>

              <div className="md:col-span-2 space-y-6">
                <FormField control={form.control} name="companyName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl><Input placeholder="e.g., TechCorp Inc." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="companyWebsite" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Website</FormLabel>
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-5 w-5 text-muted-foreground" />
                      <FormControl><Input placeholder="https://www.yourcompany.com" {...field} /></FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            <FormField control={form.control} name="companyDescription" render={({ field }) => (
              <FormItem>
                <FormLabel>Company Description</FormLabel>
                <FormControl><Textarea placeholder="Tell candidates about your company..." rows={6} {...field} /></FormControl>
                <FormDescription>A brief summary of your company's mission, culture, and what makes it a great place to work.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end pt-8 border-t">
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 text-base" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                {isSaving ? 'Saving...' : 'Save Company Profile'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

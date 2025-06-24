
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UserCircle, LinkedinIcon, Briefcase, FileText, UploadCloud, Settings, GraduationCap, Loader2, ExternalLink } from "lucide-react";

// Define the validation schema for the profile form
const profileSchema = z.object({
  displayName: z.string().min(2, "Full name must be at least 2 characters.").max(50, "Full name is too long."),
  phone: z.string().max(20, "Phone number is too long.").optional().or(z.literal('')),
  linkedin: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  headline: z.string().max(100, "Headline is too long.").optional().or(z.literal('')),
  summary: z.string().max(1500, "Summary is too long.").optional().or(z.literal('')),
  skills: z.string().max(500, "Skills list is too long.").optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function CandidateProfilePage() {
  const { user, userProfile, loading: authLoading, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [newCvFile, setNewCvFile] = useState<File | null>(null);
  const [cvUploadError, setCvUploadError] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      phone: "",
      linkedin: "",
      headline: "",
      summary: "",
      skills: "",
    },
  });

  // Populate form with user profile data when it loads
  useEffect(() => {
    if (userProfile) {
      form.reset({
        displayName: userProfile.displayName || "",
        phone: userProfile.phone || "",
        linkedin: userProfile.linkedin || "",
        headline: userProfile.headline || "",
        summary: userProfile.summary || "",
        skills: userProfile.skills || "",
      });
    }
  }, [userProfile, form]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCvUploadError(null);
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setCvUploadError('File is too large. Max 5MB.');
        setNewCvFile(null);
        event.target.value = ''; // Clear the input
        return;
      }
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setCvUploadError('Invalid file type. Only PDF, DOC, or DOCX are allowed.');
        setNewCvFile(null);
        event.target.value = ''; // Clear the input
        return;
      }
      setNewCvFile(file);
    }
  };


  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) {
      toast({ variant: "destructive", title: "Not authenticated" });
      return;
    }

    setIsSaving(true);
    let cvData: { cvUrl?: string; cvPublicId?: string } = {};

    // Step 1: Upload new CV if it exists
    if (newCvFile) {
      try {
        const formData = new FormData();
        formData.append('cv', newCvFile);
        const response = await fetch('/api/upload-cv', {
          method: 'POST',
          body: formData,
        });
        
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || "CV upload failed. Profile not saved.");
        }
        cvData.cvUrl = result.url;
        cvData.cvPublicId = result.publicId;
        toast({ title: "CV Uploaded Successfully" });

      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "CV Upload Failed",
          description: error.message,
        });
        setIsSaving(false);
        return; // Stop the save process if CV upload fails
      }
    }

    // Step 2: Update Firestore with form data and new CV data (if any)
    try {
      const userDocRef = doc(db, "users", user.uid);
      const updateData = {
        ...data,
        ...cvData, // Add cvUrl and cvPublicId if a new CV was uploaded
      };
      await updateDoc(userDocRef, updateData);
      
      await refreshUserProfile(); // Refresh the auth context
      setNewCvFile(null); // Clear the selected file
      toast({ title: "Profile Saved!", description: "Your information has been updated." });

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
    return (
        <div className="flex justify-center items-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <Card className="shadow-xl rounded-lg">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3 mb-1">
            <UserCircle className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-headline text-primary">My Profile</CardTitle>
        </div>
        <CardDescription>Keep your professional information up-to-date to stand out to recruiters.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <section>
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2"><UserCircle className="h-5 w-5 text-primary"/> Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="displayName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormItem>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={userProfile?.email || ''} disabled className="bg-muted/30 cursor-not-allowed" />
                    <p className="text-xs text-muted-foreground pt-2">Email is managed through your account settings.</p>
                  </FormItem>
                   <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl><Input type="tel" placeholder="(123) 456-7890" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="linkedin" render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn Profile URL</FormLabel>
                      <div className="flex items-center gap-2">
                        <LinkedinIcon className="h-5 w-5 text-muted-foreground" />
                        <FormControl><Input placeholder="https://linkedin.com/in/yourprofile" {...field} /></FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
            </section>
            
            <section>
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary"/> Professional Summary</h3>
                <div className="space-y-4">
                  <FormField control={form.control} name="headline" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Headline</FormLabel>
                      <FormControl><Input placeholder="e.g., Experienced Software Engineer | Cloud Native Enthusiast" {...field} /></FormControl>
                      <FormDescription>A catchy headline that summarizes your expertise.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="summary" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Summary/Bio</FormLabel>
                      <FormControl><Textarea placeholder="Tell recruiters about yourself, your skills, and career aspirations..." rows={6} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
            </section>

             <section>
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" /> Resume/CV
                </h3>
                <div className="p-6 border border-dashed rounded-md bg-muted/20 hover:border-primary transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="cv-upload-input" className="text-md font-medium text-foreground">Update your Resume</Label>
                      <p className="text-sm text-muted-foreground">Select a new PDF or DOCX file (Max 5MB).</p>
                    </div>
                    <Button type="button" onClick={() => document.getElementById('cv-upload-input')?.click()} variant="outline" disabled={isSaving}>
                      <UploadCloud className="mr-2 h-4 w-4" /> Browse File
                    </Button>
                    <Input id="cv-upload-input" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                  </div>
                  {newCvFile && <p className="text-sm text-green-600 mt-2">New file selected: {newCvFile.name}</p>}
                  {cvUploadError && <p className="text-sm text-destructive mt-2">{cvUploadError}</p>}
                  {!newCvFile && userProfile?.cvUrl && (
                    <div className="mt-4 pt-4 border-t border-muted-foreground/20">
                      <p className="text-sm text-muted-foreground">Current CV on file: 
                        <Button variant="link" asChild className="p-1 h-auto text-primary">
                          <a href={userProfile.cvUrl} target="_blank" rel="noopener noreferrer">
                            View Current CV <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </Button>
                      </p>
                    </div>
                  )}
                </div>
            </section>
            
            <section>
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2"><Settings className="h-5 w-5 text-primary"/> Skills</h3>
                <FormField control={form.control} name="skills" render={({ field }) => (
                  <FormItem>
                    <FormControl><Input placeholder="e.g., Kubernetes, Python, AWS, CI/CD" {...field} /></FormControl>
                    <FormDescription>List your technical skills, tools, and specializations, separated by commas.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
            </section>
            
            <section>
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary"/> Work Experience (Coming Soon)</h3>
                <div className="p-4 border rounded-md bg-muted/20">
                <p className="text-sm text-muted-foreground">
                    Detail your previous roles, responsibilities, and accomplishments. This section is under development.
                </p>
                </div>
            </section>

            <section>
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary"/> Education (Coming Soon)</h3>
                <div className="p-4 border rounded-md bg-muted/20">
                <p className="text-sm text-muted-foreground">
                    List your degrees, certifications, and relevant coursework. This section is under development.
                </p>
                </div>
            </section>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 text-base" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserCircle className="mr-2 h-5 w-5" />}
                {isSaving ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

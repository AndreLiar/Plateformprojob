
"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Job } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ApplyJobDialogProps {
  job: Job;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplicationSubmitted: () => void;
}

export default function ApplyJobDialog({ job, open, onOpenChange, onApplicationSubmitted }: ApplyJobDialogProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setUploadError('File is too large. Max 5MB.');
        setCvFile(null);
        event.target.value = ''; // Clear the input
        return;
      }
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Invalid file type. Only PDF, DOC, or DOCX are allowed.');
        setCvFile(null);
        event.target.value = ''; // Clear the input
        return;
      }
      setCvFile(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !userProfile || userProfile.role !== 'candidate') {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in as a candidate to apply.' });
      return;
    }
    if (!cvFile) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a CV to upload.' });
      return;
    }
    if (uploadError) {
      toast({ variant: 'destructive', title: 'File Error', description: uploadError });
      return;
    }

    setIsSubmitting(true);
    setUploadError(null);
    setSubmissionStatus('Processing application...');

    let cvUrl: string | null = null;
    let cloudinaryPublicId: string | null = null;
    let cvUploadFailedMessage: string | null = null;

    // --- Step 1: Attempt to upload CV ---
    try {
      setSubmissionStatus('Uploading CV...');
      const formData = new FormData();
      formData.append('cv', cvFile);

      const uploadResponse = await fetch('/api/upload-cv', {
        method: 'POST',
        body: formData,
      });

      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        if (uploadResult.success && uploadResult.url) {
          cvUrl = uploadResult.url;
          cloudinaryPublicId = uploadResult.publicId || null;
          if (uploadResult.extractionError) { // Text extraction failed but Cloudinary upload succeeded
             toast({ variant: "default", title: "CV Info", description: `CV uploaded. Note: ${uploadResult.extractionError}`, duration: 7000 });
          }
        } else {
          // API responded OK, but success:false or no URL in JSON
          cvUploadFailedMessage = uploadResult.error || uploadResult.extractionError || 'CV uploaded, but server reported processing issues or no URL was returned.';
          setUploadError(cvUploadFailedMessage);
        }
      } else {
        // API responded with an error status (e.g., 500, 400)
        let errorDetail = `CV upload API failed with status: ${uploadResponse.status}.`;
        try {
          const errorData = await uploadResponse.json(); // Try to parse JSON error
          errorDetail = errorData.error || errorDetail;
        } catch (e) {
          // Response was not JSON (likely HTML error page - the "Unexpected token '<'" issue source)
          errorDetail = `CV upload failed: Server returned an unexpected response.`;
          console.error("CV Upload: Non-JSON response from API", await uploadResponse.text()); // Log the HTML for debugging
        }
        cvUploadFailedMessage = errorDetail;
        setUploadError(cvUploadFailedMessage);
      }
    } catch (networkOrFetchError: any) {
      // Network error or other issue with fetch itself
      console.error('Critical CV Upload Fetch Error:', networkOrFetchError);
      cvUploadFailedMessage = `CV processing failed due to a network or client-side error: ${networkOrFetchError.message}.`;
      setUploadError(cvUploadFailedMessage);
    }

    if (cvUploadFailedMessage && !cvUrl) { // If upload failed and we don't have a URL
      toast({
        variant: "destructive",
        title: "CV Upload Failed",
        description: `${cvUploadFailedMessage} Your application will be submitted, but the CV might not be available to the recruiter.`,
        duration: 10000
      });
    } else if (cvUploadFailedMessage && cvUrl) { // CV was uploaded but there were other non-critical issues
        toast({
        variant: "warning",
        title: "CV Upload Note",
        description: `${cvUploadFailedMessage} Your application will proceed.`,
        duration: 7000
      });
    }


    // --- Step 2: Save application to Firestore, regardless of CV upload outcome for now ---
    try {
      setSubmissionStatus('Saving application...');
      const appCollectionRef = collection(db, 'applications');
      const applicationData = {
        candidateId: user.uid,
        candidateName: userProfile.displayName || user.displayName || user.email,
        candidateEmail: userProfile.email || user.email,
        jobId: job.id,
        jobTitle: job.title,
        recruiterId: job.recruiterId,
        cvUrl: cvUrl, // This will be null if upload failed
        cloudinaryPublicId: cloudinaryPublicId, // This will be null if upload failed
        appliedAt: serverTimestamp(),
        status: 'Applied',
        // AI fields are "Coming Soon"
        aiScore: null,
        aiAnalysisSummary: "AI Analysis: Coming Soon",
        aiStrengths: [],
        aiWeaknesses: [],
      };

      await addDoc(appCollectionRef, applicationData);

      toast({
        title: 'Application Submitted!',
        description: `You've successfully applied for ${job.title}. ${cvUrl ? 'Your CV has been attached.' : 'There was an issue attaching your CV; it may not be available to the recruiter.'}`
      });
      onApplicationSubmitted();
      onOpenChange(false);
      setCvFile(null);
      setUploadError(null);
      const fileInput = document.getElementById('cv-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (finalSubmissionError: any) {
      console.error('Error saving application to Firestore:', finalSubmissionError);
      toast({
        variant: 'destructive',
        title: 'Application Submission Failed',
        description: `Could not save your application data: ${finalSubmissionError.message}. Please try again.`
      });
    } finally {
      setIsSubmitting(false);
      setSubmissionStatus('');
    }
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isSubmitting) {
            onOpenChange(isOpen);
            if (!isOpen) {
                setCvFile(null);
                setUploadError(null);
                setSubmissionStatus('');
                const fileInput = document.getElementById('cv-upload') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            }
        }
    }}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary">Apply for: {job.title}</DialogTitle>
          <DialogDescription>
            Upload your CV to apply. Supported: PDF, DOC, DOCX (Max 5MB).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="cv-upload" className="text-base">Upload CV</Label>
            <div className="flex items-center justify-center w-full">
                <label
                    htmlFor="cv-upload"
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PDF, DOC, DOCX (MAX. 5MB)</p>
                    </div>
                    <Input
                        id="cv-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        disabled={isSubmitting}
                    />
                </label>
            </div>
            {cvFile && !isSubmitting && <p className="text-sm text-green-600 mt-2">Selected: {cvFile.name}</p>}
            {uploadError && !isSubmitting && <p className="text-sm text-destructive mt-2">{uploadError}</p>}
            {isSubmitting && submissionStatus && (
              <div className="flex items-center text-sm text-primary mt-2">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>{submissionStatus}</span>
              </div>
            )}
          </div>
          <DialogFooter className="pt-4">
            <DialogClose asChild>
                <Button variant="outline" type="button" disabled={isSubmitting} onClick={() => { setCvFile(null); setUploadError(null);}}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || !cvFile || !!uploadError} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

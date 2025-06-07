
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
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
// import { analyzeCvAgainstJob, type AnalyzeCvInput } from '@/ai/flows/analyze-cv-flow'; // AI Analysis temporarily disabled

interface ApplyJobDialogProps {
  job: Job;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplicationSubmitted: () => void;
}

// Helper to convert File to Data URI (still needed if AI is re-enabled)
// const fileToDataUri = (file: File): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => {
//       resolve(reader.result as string);
//     };
//     reader.onerror = reject;
//     reader.readAsDataURL(file);
//   });
// };


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
        event.target.value = '';
        return;
      }
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Invalid file type. Only PDF, DOC, or DOCX are allowed.');
        setCvFile(null);
        event.target.value = '';
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
    if (uploadError) { // Check for client-side validation errors first
      toast({ variant: 'destructive', title: 'File Error', description: uploadError });
      return;
    }

    setIsSubmitting(true);
    setUploadError(null); // Clear previous upload errors before new attempt
    let applicationDocId: string | null = null;

    let cvUrl: string | null = null;
    let cloudinaryPublicId: string | null = null;
    let cvUploadErrorMessage: string | null = null;

    try {
      setSubmissionStatus('Uploading CV...');
      const formData = new FormData();
      formData.append('cv', cvFile);

      const uploadResponse = await fetch('/api/upload-cv', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        let errorDetail = `CV upload API failed with status: ${uploadResponse.status}.`;
        try {
          // Attempt to parse error only if it's likely JSON, otherwise use status text
          const contentType = uploadResponse.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const errorData = await uploadResponse.json();
            errorDetail = errorData.error || errorDetail;
          } else {
            errorDetail = `CV upload API request failed: ${uploadResponse.status} ${uploadResponse.statusText}`;
          }
        } catch (parseError) {
          // This catches JSON parsing errors if API returned HTML (like 500 error page)
          console.warn("Could not parse error response from /api/upload-cv. It might be HTML.", parseError);
          errorDetail = "CV upload failed: Server returned an unexpected response. The CV might not have been saved.";
        }
        cvUploadErrorMessage = errorDetail; // Store the error message
        // Do not throw here, let the application submission proceed
      } else {
        const uploadResult = await uploadResponse.json();
        if (uploadResult.success && uploadResult.url) {
          cvUrl = uploadResult.url;
          cloudinaryPublicId = uploadResult.publicId;
          // If text extraction had an error but upload was successful, we might note it
          if (uploadResult.extractionError) {
            toast({ variant: "default", title: "CV Info", description: `CV uploaded. Note: ${uploadResult.extractionError}`, duration: 7000 });
          }
        } else {
          // API returned success: false or no URL
          cvUploadErrorMessage = uploadResult.error || 'CV upload was reported as unsuccessful by the API.';
        }
      }
    } catch (fetchError: any) {
      // This catch block handles errors from the fetch call itself (network, etc.)
      // or if .json() parsing failed on a non-ok response that wasn't application/json
      console.error('Critical CV Upload/Processing Error in ApplyJobDialog:', fetchError);
      cvUploadErrorMessage = `CV processing failed: ${fetchError.message}.`;
    }

    if (cvUploadErrorMessage) {
      setUploadError(cvUploadErrorMessage); // Set state for potential display, though toast is primary
      toast({
        variant: "destructive",
        title: "CV Upload Issue",
        description: `${cvUploadErrorMessage} Your application will still be submitted, but the CV might be missing or unanalyzed. Please consider contacting the recruiter directly if the issue persists.`,
        duration: 15000 // Longer duration for important messages
      });
    }

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
        cvUrl: cvUrl, // This will be null if upload failed or API returned error
        cloudinaryPublicId: cloudinaryPublicId, // Also null if upload failed
        appliedAt: serverTimestamp(),
        status: 'Applied',
        aiScore: null,
        aiAnalysisSummary: "AI Analysis Coming Soon", // Feature deferred
        aiStrengths: [],
        aiWeaknesses: [],
      };

      const appDocRef = await addDoc(appCollectionRef, applicationData);
      applicationDocId = appDocRef.id;

      // AI Analysis Call is temporarily disabled
      /*
      setSubmissionStatus('Preparing for AI analysis...');
      // ... (rest of AI analysis code would go here if re-enabled)
      */

      toast({
        title: 'Application Submitted!',
        description: `You've successfully applied for ${job.title}. ${cvUrl ? 'Your CV was uploaded.' : 'There was an issue uploading your CV.'}`
      });
      onApplicationSubmitted();
      onOpenChange(false); // Close dialog
      setCvFile(null); // Reset file input
      const fileInput = document.getElementById('cv-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (finalSubmissionError: any) {
      console.error('Error saving application to Firestore:', finalSubmissionError);
      toast({
        variant: 'destructive',
        title: 'Application Submission Failed',
        description: `Could not save your application data: ${finalSubmissionError.message}. Please try again.`
      });
      // If Firestore save fails, we might have an orphaned CV upload in Cloudinary.
      // More complex cleanup logic could be added here in a production system.
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


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
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; // Removed doc, getDoc, updateDoc as AI analysis is commented out

// AI Analysis is temporarily disabled
// import { analyzeCvAgainstJob, type AnalyzeCvInput } from '@/ai/flows/analyze-cv-flow';

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
    if (uploadError) { 
      toast({ variant: 'destructive', title: 'File Error', description: uploadError });
      return;
    }

    setIsSubmitting(true);
    setUploadError(null); 

    let cvUrl: string | null = null;
    let cloudinaryPublicId: string | null = null;
    // let extractedTextForAI: string | null = null; // AI is disabled
    // let cvDataUriForAI: string | null = null; // AI is disabled
    let cvProcessingErrorMessage: string | null = null;


    try {
      setSubmissionStatus('Uploading CV...');
      const formData = new FormData();
      formData.append('cv', cvFile);

      // if (cvFile) { // AI is disabled, so data URI generation is also disabled
      //   cvDataUriForAI = await fileToDataUri(cvFile);
      // }

      const uploadResponse = await fetch('/api/upload-cv', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        // Attempt to parse error even if not ok, as API route might send JSON error
        let errorDetail = `CV upload API failed with status: ${uploadResponse.status}.`;
        try {
          const errorData = await uploadResponse.json(); // This might throw if HTML
          // If we successfully parsed JSON, use its error message or url
          if (errorData.url) { // API returned an error, but DID provide a URL
            cvUrl = errorData.url;
            cloudinaryPublicId = errorData.publicId || null;
            // extractedTextForAI = errorData.extractedText || null; // AI disabled
            // Prioritize specific error message if available
            cvProcessingErrorMessage = errorData.error || errorData.extractionError || `CV uploaded to ${cvUrl}, but processing issues occurred.`;
            toast({ variant: "warning", title: "CV Upload Note", description: cvProcessingErrorMessage, duration: 10000 });
          } else {
             errorDetail = errorData.error || errorDetail;
             cvProcessingErrorMessage = errorDetail;
          }
        } catch (parseError) { // This means the response was likely not JSON (e.g. HTML error)
          console.error("Failed to parse /api/upload-cv error response as JSON:", parseError);
          cvProcessingErrorMessage = `CV upload failed: Server returned an unexpected response (likely HTML error page). The CV could not be linked.`;
        }
        // If cvUrl was not set from errorData.url, it remains null.
      } else { // uploadResponse.ok
        const uploadResult = await uploadResponse.json();
        if (uploadResult.url) { // Prioritize URL even if success is false (as per API design)
          cvUrl = uploadResult.url;
          cloudinaryPublicId = uploadResult.publicId || null;
          // extractedTextForAI = uploadResult.extractedText || null; // AI disabled
          if (!uploadResult.success && (uploadResult.error || uploadResult.extractionError)) {
            cvProcessingErrorMessage = uploadResult.error || uploadResult.extractionError || 'CV uploaded, but server reported processing issues.';
            toast({ variant: "warning", title: "CV Upload Note", description: cvProcessingErrorMessage, duration: 7000 });
          } else if (uploadResult.extractionError) {
             toast({ variant: "default", title: "CV Info", description: `CV uploaded. Note: ${uploadResult.extractionError}`, duration: 7000 });
          }
        } else { // OK response but no URL - this is unexpected
          cvProcessingErrorMessage = uploadResult.error || 'CV upload process reported success but did not return a URL.';
        }
      }
    } catch (uploadFetchError: any) { // Catches network errors or if .json() itself fails on non-ok non-JSON response
      console.error('Critical CV Upload/Processing Error in ApplyJobDialog:', uploadFetchError);
      cvProcessingErrorMessage = `CV processing failed: ${uploadFetchError.message}. Your application will be submitted without the CV.`;
      // cvUrl and cloudinaryPublicId remain null
    }

    if (cvProcessingErrorMessage && !cvUrl) { // Major error, CV not uploaded or URL not retrieved
      setUploadError(cvProcessingErrorMessage);
      toast({
        variant: "destructive",
        title: "CV Upload Failed",
        description: `${cvProcessingErrorMessage} Your application will be submitted, but the CV link will be missing. Consider contacting the recruiter directly.`,
        duration: 15000
      });
    } else if (cvProcessingErrorMessage && cvUrl) { // Minor error, CV uploaded but other issues
        // Toast already shown if applicable
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
        cvUrl: cvUrl, 
        cloudinaryPublicId: cloudinaryPublicId, 
        appliedAt: serverTimestamp(),
        status: 'Applied',
        aiScore: null, // AI feature deferred
        aiAnalysisSummary: "AI Analysis Coming Soon", // Feature deferred
        aiStrengths: [], // Feature deferred
        aiWeaknesses: [], // Feature deferred
      };

      await addDoc(appCollectionRef, applicationData);
      // AI Analysis Call is temporarily disabled
      /*
      if (cvUrl || extractedTextForAI) { // Only proceed if we have something to analyze
        setSubmissionStatus('Starting AI analysis (this may take a moment)...');
        try {
            const jobDocRef = doc(db, "jobs", job.id);
            const jobDocSnap = await getDoc(jobDocRef);

            if (!jobDocSnap.exists()) {
                throw new Error("Job details not found for AI analysis.");
            }
            const jobDataForAI = jobDocSnap.data() as Job;

            const aiInput: AnalyzeCvInput = {
                cvDataUri: cvDataUriForAI || '', // Pass data URI, flow handles its absence or prioritizes text
                cvTextContent: extractedTextForAI || undefined, // Pass extracted text if available
                jobTitle: jobDataForAI.title,
                jobDescription: jobDataForAI.description,
                jobTechnologies: jobDataForAI.technologies,
                jobExperienceLevel: jobDataForAI.experienceLevel,
            };
            const aiResult = await analyzeCvAgainstJob(aiInput);
            
            if (applicationDocId) { // Ensure appDocId was set
              setSubmissionStatus('Updating application with AI insights...');
              const appToUpdateRef = doc(db, 'applications', applicationDocId);
              await updateDoc(appToUpdateRef, {
                  aiScore: aiResult.score,
                  aiAnalysisSummary: aiResult.summary,
                  aiStrengths: aiResult.strengths,
                  aiWeaknesses: aiResult.weaknesses,
              });
            }
            toast({ title: "AI Analysis Complete", description: "CV analysis insights have been added."});
        } catch (aiError: any) {
            console.error("Error during AI analysis or Firestore update with AI data:", aiError);
            toast({ variant: "warning", title: "AI Analysis Issue", description: `CV analysis could not be completed: ${aiError.message}. Application submitted without AI insights.`, duration: 10000});
            if (applicationDocId) {
                const appToUpdateRef = doc(db, 'applications', applicationDocId);
                await updateDoc(appToUpdateRef, { // Update with error message
                    aiAnalysisSummary: `AI Analysis Failed: ${aiError.message}`,
                });
            }
        }
      } else if (applicationDocId) { // No CV URL and no extracted text, update summary
          const appToUpdateRef = doc(db, 'applications', applicationDocId);
          await updateDoc(appToUpdateRef, {
              aiAnalysisSummary: "AI Analysis skipped: No CV content available for analysis.",
          });
      }
      */

      toast({
        title: 'Application Submitted!',
        description: `You've successfully applied for ${job.title}. ${cvUrl ? 'Your CV link has been recorded.' : 'There was an issue with your CV, it might not be available to the recruiter.'}`
      });
      onApplicationSubmitted();
      onOpenChange(false); 
      setCvFile(null); 
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

    
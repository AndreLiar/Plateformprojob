
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
import { analyzeCvAgainstJob, type AnalyzeCvInput } from '@/ai/flows/analyze-cv-flow';

interface ApplyJobDialogProps {
  job: Job;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplicationSubmitted: () => void; // Callback to refresh job list or state
}

// Helper to convert File to Data URI
const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


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
    let applicationDocId: string | null = null;
    
    // Initialize CV processing related variables
    let cvUrl: string | null = null;
    let cloudinaryPublicId: string | null = null;
    let extractedTextForAI: string | null = null;
    let extractionErrorFromAPI: string | null = null;
    let cvUploadSuccessful = false;

    try {
      // Step 1: Attempt CV Upload and Text Extraction
      setSubmissionStatus('Uploading CV & extracting text...');
      const formData = new FormData();
      formData.append('cv', cvFile);

      try {
        const uploadResponse = await fetch('/api/upload-cv', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          // Attempt to parse error, but proceed even if this fails
          let errorDetail = `CV upload API failed with status: ${uploadResponse.status}.`;
          try {
            const errorData = await uploadResponse.json();
            errorDetail = errorData.error || errorDetail;
          } catch (parseError) {
            console.warn("Could not parse error response from /api/upload-cv:", parseError)
            // The error is likely HTML, which caused the original "Unexpected token '<'"
          }
          throw new Error(errorDetail);
        }

        const uploadResult = await uploadResponse.json();
        if (!uploadResult.success || !uploadResult.url) {
          throw new Error(uploadResult.error || 'CV upload to Cloudinary was marked as unsuccessful by the API.');
        }
        
        cvUrl = uploadResult.url;
        cloudinaryPublicId = uploadResult.publicId;
        extractedTextForAI = uploadResult.extractedText;
        extractionErrorFromAPI = uploadResult.extractionError; // Can be null if successful
        cvUploadSuccessful = true;

        if (extractionErrorFromAPI) {
          toast({ variant: "default", title: "CV Text Extraction Note", description: extractionErrorFromAPI, duration: 7000 });
        }

      } catch (cvProcessingError: any) {
        console.error('CV Upload/Processing Error in ApplyJobDialog:', cvProcessingError);
        setUploadError(`CV processing failed: ${cvProcessingError.message}. Application will proceed without CV.`);
        extractionErrorFromAPI = `CV processing failed: ${cvProcessingError.message}. Application will proceed without CV.`;
        cvUrl = null;
        cloudinaryPublicId = null;
        extractedTextForAI = null;
        cvUploadSuccessful = false; // Explicitly set
        toast({ 
            variant: "destructive", 
            title: "CV Upload Issue", 
            description: `Could not process your CV: ${cvProcessingError.message}. Your application will be submitted without it. You may need to contact the recruiter separately with your CV.`,
            duration: 10000 
        });
      }

      // Step 2: Save initial application to Firestore (always attempts this)
      setSubmissionStatus('Saving application...');
      const appCollectionRef = collection(db, 'applications');
      const appDocRef = await addDoc(appCollectionRef, {
        candidateId: user.uid,
        candidateName: userProfile.displayName || user.displayName || user.email,
        candidateEmail: userProfile.email || user.email,
        jobId: job.id,
        jobTitle: job.title,
        recruiterId: job.recruiterId,
        cvUrl: cvUrl, // Will be null if upload failed
        cloudinaryPublicId: cloudinaryPublicId, // Will be null if upload failed
        appliedAt: serverTimestamp(),
        status: 'Applied',
        // Initial AI fields, especially if CV processing failed
        aiScore: cvUploadSuccessful && !extractionErrorFromAPI ? undefined : 0, // Set to 0 if CV processing failed
        aiAnalysisSummary: extractionErrorFromAPI || (cvUploadSuccessful ? undefined : "CV not processed."),
        aiStrengths: cvUploadSuccessful && !extractionErrorFromAPI ? undefined : [],
        aiWeaknesses: cvUploadSuccessful && !extractionErrorFromAPI ? undefined : (extractionErrorFromAPI ? [extractionErrorFromAPI] : ["CV was not processed."]),
      });
      applicationDocId = appDocRef.id;

      // Step 3: Fetch full job details for AI analysis
      setSubmissionStatus('Preparing for AI analysis...');
      let fullJobDetails: Job | null = null;
      if (job.id) { 
        const jobDocRef = doc(db, 'jobs', job.id);
        const jobDocSnap = await getDoc(jobDocRef);
        if (jobDocSnap.exists()) {
          fullJobDetails = jobDocSnap.data() as Job;
        } else {
          console.warn(`Job document ${job.id} not found for AI analysis.`);
          // If job details are missing, AI analysis will be less effective or might fail gracefully in the flow
        }
      }
      
      // Step 4: Convert CV to Data URI client-side and call AI Flow
      // This is done even if Cloudinary upload failed, as a last resort for AI if cvFile is still present.
      // The AI flow should handle problematic cvDataUri or missing cvTextContent.
      let cvDataUriForAI: string | null = null;
      if (cvFile) { // cvFile is from the input, should still be here
        try {
          cvDataUriForAI = await fileToDataUri(cvFile);
        } catch (dataUriError) {
          console.error("Error converting CV to Data URI client-side:", dataUriError);
          // AI analysis will proceed with cvDataUriForAI as null
        }
      }


      if (fullJobDetails && applicationDocId) { 
        // Only run AI analysis if we have job details and an application document.
        // The AI flow is expected to handle null/undefined inputs for CV data gracefully.
        setSubmissionStatus('Analyzing CV with AI (if CV was processed)...');
        
        const aiInput: AnalyzeCvInput = {
          cvDataUri: cvDataUriForAI || "", // Pass empty string if null, schema expects string
          cvTextContent: extractedTextForAI || undefined, 
          jobTitle: fullJobDetails.title,
          jobDescription: fullJobDetails.description,
          jobTechnologies: fullJobDetails.technologies,
          jobExperienceLevel: fullJobDetails.experienceLevel,
        };
        const aiResult = await analyzeCvAgainstJob(aiInput);

        // Step 5: Update application with AI insights
        if (aiResult) { // aiResult should always be returned by the flow, even if it's an error structure
             setSubmissionStatus('Saving AI insights...');
             await updateDoc(doc(db, 'applications', applicationDocId), {
                aiScore: aiResult.score, // score could be 0 if analysis failed
                aiAnalysisSummary: aiResult.summary,
                aiStrengths: aiResult.strengths || [],
                aiWeaknesses: aiResult.weaknesses || [],
            });
             toast({ title: 'AI Analysis Complete!', description: 'CV insights saved with your application.' });
        }
      } else if (applicationDocId) {
         // AI analysis skipped or failed due to missing job details or earlier critical CV error
         // The initial save to Firestore already included error placeholders for AI fields.
         const reason = !fullJobDetails ? "full job details not found" : "critical CV processing error";
         await updateDoc(doc(db, 'applications', applicationDocId), {
            aiScore: 0,
            aiAnalysisSummary: `AI analysis skipped: ${reason}.`,
         });
         toast({ variant: 'default', title: 'AI Analysis Skipped', description: `AI analysis was skipped because ${reason}. Application submitted.` });
      }


      toast({ title: 'Application Submitted!', description: `You've successfully applied for ${job.title}. ${!cvUploadSuccessful ? "Note: There was an issue with your CV upload." : ""}` });
      onApplicationSubmitted();
      onOpenChange(false);
      setCvFile(null);
      const fileInput = document.getElementById('cv-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';


    } catch (error: any) { // This outer catch is for errors NOT related to initial CV processing
      console.error('General application submission error:', error);
      setUploadError(error.message || 'An unexpected error occurred during final submission steps.');
      toast({ variant: 'destructive', title: 'Application Submission Failed', description: error.message || 'Could not submit application.' });
      if (applicationDocId) { // If app doc created but subsequent steps failed (e.g., AI flow call itself, or Firestore update)
        try {
          await updateDoc(doc(db, 'applications', applicationDocId), {
            status: 'Error', 
            aiAnalysisSummary: (extractionErrorFromAPI ? extractionErrorFromAPI + " Additionally, " : "") + `Application submission encountered an error: ${error.message}`,
            aiScore: 0,
          });
        } catch (updateError) {
          console.error("Failed to update application with error status:", updateError);
        }
      }
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
            Upload your CV to apply. Supported: PDF, DOC, DOCX (Max 5MB). AI will attempt to analyze your CV content.
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
            {uploadError && <p className="text-sm text-destructive mt-2">{uploadError}</p>}
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


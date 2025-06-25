"use client";

import type { Job as OriginalJobType, Timestamp } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, MapPin, Zap, CheckCircle, Send, Users, Settings2, Layers, Eye, Bookmark, Loader2 } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect, useCallback } from 'react';
import ApplyJobDialog from '@/components/jobs/ApplyJobDialog';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, doc, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, increment } from 'firebase/firestore';
import ViewApplicantsDialog from '@/components/dashboard/recruiter/ViewApplicantsDialog';
import JobDetailsDialog from '@/components/jobs/JobDetailsDialog';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

interface JobForCard extends Omit<OriginalJobType, 'createdAt' | 'updatedAt' | 'platform'> {
  id: string;
  platform: string;
  technologies: string;
  modules?: string;
  applicationCount?: number;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

interface JobListCardProps {
  job: JobForCard;
  isRecruiterView?: boolean;
}

export default function JobListCard({ job, isRecruiterView = false }: JobListCardProps) {
  const { user, userProfile, loading: authLoading, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isViewApplicantsDialogOpen, setIsViewApplicantsDialogOpen] = useState(false);
  const [isJobDetailsDialogOpen, setIsJobDetailsDialogOpen] = useState(false);

  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplicationStatus, setCheckingApplicationStatus] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isQuickApplying, setIsQuickApplying] = useState(false);

  useEffect(() => {
    if (userProfile?.savedJobs && job.id) {
      setIsSaved(userProfile.savedJobs.includes(job.id));
    }
  }, [userProfile, job.id]);

  const getProcessedDate = (dateInput: Timestamp | string | undefined): Date | null => {
    if (!dateInput) return null;
    if (typeof dateInput === 'string') {
      const d = parseISO(dateInput);
      return isNaN(d.getTime()) ? null : d;
    }
    if (dateInput && typeof (dateInput as Timestamp).toDate === 'function') {
      return (dateInput as Timestamp).toDate();
    }
    return null;
  };

  const creationDate = getProcessedDate(job.createdAt);
  const postedDate = creationDate ? formatDistanceToNow(creationDate, { addSuffix: true }) : 'N/A';

  const checkApplicationStatus = useCallback(async () => {
    if (user && job.id) {
      setCheckingApplicationStatus(true);
      try {
        const applicationsRef = collection(db, 'applications');
        const q = query(
          applicationsRef,
          where('candidateId', '==', user.uid),
          where('jobId', '==', job.id),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        setHasApplied(!querySnapshot.empty);
      } catch (error) {
        console.error("Error checking application status:", error);
        setHasApplied(false);
      } finally {
        setCheckingApplicationStatus(false);
      }
    }
  }, [user, job.id]);

  useEffect(() => {
    if (!isRecruiterView && userProfile?.role === 'candidate' && job.id) {
      checkApplicationStatus();
    }
  }, [userProfile, job.id, checkApplicationStatus, isRecruiterView]);

  const handleApplicationSubmitted = () => {
    setHasApplied(true);
    setIsApplyDialogOpen(false);
    checkApplicationStatus();
  };

  const handleSaveJob = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user || !job.id) return;

    setIsSaving(true);
    const userDocRef = doc(db, 'users', user.uid);
    try {
      if (isSaved) {
        await updateDoc(userDocRef, { savedJobs: arrayRemove(job.id) });
        toast({ title: "Job Unsaved", description: `"${job.title}" has been removed from your saved jobs.` });
      } else {
        await updateDoc(userDocRef, { savedJobs: arrayUnion(job.id) });
        toast({ title: "Job Saved!", description: `"${job.title}" has been added to your saved jobs.` });
      }
      setIsSaved(!isSaved); 
      await refreshUserProfile(); 
    } catch (error) {
      console.error("Error saving job:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to update saved jobs. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOneClickApply = async () => {
    if (!user || !userProfile || !userProfile.cvUrl || !job.id) {
      toast({ variant: "destructive", title: "Cannot Apply", description: "Your profile is missing a CV or there's an issue with the job details." });
      return;
    }
    
    setIsQuickApplying(true);
    try {
      const appCollectionRef = collection(db, 'applications');
      const applicationData = {
        candidateId: user.uid,
        candidateName: userProfile.displayName || userProfile.email,
        candidateEmail: user.email,
        jobId: job.id,
        jobTitle: job.title,
        recruiterId: job.recruiterId,
        cvUrl: userProfile.cvUrl,
        cloudinaryPublicId: userProfile.cvPublicId || null,
        appliedAt: serverTimestamp(),
        status: 'Applied' as const,
        aiScore: null,
        aiAnalysisSummary: "AI analysis not available for one-click apply.",
        aiStrengths: [],
        aiWeaknesses: [],
        companyName: job.companyName || 'A Company',
        companyLogoUrl: job.companyLogoUrl || '',
      };

      await addDoc(appCollectionRef, applicationData);

      // Increment the application count on the job
      const jobDocRef = doc(db, 'jobs', job.id);
      await updateDoc(jobDocRef, {
        applicationCount: increment(1),
      });

      toast({
        title: 'Application Submitted!',
        description: `You've successfully applied for ${job.title} using your saved CV.`
      });
      checkApplicationStatus();
    } catch (error: any) {
      console.error("Error during one-click apply:", error);
      toast({
        variant: "destructive",
        title: "Application Failed",
        description: error.message || "Could not submit your application. Please try again."
      });
    } finally {
      setIsQuickApplying(false);
    }
  };

  const showApplyAction = !isRecruiterView && userProfile?.role === 'candidate' && job.id;
  const canQuickApply = !!userProfile?.cvUrl;
  const jobForDialogs = job as OriginalJobType;

  return (
    <>
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
        <CardHeader>
           <div className="flex items-center gap-3">
              {job.companyLogoUrl ? (
                <Avatar>
                  <AvatarImage src={job.companyLogoUrl} alt={`${job.companyName} logo`} className="object-contain" />
                  <AvatarFallback>{job.companyName?.charAt(0)}</AvatarFallback>
                </Avatar>
              ) : (
                <Avatar>
                  <AvatarFallback>{job.companyName?.charAt(0) || 'C'}</AvatarFallback>
                </Avatar>
              )}
              <div>
                <CardTitle className="text-xl font-headline text-primary">{job.title}</CardTitle>
                <CardDescription className="text-sm font-medium text-muted-foreground">{job.companyName || "A Company"}</CardDescription>
              </div>
          </div>
          <p className="text-xs text-muted-foreground pt-2">Posted {postedDate}</p>
        </CardHeader>
        <CardContent className="flex-grow space-y-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2 text-primary" />
            {job.location}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Briefcase className="h-4 w-4 mr-2 text-primary" />
            {job.contractType}
          </div>
          {job.applicationCount !== undefined && !isRecruiterView && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-2 text-primary" />
              {job.applicationCount > 0
                ? `${job.applicationCount} applicant(s)`
                : 'Be the first to apply'}
            </div>
          )}
          <p className="text-sm line-clamp-3 pt-2">{job.description}</p>
        </CardContent>
        <CardFooter className="border-t pt-4 flex flex-wrap justify-between items-center gap-y-2 gap-x-4">
          <Button variant="outline" size="sm" onClick={() => setIsJobDetailsDialogOpen(true)}>
            <Eye className="mr-2 h-4 w-4" /> View Details
          </Button>

          {isRecruiterView && userProfile?.role === 'recruiter' && job.id && (
            <Button variant="outline" size="sm" onClick={() => setIsViewApplicantsDialogOpen(true)}>
              <Users className="mr-2 h-4 w-4" /> View Applicants
            </Button>
          )}

          {showApplyAction && !authLoading && (
             <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSaveJob}
                disabled={isSaving}
                title={isSaved ? "Unsave job" : "Save job"}
                className="h-9 w-9 text-muted-foreground hover:text-primary"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className={cn("h-4 w-4", isSaved && "fill-primary text-primary")} />}
              </Button>
              
              {checkingApplicationStatus ? (
                <Button variant="outline" size="sm" disabled>Checking...</Button>
              ) : hasApplied ? (
                <Button variant="ghost" size="sm" disabled className="text-green-600">
                  <CheckCircle className="mr-2 h-4 w-4" /> Applied
                </Button>
              ) : isQuickApplying ? (
                 <Button variant="default" size="sm" disabled className="bg-accent/80">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Applying...
                </Button>
              ) : (
                <Button 
                    variant="default" 
                    size="sm" 
                    onClick={canQuickApply ? handleOneClickApply : () => setIsApplyDialogOpen(true)} 
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    title={canQuickApply ? "Apply using your saved CV" : "Upload CV and apply"}
                >
                    <Send className="mr-2 h-4 w-4" /> Apply Now
                </Button>
              )}
            </div>
          )}
        </CardFooter>
      </Card>

      <JobDetailsDialog
        job={jobForDialogs}
        open={isJobDetailsDialogOpen}
        onOpenChange={setIsJobDetailsDialogOpen}
        onApply={showApplyAction && !hasApplied ? (canQuickApply ? handleOneClickApply : () => setIsApplyDialogOpen(true)) : undefined}
        isCandidateView={showApplyAction && !hasApplied}
      />

      {job.id && showApplyAction && (
        <ApplyJobDialog
          job={jobForDialogs} 
          open={isApplyDialogOpen}
          onOpenChange={setIsApplyDialogOpen}
          onApplicationSubmitted={handleApplicationSubmitted}
        />
      )}

      {job.id && isRecruiterView && userProfile?.role === 'recruiter' && (
        <ViewApplicantsDialog
            job={jobForDialogs} 
            open={isViewApplicantsDialogOpen}
            onOpenChange={setIsViewApplicantsDialogOpen}
        />
      )}
    </>
  );
}

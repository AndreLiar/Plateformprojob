
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
import { collection, query, where, getDocs, limit, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import ViewApplicantsDialog from '@/components/dashboard/recruiter/ViewApplicantsDialog';
import JobDetailsDialog from '@/components/jobs/JobDetailsDialog';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

interface JobForCard extends Omit<OriginalJobType, 'createdAt' | 'updatedAt' | 'platform'> {
  id: string;
  platform: string;
  technologies: string;
  modules?: string;
  createdAt?: Timestamp | string; // Allow string for serialized date from server
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
      setIsSaved(!isSaved); // Toggle state locally for immediate feedback
      await refreshUserProfile(); // Refresh context
    } catch (error) {
      console.error("Error saving job:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to update saved jobs. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };


  const showApplyAction = !isRecruiterView && userProfile?.role === 'candidate' && job.id;
  const jobForDialogs = job as OriginalJobType;

  return (
    <>
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary">{job.title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">Posted {postedDate}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Settings2 className="h-4 w-4 mr-2 text-primary" />
            Platform: {job.platform}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2 text-primary" />
            {job.location}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Briefcase className="h-4 w-4 mr-2 text-primary" />
            {job.contractType}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Zap className="h-4 w-4 mr-2 text-primary" />
            {job.experienceLevel} Level
          </div>
          <p className="text-sm line-clamp-3">{job.description}</p>
          
          {(job.technologies && typeof job.technologies === 'string' && job.technologies.trim() !== "") && (
            <div className="pt-2">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Tech Stack:</h4>
              {job.technologies.split(',').map(tech => tech.trim()).filter(tech => tech).map(tech => (
                  <Badge key={tech} variant="secondary" className="mr-1 mb-1">{tech}</Badge>
              ))}
            </div>
          )}

          {job.modules && job.modules.trim() !== "" && (
            <div className="pt-2">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center">
                <Layers className="h-3 w-3 mr-1" /> Modules/Specializations:
              </h4>
              {job.modules.split(',').map(mod => mod.trim()).filter(mod => mod).map(mod => (
                <Badge key={mod} variant="outline" className="mr-1 mb-1 bg-muted/50 border-muted-foreground/30">{mod}</Badge>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4 flex flex-wrap justify-end items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsJobDetailsDialogOpen(true)}>
            <Eye className="mr-2 h-4 w-4" /> View Details
          </Button>

          {isRecruiterView && userProfile?.role === 'recruiter' && job.id && (
            <Button variant="outline" size="sm" onClick={() => setIsViewApplicantsDialogOpen(true)}>
              <Users className="mr-2 h-4 w-4" /> View Applicants
            </Button>
          )}

          {showApplyAction && !authLoading && (
             <>
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
              ) : (
                <Button variant="default" size="sm" onClick={() => setIsApplyDialogOpen(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Send className="mr-2 h-4 w-4" /> Apply Now
                </Button>
              )}
            </>
          )}
        </CardFooter>
      </Card>

      <JobDetailsDialog
        job={jobForDialogs}
        open={isJobDetailsDialogOpen}
        onOpenChange={setIsJobDetailsDialogOpen}
        onApply={showApplyAction && !hasApplied ? () => setIsApplyDialogOpen(true) : undefined}
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


"use client";

import type { Job as OriginalJobType, Timestamp } from '@/lib/types'; 
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, MapPin, Zap, CheckCircle, Send, Users, Settings2, Layers } from 'lucide-react'; // Added Layers for modules
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect, useCallback } from 'react';
import ApplyJobDialog from '@/components/jobs/ApplyJobDialog';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import ViewApplicantsDialog from '@/components/dashboard/recruiter/ViewApplicantsDialog'; 


interface JobForCard extends Omit<OriginalJobType, 'createdAt' | 'updatedAt' | 'platform'> {
  id: string; 
  platform: string; 
  technologies: string; 
  modules?: string; // Added modules
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

interface JobListCardProps {
  job: JobForCard;
  isRecruiterView?: boolean; 
}

export default function JobListCard({ job, isRecruiterView = false }: JobListCardProps) {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplicationStatus, setCheckingApplicationStatus] = useState(false);
  const [isViewApplicantsDialogOpen, setIsViewApplicantsDialogOpen] = useState(false);

  const getProcessedDate = (dateInput: Timestamp | string | undefined): Date | null => {
    if (!dateInput) return null;
    if (typeof dateInput === 'string') {
      const d = new Date(dateInput);
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
    checkApplicationStatus();
  };

  const showApplyAction = !isRecruiterView && userProfile?.role === 'candidate' && job.id;
  const jobForDialog = job as OriginalJobType; 

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
          <div className="pt-2">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Tech Stack:</h4>
            {job.technologies.split(',').map(tech => tech.trim()).filter(tech => tech).map(tech => (
              <Badge key={tech} variant="secondary" className="mr-1 mb-1">{tech}</Badge>
            ))}
          </div>
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
        <CardFooter className="border-t pt-4 flex justify-end">
          {isRecruiterView && userProfile?.role === 'recruiter' && job.id ? (
            <Button variant="outline" size="sm" onClick={() => setIsViewApplicantsDialogOpen(true)}>
              <Users className="mr-2 h-4 w-4" /> View Applicants
            </Button>
          ) : showApplyAction && !authLoading ? (
            checkingApplicationStatus ? (
              <Button variant="outline" size="sm" disabled>Checking Status...</Button>
            ) : hasApplied ? (
              <Button variant="ghost" size="sm" disabled className="text-green-600">
                <CheckCircle className="mr-2 h-4 w-4" /> Applied
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={() => setIsApplyDialogOpen(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Send className="mr-2 h-4 w-4" /> Apply Now
              </Button>
            )
          ) : null}
        </CardFooter>
      </Card>

      {job.id && showApplyAction && !isRecruiterView && (
        <ApplyJobDialog
          job={jobForDialog} 
          open={isApplyDialogOpen}
          onOpenChange={setIsApplyDialogOpen}
          onApplicationSubmitted={handleApplicationSubmitted}
        />
      )}

      {job.id && isRecruiterView && userProfile?.role === 'recruiter' && (
        <ViewApplicantsDialog
            job={jobForDialog} 
            open={isViewApplicantsDialogOpen}
            onOpenChange={setIsViewApplicantsDialogOpen}
        />
      )}
    </>
  );
}

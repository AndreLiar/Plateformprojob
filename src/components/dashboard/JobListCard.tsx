
"use client";

import type { Job as OriginalJobType, Timestamp } from '@/lib/types'; // Original Job type
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, MapPin, Zap, CheckCircle, Send } from 'lucide-react'; // Removed CalendarDays as it's not used directly for display here
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect, useCallback } from 'react';
import ApplyJobDialog from '@/components/jobs/ApplyJobDialog';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

// Define a type for the job prop that JobListCard can receive, allowing for string or Timestamp dates
interface JobForCard extends Omit<OriginalJobType, 'createdAt' | 'updatedAt'> {
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

interface JobListCardProps {
  job: JobForCard;
}

export default function JobListCard({ job }: JobListCardProps) {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplicationStatus, setCheckingApplicationStatus] = useState(false);

  const getProcessedDate = (dateInput: Timestamp | string | undefined): Date | null => {
    if (!dateInput) return null;
    if (typeof dateInput === 'string') {
      const d = new Date(dateInput);
      return isNaN(d.getTime()) ? null : d; // Check for invalid date string
    }
    // Check if it's a Firestore Timestamp (it has a toDate method)
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
    if (userProfile?.role === 'candidate' && job.id) {
      checkApplicationStatus();
    }
  }, [userProfile, job.id, checkApplicationStatus]);
  
  const handleApplicationSubmitted = () => {
    setHasApplied(true); 
    checkApplicationStatus();
  };

  const showApplyAction = userProfile?.role === 'candidate' && job.id;

  // Ensure the job object passed to ApplyJobDialog is compatible with its expected `Job` type.
  // Since ApplyJobDialog primarily uses id, title, recruiterId, this should be okay.
  // If ApplyJobDialog needed Timestamp dates, we'd have to convert strings back or fetch the original job.
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
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Platforms/Tech:</h4>
            <Badge variant="secondary">{job.platform}</Badge>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4 flex justify-end">
          {showApplyAction && !authLoading && (
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
          )}
        </CardFooter>
      </Card>
      {job.id && showApplyAction && (
        <ApplyJobDialog
          job={jobForDialog} // Pass the suitably typed job object
          open={isApplyDialogOpen}
          onOpenChange={setIsApplyDialogOpen}
          onApplicationSubmitted={handleApplicationSubmitted}
        />
      )}
    </>
  );
}

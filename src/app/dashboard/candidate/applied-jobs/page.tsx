"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Briefcase, FileSearch, Clock, PlusCircle, ExternalLink, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, Timestamp, doc, getDoc } from "firebase/firestore";
import type { Application, Job } from "@/lib/types";
import { format } from 'date-fns';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import JobDetailsDialog from "@/components/jobs/JobDetailsDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const statusColors: { [key: string]: string } = {
    "Applied": "bg-green-100 text-green-800 border-green-300",
    "Under Review": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "Interviewing": "bg-blue-100 text-blue-800 border-blue-300",
    "Offer Extended": "bg-teal-100 text-teal-800 border-teal-300",
    "Rejected": "bg-red-100 text-red-800 border-red-300",
    "Withdrawn": "bg-gray-100 text-gray-800 border-gray-300",
};

export default function AppliedJobsPage() {
  const { user, loading: authLoading } = useAuth();
  const [appliedJobs, setAppliedJobs] = useState<Application[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [fetchingJobId, setFetchingJobId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const fetchAppliedJobs = async () => {
        setLoadingJobs(true);
        try {
          const applicationsRef = collection(db, "applications");
          const q = query(
            applicationsRef,
            where("candidateId", "==", user.uid),
            orderBy("appliedAt", "desc")
          );
          const querySnapshot = await getDocs(q);
          const fetchedApplications = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as Application));
          setAppliedJobs(fetchedApplications);
        } catch (error) {
          console.error("Error fetching applied jobs:", error);
        } finally {
          setLoadingJobs(false);
        }
      };
      fetchAppliedJobs();
    } else if (!authLoading) {
      setLoadingJobs(false);
    }
  }, [user, authLoading]);

  const handleViewDetails = async (jobId: string) => {
    if (!jobId) return;
    setFetchingJobId(jobId);
    try {
        const jobDocRef = doc(db, "jobs", jobId);
        const jobDocSnap = await getDoc(jobDocRef);
        if (jobDocSnap.exists()) {
            setSelectedJob({ id: jobDocSnap.id, ...jobDocSnap.data() } as Job);
            setIsDetailsOpen(true);
        } else {
            console.error("Job not found");
            // Optionally show a toast notification to the user
        }
    } catch (error) {
        console.error("Error fetching job details:", error);
    } finally {
        setFetchingJobId(null);
    }
  };


  const isLoading = authLoading || loadingJobs;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Card className="shadow-lg rounded-lg">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3 mb-1">
              <Briefcase className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl font-headline text-primary">My Applied Jobs</CardTitle>
            </div>
            <CardDescription>Loading your job application history...</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-md" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasAppliedJobs = appliedJobs.length > 0;

  return (
    <>
      <div className="space-y-8">
        <Card className="shadow-lg rounded-lg">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3 mb-1">
              <Briefcase className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl font-headline text-primary">My Applied Jobs</CardTitle>
            </div>
            <CardDescription>Track the status of your job applications and manage your job search journey.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {!user && !authLoading && (
              <Alert variant="destructive">
                  <FileSearch className="h-5 w-5"/>
                  <AlertDescription>
                    Please log in to view your applied jobs.
                  </AlertDescription>
                </Alert>
            )}
            {user && !hasAppliedJobs && !loadingJobs && (
              <div className="text-center py-12 border border-dashed rounded-md bg-muted/20">
                <FileSearch className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-foreground mb-3">No Applications Yet</h3>
                <p className="text-md text-muted-foreground mb-6">
                  Once you apply for jobs, they will appear here with their current status.
                </p>
                <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link href="/jobs">
                    <PlusCircle className="mr-2 h-5 w-5" /> Find and Apply for Jobs
                  </Link>
                </Button>
              </div>
            )}
            {user && hasAppliedJobs && (
              <div className="space-y-6">
                {appliedJobs.map((app) => (
                  <Card key={app.id} className="shadow-md hover:shadow-lg transition-shadow rounded-md overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                         <div className="flex items-start gap-4">
                            {app.companyLogoUrl ? (
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={app.companyLogoUrl} alt={`${app.companyName} logo`} className="object-contain" />
                                <AvatarFallback>{app.companyName?.charAt(0) || 'C'}</AvatarFallback>
                              </Avatar>
                            ) : (
                               <Avatar className="w-12 h-12">
                                <AvatarFallback>{app.companyName?.charAt(0) || 'C'}</AvatarFallback>
                              </Avatar>
                            )}
                            <div>
                              <CardTitle className="text-xl text-primary">
                                {app.jobTitle || "Job Title Not Available"}
                              </CardTitle>
                              <CardDescription className="font-medium text-foreground">{app.companyName || "Company Not Available"}</CardDescription>
                            </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusColors[app.status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                          {app.status}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4 text-sm text-muted-foreground space-y-1">
                      <p>Applied on: {app.appliedAt?.toDate ? format(app.appliedAt.toDate(), 'PPP') : 'Date not available'}</p>
                      {app.cvUrl && (
                          <p className="flex items-center gap-1">
                              Submitted CV: 
                              <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="p-0 h-auto text-primary"
                                  onClick={() => window.open(app.cvUrl, '_blank')}
                              >
                                  View CV <ExternalLink className="ml-1 h-3 w-3"/>
                              </Button>
                          </p>
                      )}
                    </CardContent>
                    <CardFooter className="bg-muted/30 py-3 px-6 border-t flex justify-between items-center">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(app.jobId)} disabled={!!fetchingJobId}>
                        {fetchingJobId === app.jobId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSearch className="mr-2 h-4 w-4"/>}
                        View Job Details
                      </Button>
                      {app.status === "Applied" && (
                          <Button variant="outline" size="sm" disabled>
                              Withdraw Application (Future)
                          </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md rounded-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Understanding Application Statuses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Applied:</strong> Your application has been successfully submitted.</p>
            <p><strong>Under Review:</strong> Recruiters are looking at your profile and application.</p>
            <p><strong>Interviewing:</strong> You've advanced to an interview stage. Check your email!</p>
            <p><strong>Offer Extended:</strong> Congratulations! You've received a job offer.</p>
            <p><strong>Rejected:</strong> The position may have been filled or other candidates were selected.</p>
            <p><strong>Withdrawn:</strong> You have withdrawn your application from consideration.</p>
            <p className="mt-2 text-xs">Note: Statuses are updated by recruiters. There might be delays.</p>
          </CardContent>
        </Card>
      </div>

       {selectedJob && (
        <JobDetailsDialog 
          job={selectedJob} 
          open={isDetailsOpen} 
          onOpenChange={setIsDetailsOpen} 
          isCandidateView={false} // Don't show apply button from this view
        />
      )}
    </>
  );
}

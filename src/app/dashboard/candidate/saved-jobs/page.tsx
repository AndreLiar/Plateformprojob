
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, documentId } from "firebase/firestore";
import type { Job } from "@/lib/types";
import JobListCard from "@/components/dashboard/JobListCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Bookmark, Search, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SavedJobsPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    if (userProfile && userProfile.role === 'candidate') {
      const fetchSavedJobs = async () => {
        setLoadingJobs(true);
        const savedJobIds = userProfile.savedJobs;

        if (savedJobIds && savedJobIds.length > 0) {
          try {
            const jobsRef = collection(db, "jobs");
            // Firestore 'in' query can take up to 30 items per query.
            // For a production app with >30 saved jobs, we'd need to chunk requests.
            const q = query(jobsRef, where(documentId(), "in", savedJobIds));
            const querySnapshot = await getDocs(q);
            const fetchedJobs = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            } as Job));
            
            // To maintain the order in which jobs were saved is tricky without a timestamp.
            // For now, we'll sort them by creation date.
            const sortedJobs = fetchedJobs.sort((a, b) => 
                (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)
            );
            setSavedJobs(sortedJobs);

          } catch (error) {
            console.error("Error fetching saved jobs:", error);
            setSavedJobs([]);
          }
        } else {
          setSavedJobs([]);
        }
        setLoadingJobs(false);
      };
      fetchSavedJobs();
    } else if (!authLoading) {
      setLoadingJobs(false);
    }
  }, [userProfile, authLoading]);

  const isLoading = authLoading || loadingJobs;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg rounded-lg">
          <CardHeader>
             <div className="flex items-center gap-3 mb-1">
              <Bookmark className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl font-headline text-primary">Saved Jobs</CardTitle>
            </div>
            <CardDescription>Loading your saved jobs...</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col space-y-3">
                  <Skeleton className="h-[125px] w-full rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-3/5" />
                  </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg rounded-lg">
         <CardHeader>
            <div className="flex items-center gap-3 mb-1">
              <Bookmark className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl font-headline text-primary">My Saved Jobs</CardTitle>
            </div>
            <CardDescription>Review jobs you've bookmarked for later application.</CardDescription>
        </CardHeader>
        <CardContent>
          {savedJobs.length === 0 ? (
             <div className="text-center py-12 border border-dashed rounded-md bg-muted/20">
              <Bookmark className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-foreground mb-3">No Saved Jobs</h3>
              <p className="text-md text-muted-foreground mb-6">
                You haven't saved any jobs yet. Browse jobs and click the bookmark icon to save them.
              </p>
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/jobs">
                  <Search className="mr-2 h-5 w-5" /> Browse Jobs
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedJobs.map(job => (
                <JobListCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

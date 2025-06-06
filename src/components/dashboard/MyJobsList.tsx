
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import type { Job } from '@/lib/types';
import JobListCard from './JobListCard'; // JobListCard now handles recruiter view
import { Loader2, PlusCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function MyJobsList() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchJobs = async () => {
        setLoadingJobs(true);
        try {
          const jobsCollection = collection(db, 'jobs');
          const q = query(
            jobsCollection, 
            where('recruiterId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const fetchedJobs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
          setJobs(fetchedJobs);
        } catch (error) {
          console.error("Error fetching jobs: ", error);
        } finally {
          setLoadingJobs(false);
        }
      };
      fetchJobs();
    } else {
      setLoadingJobs(false); 
    }
  }, [user]);

  const totalLoading = authLoading || loadingJobs;

  if (totalLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <p className="text-center text-muted-foreground">Please log in to see your jobs.</p>;
  }

  const freePosts = userProfile?.freePostsRemaining ?? 0;
  const purchasedPosts = userProfile?.purchasedPostsRemaining ?? 0;
  const canPost = freePosts > 0 || purchasedPosts > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-headline font-semibold text-primary">My Job Postings</h2>
        <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="/dashboard/post-job">
            <PlusCircle className="mr-2 h-5 w-5" /> Post New Job
          </Link>
        </Button>
      </div>

      <Alert variant={canPost ? "default" : "destructive"} className="bg-card border-border">
        <Info className="h-4 w-4" />
        <AlertTitle>{canPost ? "Available Job Posts" : "No Job Posts Remaining"}</AlertTitle>
        <AlertDescription>
          You have <strong>{freePosts}</strong> free post(s) and <strong>{purchasedPosts}</strong> purchased post(s) left.
          {!canPost && " Please visit 'Post New Job' to purchase more."}
        </AlertDescription>
      </Alert>

      {jobs.length === 0 ? (
        <Card className="text-center py-10 shadow-lg border-dashed bg-muted/20">
          <CardHeader>
              <CardTitle className="text-2xl font-headline">No Jobs Posted Yet</CardTitle>
              <CardDescription className="text-muted-foreground">
              Start building your team by posting your first job opportunity using your available credits.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link href="/dashboard/post-job">
                      <PlusCircle className="mr-2 h-5 w-5" /> Post Your First Job
                  </Link>
              </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map(job => (
            // Pass isRecruiterView={true} to JobListCard
            <JobListCard key={job.id} job={job} isRecruiterView={true} />
          ))}
        </div>
      )}
    </div>
  );
}

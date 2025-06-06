"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import type { Job } from '@/lib/types';
import JobListCard from './JobListCard';
import { Loader2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


export default function MyJobsList() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchJobs = async () => {
        setLoading(true);
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
          // Optionally, show a toast message
        } finally {
          setLoading(false);
        }
      };
      fetchJobs();
    } else {
      setLoading(false); // Not logged in, so not loading jobs.
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <p className="text-center text-muted-foreground">Please log in to see your jobs.</p>;
  }

  if (jobs.length === 0) {
    return (
      <Card className="text-center py-10 shadow-lg">
        <CardHeader>
            <CardTitle className="text-2xl font-headline">No Jobs Posted Yet</CardTitle>
            <CardDescription className="text-muted-foreground">
            Start building your team by posting your first job opportunity.
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
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-headline font-semibold mb-6 text-primary">My Job Postings</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map(job => (
          <JobListCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}


import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Job } from '@/lib/types';
import JobListCard from '@/components/dashboard/JobListCard'; // Reusing the card, suitable for public view
import { Briefcase } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

async function getJobs(): Promise<Job[]> {
  if (!db) {
    console.warn("Firestore DB instance is not available for fetching jobs.");
    return [];
  }
  try {
    const jobsCollection = collection(db, 'jobs');
    const q = query(jobsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const jobs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Ensure Firestore Timestamps are correctly handled if they need conversion
      // For direct usage in components, they might be fine, but often need toDate()
      return {
        id: doc.id,
        ...data,
        // If createdAt/updatedAt are not Timestamps on read, conversion might be needed earlier
        // For now, assuming JobListCard handles Timestamp objects correctly for date formatting
        createdAt: data.createdAt as Timestamp, 
        updatedAt: data.updatedAt as Timestamp,
      } as Job;
    });
    return jobs;
  } catch (error) {
    console.error("Error fetching jobs for public listing: ", error);
    return []; // Return empty array on error
  }
}

export default async function BrowseJobsPage() {
  const jobs = await getJobs();

  if (!jobs || jobs.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto shadow-xl text-center">
          <CardHeader>
            <div className="mx-auto bg-primary text-primary-foreground rounded-full p-4 w-fit mb-4">
              <Briefcase className="h-12 w-12" />
            </div>
            <CardTitle className="text-3xl font-headline">No Jobs Available Right Now</CardTitle>
            <CardDescription className="text-lg text-muted-foreground mt-2">
              It looks like there are no job openings posted at the moment.
              Please check back soon!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-6">
              Are you a recruiter? Help us grow by posting opportunities.
            </p>
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/dashboard/post-job">
                Post a Job
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-headline font-bold mb-10 text-center text-primary">
        Find Your Next Platform Engineering Role
      </h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map(job => (
          <JobListCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}

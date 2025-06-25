
import { collection, getDocs, orderBy, query, Timestamp, doc, where, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Job, UserProfile } from '@/lib/types'; 
import JobListCard from '@/components/dashboard/JobListCard'; 
import { Briefcase } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Update SerializedJob to include new company fields
interface SerializedJob extends Omit<Job, 'createdAt' | 'updatedAt'> {
  id: string;
  createdAt: string; 
  updatedAt: string; 
}

async function getJobs(): Promise<SerializedJob[]> {
  if (!db) {
    console.warn("Firestore DB instance is not available for fetching jobs.");
    return [];
  }
  try {
    const jobsCollection = collection(db, 'jobs');
    const q = query(jobsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const jobsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Job) }));

    const jobsMissingCompanyInfo = jobsData.filter(job => !job.companyName);
    const recruiterIdsToFetch = [...new Set(jobsMissingCompanyInfo.map(job => job.recruiterId))];

    const recruiterProfilesMap = new Map<string, UserProfile>();

    if (recruiterIdsToFetch.length > 0) {
      // Note: Firestore 'in' query is limited to 30 items. For larger scale, this would need chunking.
      const usersRef = collection(db, 'users');
      // Chunking the array to handle more than 30 IDs if necessary
      const MAX_IN_CLAUSE_SIZE = 30;
      for (let i = 0; i < recruiterIdsToFetch.length; i += MAX_IN_CLAUSE_SIZE) {
          const chunk = recruiterIdsToFetch.slice(i, i + MAX_IN_CLAUSE_SIZE);
          const usersQuery = query(usersRef, where(documentId(), 'in', chunk));
          const usersSnapshot = await getDocs(usersQuery);
          usersSnapshot.forEach(doc => {
            recruiterProfilesMap.set(doc.id, doc.data() as UserProfile);
          });
      }
    }

    const jobs: SerializedJob[] = jobsData.map(job => {
      let companyName = job.companyName;
      let companyLogoUrl = job.companyLogoUrl;
      let companyDescription = job.companyDescription;
      let companyWebsite = job.companyWebsite;

      if (!companyName && recruiterProfilesMap.has(job.recruiterId)) {
        const recruiterProfile = recruiterProfilesMap.get(job.recruiterId);
        companyName = recruiterProfile?.companyName;
        companyLogoUrl = recruiterProfile?.companyLogoUrl;
        companyDescription = recruiterProfile?.companyDescription;
        companyWebsite = recruiterProfile?.companyWebsite;
      }

      return {
        id: job.id,
        title: job.title,
        description: job.description,
        platform: job.platform,
        technologies: job.technologies,
        modules: job.modules || "",
        location: job.location,
        contractType: job.contractType,
        experienceLevel: job.experienceLevel,
        recruiterId: job.recruiterId,
        applicationCount: job.applicationCount ?? 0,
        createdAt: (job.createdAt as Timestamp).toDate().toISOString(),
        updatedAt: (job.updatedAt as Timestamp).toDate().toISOString(),
        // Use the enriched data
        companyName: companyName || '',
        companyLogoUrl: companyLogoUrl || '',
        companyDescription: companyDescription || '',
        companyWebsite: companyWebsite || '',
      };
    });

    return jobs;
  } catch (error) {
    console.error("Error fetching jobs for public listing: ", error);
    return [];
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map(job => (
          <JobListCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}

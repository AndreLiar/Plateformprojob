
"use client";

import { useEffect, useState } from 'react';
import type { Application, Job as OriginalJobType } from '@/lib/types'; // Assuming OriginalJobType has Timestamp dates
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ExternalLink, UserX, FileText, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added Alert components
import { useToast } from '@/hooks/use-toast'; // Added useToast
import Link from 'next/link'; // Added Link for the Firebase console URL

// Define a type for the job prop that ViewApplicantsDialog can receive
interface JobForDialog extends Omit<OriginalJobType, 'createdAt' | 'updatedAt'> {
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
  // id is crucial
}

interface ViewApplicantsDialogProps {
  job: JobForDialog;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: { [key: string]: string } = {
    "Applied": "bg-green-100 text-green-800 border-green-300",
    "Under Review": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "Interviewing": "bg-blue-100 text-blue-800 border-blue-300",
    "Offer Extended": "bg-teal-100 text-teal-800 border-teal-300",
    "Rejected": "bg-red-100 text-red-800 border-red-300",
    "Withdrawn": "bg-gray-100 text-gray-800 border-gray-300",
};


export default function ViewApplicantsDialog({ job, open, onOpenChange }: ViewApplicantsDialogProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [missingIndexError, setMissingIndexError] = useState(false); // New state for index error
  const { toast } = useToast(); // Initialize toast

  const firestoreIndexCreationUrl = "https://console.firebase.google.com/v1/r/project/marketplace-79e9c/firestore/indexes?create_composite=ClZwcm9qZWN0cy9tYXJrZXRwbGFjZS03OWU5Yy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvYXBwbGljYXRpb25zL2luZGV4ZXMvXxABGgkKBWpvYklkEAEaDQoJYXBwbGllZEF0EAIaDAoIX19uYW1lX18QAg";


  useEffect(() => {
    if (open && job?.id) {
      const fetchApplications = async () => {
        setLoading(true);
        setMissingIndexError(false); // Reset error state on new fetch
        try {
          const applicationsRef = collection(db, 'applications');
          const q = query(
            applicationsRef,
            where('jobId', '==', job.id),
            orderBy('appliedAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const fetchedApplications = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as Application));
          setApplications(fetchedApplications);
        } catch (error: any) {
          console.error("Error fetching applications:", error);
          if (error.code === 'failed-precondition' && error.message.includes('query requires an index')) {
            setApplications([]);
            setMissingIndexError(true);
          } else {
            toast({
              variant: "destructive",
              title: "Error Fetching Applicants",
              description: error.message || "Could not load applicants. Please try again.",
            });
          }
        } finally {
          setLoading(false);
        }
      };
      fetchApplications();
    } else {
      // If dialog is closed or no job ID, clear applications and error
      setApplications([]);
      setMissingIndexError(false);
    }
  }, [open, job?.id, toast]); // Added toast to dependency array

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary">Applicants for: {job.title}</DialogTitle>
          <DialogDescription>
            Review candidates who have applied for this position.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-6">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : missingIndexError ? (
            <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle>Firestore Index Required</AlertTitle>
              <AlertDescription>
                <p className="mb-2">
                  To view applicants, a specific Firestore index needs to be created.
                  This is a one-time setup for this type of query.
                </p>
                <p>
                  Please click the link below to go to your Firebase console and create the index.
                  It usually takes a few minutes to build.
                </p>
                <Button variant="link" asChild className="p-0 h-auto text-destructive-foreground hover:underline">
                  <Link href={firestoreIndexCreationUrl} target="_blank" rel="noopener noreferrer">
                    Create Firestore Index Now
                  </Link>
                </Button>
                <p className="mt-2 text-xs">
                  The required index is for the 'applications' collection, on fields: 'jobId' (ascending) and 'appliedAt' (descending).
                </p>
              </AlertDescription>
            </Alert>
          ) : applications.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <UserX className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-xl font-semibold">No applicants yet.</p>
              <p>Check back later to see who has applied for this role.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">CV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.candidateName || 'N/A'}</TableCell>
                    <TableCell>{app.candidateEmail || 'N/A'}</TableCell>
                    <TableCell>
                      {app.appliedAt?.toDate ? format(app.appliedAt.toDate(), 'PPp') : 'N/A'}
                    </TableCell>
                    <TableCell>
                       <Badge
                        variant="outline"
                        className={`text-xs font-semibold ${statusColors[app.status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}
                      >
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(app.cvUrl, '_blank')}
                        disabled={!app.cvUrl}
                        className="hover:bg-accent hover:text-accent-foreground"
                      >
                        <FileText className="mr-2 h-4 w-4" /> View CV <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
        <div className="pt-4 border-t mt-auto">
            <DialogClose asChild>
                <Button variant="outline" className="w-full sm:w-auto">Close</Button>
            </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

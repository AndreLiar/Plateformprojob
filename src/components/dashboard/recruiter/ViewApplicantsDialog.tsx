
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
import { Loader2, ExternalLink, UserX, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  useEffect(() => {
    if (open && job?.id) {
      const fetchApplications = async () => {
        setLoading(true);
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
        } catch (error) {
          console.error("Error fetching applications:", error);
          // Handle error (e.g., show toast)
        } finally {
          setLoading(false);
        }
      };
      fetchApplications();
    }
  }, [open, job?.id]);

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
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
                    <TableCell className="text-right">
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

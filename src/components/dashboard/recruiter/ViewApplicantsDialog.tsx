
"use client";

import { useEffect, useState, useCallback } from 'react';
import type { Application, Job as OriginalJobType } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore'; // Removed doc, updateDoc
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ExternalLink, UserX, FileText, AlertTriangle, Sparkles, Info } from 'lucide-react'; // Removed TrendingUp, ChevronsUpDown
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { TooltipProvider } from '@/components/ui/tooltip'; // Removed Tooltip, TooltipContent, TooltipTrigger

interface JobForDialog extends Omit<OriginalJobType, 'createdAt' | 'updatedAt'> {
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

interface ViewApplicantsDialogProps {
  job: JobForDialog;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const firestoreIndexCreationUrl = "https://console.firebase.google.com/v1/r/project/marketplace-79e9c/firestore/indexes?create_composite=ClZwcm9qZWN0cy9tYXJrZXRwbGFjZS03OWU5Yy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvYXBwbGljYXRpb25zL2luZGV4ZXMvXxABGgkKBWpvYklkEAEaDQoJYXBwbGllZEF0EAIaDAoIX19uYW1lX18QAg";

export default function ViewApplicantsDialog({ job, open, onOpenChange }: ViewApplicantsDialogProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [missingIndexError, setMissingIndexError] = useState(false);
  const { toast } = useToast();

  const fetchApplications = useCallback(async () => {
    if (!job?.id) return;
    setLoading(true);
    setMissingIndexError(false);
    try {
      const applicationsRef = collection(db, 'applications');
      const q = query(
        applicationsRef,
        where('jobId', '==', job.id),
        orderBy('appliedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      let fetchedApplications = querySnapshot.docs.map(doc => ({
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
  }, [job?.id, toast]);

  useEffect(() => {
    if (open) {
      fetchApplications();
    } else {
      setApplications([]); // Clear applications when dialog closes
      setMissingIndexError(false);
    }
  }, [open, fetchApplications]);


  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="font-headline text-2xl text-primary">Applicants for: {job.title}</DialogTitle>
          <DialogDescription>
            Review candidates who applied. AI insights are coming soon.
          </DialogDescription>
        </DialogHeader>
        <TooltipProvider> {/* TooltipProvider is still needed for other potential tooltips within ShadCN components */}
        <ScrollArea className="flex-grow px-6">
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
                  To view applicants efficiently, a Firestore index is likely needed.
                </p>
                <p>
                  If you see this message, please consider adding the composite index for 'jobId' (ascending) and 'appliedAt' (descending) on the 'applications' collection in your Firebase console.
                  <Link href={firestoreIndexCreationUrl} target="_blank" rel="noopener noreferrer" className="text-destructive-foreground underline ml-1">
                     Click here for a pre-filled index creation link.
                  </Link>
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
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[25%]">Candidate</TableHead>
                  <TableHead className="w-[25%]">Email</TableHead>
                  <TableHead className="w-[10%]">
                    <div className="flex items-center">
                      <Sparkles className="mr-1 h-3 w-3 text-primary opacity-70" /> AI Score
                    </div>
                  </TableHead>
                  <TableHead className="w-[20%]">
                     <div className="flex items-center">
                        <Info className="mr-1 h-3 w-3 text-primary opacity-70" /> AI Summary
                    </div>
                  </TableHead>
                  <TableHead className="w-[10%]">
                     Applied On
                  </TableHead>
                  <TableHead className="w-[10%] text-right">CV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium py-3">{app.candidateName || 'N/A'}</TableCell>
                    <TableCell className="py-3">{app.candidateEmail || 'N/A'}</TableCell>
                    <TableCell className="py-3 text-center">
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                           N/A
                        </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">
                        {app.aiAnalysisSummary || "Coming Soon"}
                    </TableCell>
                    <TableCell className="py-3 text-xs">
                      {app.appliedAt?.toDate ? format(app.appliedAt.toDate(), 'PPp') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right py-3 whitespace-nowrap">
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
        </TooltipProvider>
        <DialogFooter className="p-6 pt-4 border-t mt-auto">
            <DialogClose asChild>
                <Button variant="outline" className="w-full sm:w-auto">Close</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

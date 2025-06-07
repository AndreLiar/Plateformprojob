
"use client";

import { useEffect, useState, useCallback } from 'react';
import type { Application, Job as OriginalJobType } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter, // Added DialogFooter
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ExternalLink, UserX, FileText, AlertTriangle, TrendingUp, ChevronsUpDown, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface JobForDialog extends Omit<OriginalJobType, 'createdAt' | 'updatedAt'> {
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
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

const firestoreIndexCreationUrl = "https://console.firebase.google.com/v1/r/project/marketplace-79e9c/firestore/indexes?create_composite=ClZwcm9qZWN0cy9tYXJrZXRwbGFjZS03OWU5Yy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvYXBwbGljYXRpb25zL2luZGV4ZXMvXxABGgkKBWpvYklkEAEaDQoJYXBwbGllZEF0EAIaDAoIX19uYW1lX18QAg"; // Keep this for reference

export default function ViewApplicantsDialog({ job, open, onOpenChange }: ViewApplicantsDialogProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [missingIndexError, setMissingIndexError] = useState(false);
  const [sortOrder, setSortOrder] = useState<'score_desc' | 'applied_desc'>('score_desc');
  const { toast } = useToast();

  const fetchApplications = useCallback(async () => {
    if (!job?.id) return;
    setLoading(true);
    setMissingIndexError(false);
    try {
      const applicationsRef = collection(db, 'applications');
      // We will sort client-side after fetching, simplifies Firestore query
      const q = query(
        applicationsRef,
        where('jobId', '==', job.id),
        orderBy('appliedAt', 'desc') // Base query order
      );
      const querySnapshot = await getDocs(q);
      let fetchedApplications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Application));

      // Client-side sorting based on current sortOrder
      if (sortOrder === 'score_desc') {
        fetchedApplications.sort((a, b) => (b.aiScore ?? -1) - (a.aiScore ?? -1));
      } else { // 'applied_desc' is already handled by Firestore or can be re-applied if needed
        // fetchedApplications.sort((a, b) => b.appliedAt.toMillis() - a.appliedAt.toMillis());
      }

      setApplications(fetchedApplications);
    } catch (error: any) {
      console.error("Error fetching applications:", error);
      if (error.code === 'failed-precondition' && error.message.includes('query requires an index')) {
        setApplications([]);
        setMissingIndexError(true); // This specific error implies an index is needed for the base query
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
  }, [job?.id, toast, sortOrder]);

  useEffect(() => {
    if (open) {
      fetchApplications();
    } else {
      setApplications([]);
      setMissingIndexError(false);
    }
  }, [open, fetchApplications]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'score_desc' ? 'applied_desc' : 'score_desc');
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="font-headline text-2xl text-primary">Applicants for: {job.title}</DialogTitle>
          <DialogDescription>
            Review candidates who applied. Click headers to sort. AI insights help rank candidates.
          </DialogDescription>
        </DialogHeader>
        <TooltipProvider>
        <ScrollArea className="flex-grow px-6"> {/* Added px-6 here for consistent padding */}
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
                  To view applicants efficiently, a Firestore index for 'jobId' and 'appliedAt' on the 'applications' collection might be needed.
                </p>
                <p>
                  If you see this message frequently or experience slow loads, consider adding the index in your Firebase console.
                  The current Firestore query attempts `where('jobId', '==', job.id), orderBy('appliedAt', 'desc')`.
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
                  <TableHead className="w-[20%]">Candidate</TableHead>
                  <TableHead className="w-[20%]">Email</TableHead>
                  <TableHead className="w-[10%] cursor-pointer hover:bg-muted/50" onClick={toggleSortOrder}>
                    <div className="flex items-center">
                      AI Score <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50" />
                      {sortOrder === 'score_desc' && <TrendingUp className="ml-1 h-3 w-3 text-primary" />}
                    </div>
                  </TableHead>
                  <TableHead className="w-[25%]">AI Summary</TableHead>
                  <TableHead className="w-[15%] cursor-pointer hover:bg-muted/50" onClick={toggleSortOrder}>
                     <div className="flex items-center">
                        Applied On <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50" />
                        {sortOrder === 'applied_desc' && <TrendingUp className="ml-1 h-3 w-3 text-primary" />}
                    </div>
                  </TableHead>
                  <TableHead className="w-[10%] text-right">CV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium py-3">{app.candidateName || 'N/A'}</TableCell>
                    <TableCell className="py-3">{app.candidateEmail || 'N/A'}</TableCell>
                    <TableCell className="py-3 font-semibold text-center">
                      {typeof app.aiScore === 'number' ? (
                        <Badge variant={app.aiScore > 75 ? "default" : app.aiScore > 50 ? "secondary" : "outline"}
                               className={app.aiScore > 75 ? "bg-green-500 text-white" : app.aiScore > 50 ? "bg-yellow-500 text-black" : "border-destructive text-destructive" }>
                            {app.aiScore}/100
                        </Badge>
                      ) : (
                        <Badge variant="outline">N/A</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <p className="line-clamp-2 cursor-help">
                                    {app.aiAnalysisSummary || (app.aiScore === 0 && app.aiAnalysisSummary?.startsWith("Error") ? "AI Error" : "Not analyzed yet")}
                                </p>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" align="start" className="max-w-xs bg-popover text-popover-foreground p-2 rounded shadow-lg">
                                <p className="font-bold mb-1">AI Analysis:</p>
                                <p className="text-xs mb-2">{app.aiAnalysisSummary || "No summary available."}</p>
                                {app.aiStrengths && app.aiStrengths.length > 0 && (
                                    <>
                                        <p className="font-semibold text-xs mt-1">Strengths:</p>
                                        <ul className="list-disc list-inside text-xs">
                                            {app.aiStrengths.map((s, i) => <li key={i}>{s}</li>)}
                                        </ul>
                                    </>
                                )}
                                {app.aiWeaknesses && app.aiWeaknesses.length > 0 && (
                                     <>
                                        <p className="font-semibold text-xs mt-1">Weaknesses/Gaps:</p>
                                        <ul className="list-disc list-inside text-xs">
                                            {app.aiWeaknesses.map((w, i) => <li key={i}>{w}</li>)}
                                        </ul>
                                    </>
                                )}
                            </TooltipContent>
                        </Tooltip>
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


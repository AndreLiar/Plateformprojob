
"use client";

import type { Job as OriginalJobType, Timestamp } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Briefcase, MapPin, Zap, Settings2, Layers, Clock, FileText } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

// This interface should match the structure of the job object passed to it
interface JobForDialog extends Omit<OriginalJobType, 'createdAt' | 'updatedAt' | 'id'> {
  id?: string; // id is often included from Firestore
  createdAt?: Timestamp | string; // Allow string for serialized dates
  updatedAt?: Timestamp | string;
}

interface JobDetailsDialogProps {
  job: JobForDialog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (job: JobForDialog) => void; // Optional: for an "Apply Now" button within the dialog
  isCandidateView?: boolean; // To show apply button
}

export default function JobDetailsDialog({ job, open, onOpenChange, onApply, isCandidateView }: JobDetailsDialogProps) {
  if (!job) {
    return null;
  }

  const getProcessedDate = (dateInput: Timestamp | string | undefined): Date | null => {
    if (!dateInput) return null;
    if (typeof dateInput === 'string') {
      const d = parseISO(dateInput); // Use parseISO for ISO strings
      return isNaN(d.getTime()) ? null : d;
    }
    if (dateInput && typeof (dateInput as Timestamp).toDate === 'function') {
      return (dateInput as Timestamp).toDate();
    }
    return null;
  };

  const creationDate = getProcessedDate(job.createdAt);
  const postedDate = creationDate ? formatDistanceToNow(creationDate, { addSuffix: true }) : 'N/A';

  const technologies = (job.technologies && typeof job.technologies === 'string')
    ? job.technologies.split(',').map(tech => tech.trim()).filter(tech => tech)
    : [];

  const modules = (job.modules && typeof job.modules === 'string')
    ? job.modules.split(',').map(mod => mod.trim()).filter(mod => mod)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline text-primary">{job.title}</DialogTitle>
          <DialogDescription className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1.5" /> Posted {postedDate}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto"> {/* Changed classes here */}
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="flex items-start">
                <Settings2 className="h-4 w-4 mr-2 mt-0.5 text-primary shrink-0" />
                <div>
                  <span className="font-medium text-foreground">Platform:</span> {job.platform}
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="h-4 w-4 mr-2 mt-0.5 text-primary shrink-0" />
                <div>
                  <span className="font-medium text-foreground">Location:</span> {job.location}
                </div>
              </div>
              <div className="flex items-start">
                <Briefcase className="h-4 w-4 mr-2 mt-0.5 text-primary shrink-0" />
                <div>
                  <span className="font-medium text-foreground">Contract:</span> {job.contractType}
                </div>
              </div>
              <div className="flex items-start">
                <Zap className="h-4 w-4 mr-2 mt-0.5 text-primary shrink-0" />
                <div>
                  <span className="font-medium text-foreground">Experience:</span> {job.experienceLevel} Level
                </div>
              </div>
            </div>

            {technologies.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1.5 flex items-center">
                  <Zap className="h-4 w-4 mr-1.5 text-primary" /> Key Technologies
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {technologies.map(tech => (
                    <Badge key={tech} variant="secondary">{tech}</Badge>
                  ))}
                </div>
              </div>
            )}

            {modules.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1.5 flex items-center">
                  <Layers className="h-4 w-4 mr-1.5 text-primary" /> Modules/Specializations
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {modules.map(mod => (
                    <Badge key={mod} variant="outline" className="bg-muted/50 border-muted-foreground/30">{mod}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1.5 flex items-center">
                <FileText className="h-4 w-4 mr-1.5 text-primary" /> Full Job Description
              </h4>
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap break-words">
                {job.description}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t gap-2 sm:gap-0"> {/* Removed mt-auto */}
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
          {isCandidateView && onApply && job && (
             <Button 
                onClick={() => onApply(job)} 
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Apply Now
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    

"use client";

import type { Job as OriginalJobType, Timestamp, UserProfile } from '@/lib/types';
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
import { Briefcase, MapPin, Zap, Settings2, Clock, FileText, Link as LinkIcon, Building } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';


interface JobForDialog extends Omit<OriginalJobType, 'createdAt' | 'updatedAt' | 'id'> {
  id?: string;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

interface JobDetailsDialogProps {
  job: JobForDialog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (job: JobForDialog) => void;
  isCandidateView?: boolean;
}

interface CompanyInfo {
    name?: string;
    website?: string;
    description?: string;
    logoUrl?: string;
}


export default function JobDetailsDialog({ job, open, onOpenChange, onApply, isCandidateView }: JobDetailsDialogProps) {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [isLoadingCompanyInfo, setIsLoadingCompanyInfo] = useState(false);

  useEffect(() => {
    const fetchCompanyInfoForLegacyJobs = async () => {
        if (!job || !job.recruiterId) return;

        // If company info is already denormalized on the job object, use it directly.
        if (job.companyName) {
            setCompanyInfo({
                name: job.companyName,
                website: job.companyWebsite,
                description: job.companyDescription,
                logoUrl: job.companyLogoUrl,
            });
            return;
        }

        // Otherwise, fetch it from the recruiter's user profile (for legacy jobs).
        setIsLoadingCompanyInfo(true);
        try {
            const userDocRef = doc(db, 'users', job.recruiterId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const recruiterProfile = userDocSnap.data() as UserProfile;
                setCompanyInfo({
                    name: recruiterProfile.companyName,
                    website: recruiterProfile.companyWebsite,
                    description: recruiterProfile.companyDescription,
                    logoUrl: recruiterProfile.companyLogoUrl,
                });
            }
        } catch (error) {
            console.error("Error fetching legacy company info:", error);
            setCompanyInfo(null);
        } finally {
            setIsLoadingCompanyInfo(false);
        }
    };

    if (open && job) {
        fetchCompanyInfoForLegacyJobs();
    }
    
    // Reset when dialog closes
    if (!open) {
        setCompanyInfo(null);
        setIsLoadingCompanyInfo(false);
    }
  }, [open, job]);

  if (!job) {
    return null;
  }

  const getProcessedDate = (dateInput: Timestamp | string | undefined): Date | null => {
    if (!dateInput) return null;
    if (typeof dateInput === 'string') {
      const d = parseISO(dateInput);
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
    
  const hasCompanyInfo = companyInfo && companyInfo.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-headline text-primary">{job.title}</DialogTitle>
          <DialogDescription className="flex items-center text-sm text-muted-foreground pt-1">
            <Clock className="h-4 w-4 mr-1.5" /> Posted {postedDate}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 border-y">
          <div className="p-6 space-y-6">
            
            {/* Company Info Section */}
            {isLoadingCompanyInfo && (
              <div className="p-4 rounded-lg bg-muted/30 border space-y-3">
                  <Skeleton className="h-5 w-1/3" />
                  <div className="flex items-start gap-4">
                      <Skeleton className="w-20 h-20 rounded-md shrink-0" />
                      <div className="flex-grow space-y-2">
                          <Skeleton className="h-6 w-1/2" />
                          <Skeleton className="h-4 w-1/4" />
                          <Skeleton className="h-12 w-full" />
                      </div>
                  </div>
              </div>
            )}

            {hasCompanyInfo && (
              <div className="p-4 rounded-lg bg-muted/30 border">
                 <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Building className="h-5 w-5 text-primary"/> About the Company</h3>
                 <div className="flex items-start gap-4">
                    {companyInfo.logoUrl && (
                      <div className="relative w-20 h-20 shrink-0">
                        <Image src={companyInfo.logoUrl} alt={`${companyInfo.name || 'Company'} logo`} layout="fill" objectFit="contain" className="rounded-md"/>
                      </div>
                    )}
                    <div className="flex-grow">
                      <h4 className="font-bold text-xl">{companyInfo.name}</h4>
                      {companyInfo.website && (
                        <Button asChild variant="link" size="sm" className="p-0 h-auto text-primary">
                           <Link href={companyInfo.website} target="_blank" rel="noopener noreferrer" >
                             Visit Website <LinkIcon className="ml-1 h-3 w-3"/>
                           </Link>
                        </Button>
                      )}
                      <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{companyInfo.description}</p>
                    </div>
                 </div>
              </div>
            )}


            {/* Job Details Section */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/> Job Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm mb-4">
                <div className="flex items-start"><Settings2 className="h-4 w-4 mr-2 mt-0.5 text-primary shrink-0" /><div><span className="font-medium text-foreground">Platform:</span> {job.platform}</div></div>
                <div className="flex items-start"><MapPin className="h-4 w-4 mr-2 mt-0.5 text-primary shrink-0" /><div><span className="font-medium text-foreground">Location:</span> {job.location}</div></div>
                <div className="flex items-start"><Briefcase className="h-4 w-4 mr-2 mt-0.5 text-primary shrink-0" /><div><span className="font-medium text-foreground">Contract:</span> {job.contractType}</div></div>
                <div className="flex items-start"><Zap className="h-4 w-4 mr-2 mt-0.5 text-primary shrink-0" /><div><span className="font-medium text-foreground">Experience:</span> {job.experienceLevel} Level</div></div>
              </div>

              {technologies.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-foreground mb-1.5">Key Technologies</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {technologies.map(tech => <Badge key={tech} variant="secondary">{tech}</Badge>)}
                  </div>
                </div>
              )}

              {modules.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-foreground mb-1.5">Modules/Specializations</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {modules.map(mod => <Badge key={mod} variant="outline" className="bg-muted/50 border-muted-foreground/30">{mod}</Badge>)}
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1.5">Full Job Description</h4>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap break-words">
                  {job.description}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 gap-2 sm:gap-0">
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

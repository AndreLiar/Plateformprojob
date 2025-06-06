import type { Job } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, Zap, CalendarDays } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface JobListCardProps {
  job: Job;
}

export default function JobListCard({ job }: JobListCardProps) {
  const postedDate = job.createdAt?.toDate ? formatDistanceToNow(job.createdAt.toDate(), { addSuffix: true }) : 'N/A';
  
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-xl font-headline text-primary">{job.title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">Posted {postedDate}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-2 text-primary" />
          {job.location}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Briefcase className="h-4 w-4 mr-2 text-primary" />
          {job.contractType}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Zap className="h-4 w-4 mr-2 text-primary" />
          {job.experienceLevel} Level
        </div>
        <p className="text-sm line-clamp-3">{job.description}</p>
         <div className="pt-2">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Platforms/Tech:</h4>
          <Badge variant="secondary">{job.platform}</Badge>
        </div>
      </CardContent>
      <CardFooter>
        {/* Actions like Edit/Delete could go here in future */}
        {/* <Button variant="outline" size="sm">View Applicants</Button> */}
      </CardFooter>
    </Card>
  );
}

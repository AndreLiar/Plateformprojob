
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, FileSearch, Clock } from "lucide-react";

export default function AppliedJobsPage() {
  // This is a placeholder page.
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
            <div className="flex items-center gap-3 mb-2">
                <Briefcase className="h-8 w-8 text-primary" />
                <CardTitle className="text-3xl font-headline text-primary">My Applied Jobs</CardTitle>
            </div>
          <CardDescription>Track the status of your job applications.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Placeholder content - In a real app, this would list jobs the candidate applied to */}
          <div className="text-center py-10 border border-dashed rounded-md">
            <FileSearch className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Applications Yet</h3>
            <p className="text-sm text-muted-foreground">
              Once you apply for jobs, they will appear here.
            </p>
          </div>
        </CardContent>
      </Card>

       <Card className="shadow-md">
        <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Understanding Application Statuses
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Applied:</strong> Your application has been submitted.</p>
            <p><strong>Under Review:</strong> Recruiters are looking at your profile.</p>
            <p><strong>Interviewing:</strong> You've moved to the interview stage.</p>
            <p><strong>Offer Extended:</strong> Congratulations!</p>
            <p><strong>Not Selected:</strong> The position has been filled by another candidate.</p>
        </CardContent>
      </Card>
    </div>
  );
}

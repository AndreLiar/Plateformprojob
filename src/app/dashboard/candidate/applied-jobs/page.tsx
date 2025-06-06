
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Briefcase, FileSearch, Clock, PlusCircle } from "lucide-react";

// Mock data for applied jobs - replace with actual data fetching later
const mockAppliedJobs = [
  { id: "1", title: "Senior Platform Engineer", company: "Tech Solutions Inc.", status: "Under Review", appliedDate: "2024-07-15" },
  { id: "2", title: "DevOps Specialist", company: "Cloud Innovations LLC", status: "Interview Scheduled", appliedDate: "2024-07-10" },
  { id: "3", title: "Kubernetes Administrator", company: "Future Systems Co.", status: "Applied", appliedDate: "2024-07-20" },
];

const statusColors: { [key: string]: string } = {
    "Under Review": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "Interview Scheduled": "bg-blue-100 text-blue-800 border-blue-300",
    "Applied": "bg-green-100 text-green-800 border-green-300",
    "Offer Extended": "bg-teal-100 text-teal-800 border-teal-300",
    "Not Selected": "bg-red-100 text-red-800 border-red-300",
};


export default function AppliedJobsPage() {
  const hasAppliedJobs = mockAppliedJobs.length > 0; // Change this to check actual data

  return (
    <div className="space-y-8">
      <Card className="shadow-lg rounded-lg">
        <CardHeader className="border-b">
            <div className="flex items-center gap-3 mb-1">
                <Briefcase className="h-8 w-8 text-primary" />
                <CardTitle className="text-3xl font-headline text-primary">My Applied Jobs</CardTitle>
            </div>
          <CardDescription>Track the status of your job applications and manage your job search journey.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {!hasAppliedJobs ? (
            <div className="text-center py-12 border border-dashed rounded-md bg-muted/20">
              <FileSearch className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-foreground mb-3">No Applications Yet</h3>
              <p className="text-md text-muted-foreground mb-6">
                Once you apply for jobs, they will appear here with their current status.
              </p>
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/jobs">
                  <PlusCircle className="mr-2 h-5 w-5" /> Find and Apply for Jobs
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {mockAppliedJobs.map((job) => (
                <Card key={job.id} className="shadow-md hover:shadow-lg transition-shadow rounded-md overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl text-primary hover:underline">
                                <Link href={`/jobs/${job.id}`}>{job.title}</Link> {/* Assuming a job detail page later */}
                            </CardTitle>
                            <CardDescription className="text-sm">{job.company}</CardDescription>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusColors[job.status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                            {job.status}
                        </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-4 text-sm text-muted-foreground">
                    <p>Applied on: {new Date(job.appliedDate).toLocaleDateString()}</p>
                  </CardContent>
                  <CardFooter className="bg-muted/30 py-3 px-6 border-t">
                    <Button variant="link" size="sm" className="p-0 h-auto text-primary">
                        View Application Details (Coming Soon)
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

       <Card className="shadow-md rounded-lg">
        <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Understanding Application Statuses
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Applied:</strong> Your application has been successfully submitted to the recruiter.</p>
            <p><strong>Under Review:</strong> Recruiters are actively looking at your profile and application materials.</p>
            <p><strong>Interview Scheduled:</strong> You've advanced to an interview stage. Check your email for details!</p>
            <p><strong>Offer Extended:</strong> Congratulations! You've received a job offer.</p>
            <p><strong>Not Selected:</strong> The position may have been filled or other candidates were selected.</p>
            <p className="mt-2 text-xs">Note: Statuses are updated by recruiters. There might be delays.</p>
        </CardContent>
      </Card>
    </div>
  );
}


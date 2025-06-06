
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserCircle, Search, Briefcase, FileText } from "lucide-react";

export default function CandidateDashboardPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
          <CardTitle className="text-3xl font-headline">Welcome, Candidate!</CardTitle>
          <CardDescription className="text-primary-foreground/90 mt-1">
            This is your personal dashboard. Manage your profile, track applications, and find your next opportunity.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <p className="text-muted-foreground">
            From here, you can update your profile to attract recruiters, view the status of your job applications, or search for new job openings.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground w-full justify-start text-left p-4 h-auto shadow-md hover:shadow-lg transition-shadow">
              <Link href="/dashboard/candidate/profile" className="flex items-center gap-3">
                <UserCircle className="h-7 w-7" />
                <div>
                  <span className="font-semibold block">My Profile</span>
                  <span className="text-xs text-accent-foreground/80">View & Edit Your Details</span>
                </div>
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full justify-start text-left p-4 h-auto shadow-md hover:shadow-lg transition-shadow">
              <Link href="/jobs" className="flex items-center gap-3">
                <Search className="h-7 w-7 text-primary" />
                 <div>
                  <span className="font-semibold block">Browse Jobs</span>
                  <span className="text-xs text-muted-foreground">Find New Opportunities</span>
                </div>
              </Link>
            </Button>
             <Button asChild size="lg" variant="outline" className="w-full justify-start text-left p-4 h-auto shadow-md hover:shadow-lg transition-shadow">
              <Link href="/dashboard/candidate/applied-jobs" className="flex items-center gap-3">
                <Briefcase className="h-7 w-7 text-primary" />
                 <div>
                  <span className="font-semibold block">Applied Jobs</span>
                  <span className="text-xs text-muted-foreground">Track Your Applications</span>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-md rounded-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><FileText className="text-primary h-5 w-5" />Profile Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              A complete and up-to-date profile significantly increases your chances of getting noticed by recruiters.
            </p>
            <Button variant="link" asChild className="px-0 text-primary">
                <Link href="/dashboard/candidate/profile">Update Profile Now &rarr;</Link>
            </Button>
            {/* Consider adding a progress bar here based on profile completion status in the future */}
          </CardContent>
        </Card>
        <Card className="shadow-md rounded-lg">
          <CardHeader>
            <CardTitle className="text-xl">Quick Stats</CardTitle> {/* Placeholder */}
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">View a summary of your job search activity here soon.</p>
            {/* Placeholder for stats like applications sent, saved jobs, profile views */}
             <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li><span className="font-medium text-foreground">0</span> Applications Sent (Placeholder)</li>
                <li><span className="font-medium text-foreground">0</span> Saved Jobs (Placeholder)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

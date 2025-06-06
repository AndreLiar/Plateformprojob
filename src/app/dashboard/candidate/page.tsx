
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserCircle, Search } from "lucide-react";

export default function CandidateDashboardPage() {
  // This page can serve as a welcome page or redirect to the profile.
  // For now, let's make it a simple welcome page.
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary">Welcome to Your Dashboard</CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage your job applications, profile, and more.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            From here, you can update your profile to attract recruiters or view the status of your job applications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/dashboard/candidate/profile">
                <UserCircle className="mr-2 h-5 w-5" />
                View/Edit My Profile
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/jobs">
                <Search className="mr-2 h-5 w-5" />
                Browse Available Jobs
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for future widgets or summary information */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Profile Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Make sure your profile is up-to-date to get noticed!</p>
            {/* Could add a progress bar here in the future */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No recent activity to display.</p>
             {/* List recent applications or saved jobs here */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

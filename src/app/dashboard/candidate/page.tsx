
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserCircle, Search, Briefcase, FileText, Loader2, UserCheck, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { Progress } from "@/components/ui/progress";
import { calculateProfileStrength } from "@/lib/utils";

export default function CandidateDashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [applicationCount, setApplicationCount] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchApplicationCount = async () => {
        setLoadingStats(true);
        try {
          const applicationsRef = collection(db, "applications");
          const q = query(applicationsRef, where("candidateId", "==", user.uid));
          const snapshot = await getCountFromServer(q);
          setApplicationCount(snapshot.data().count);
        } catch (error) {
          console.error("Error fetching application count:", error);
          setApplicationCount(0); // Default to 0 on error
        } finally {
          setLoadingStats(false);
        }
      };
      fetchApplicationCount();
    } else if (!authLoading) {
      // Not logged in, not loading auth, so no stats to load
      setApplicationCount(0);
      setLoadingStats(false);
    }
  }, [user, authLoading]);

  const profileStrength = calculateProfileStrength(userProfile);

  const getProfileStrengthMessage = () => {
    if (profileStrength < 50) return "Your profile is looking a bit sparse. Add more details to get noticed!";
    if (profileStrength < 80) return "Great start! A few more details will make your profile stand out.";
    if (profileStrength < 100) return "Your profile is almost perfect! Just a few final touches.";
    return "Your profile is complete and looking great! Recruiters can now see your full potential.";
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
          <CardTitle className="text-3xl font-headline">Welcome, {userProfile?.displayName || 'Candidate'}!</CardTitle>
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
            <CardTitle className="text-xl flex items-center gap-2">
              <UserCheck className="text-primary h-5 w-5" /> Profile Strength
            </CardTitle>
            <CardDescription>A complete profile attracts more recruiters.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-2">
              <Progress value={profileStrength} className="w-full" aria-label={`Profile completion ${profileStrength}%`} />
              <span className="text-lg font-bold text-primary">{profileStrength}%</span>
            </div>
            <p className="text-muted-foreground text-xs mb-4">
              {getProfileStrengthMessage()}
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/candidate/profile">Update Profile <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-md rounded-lg">
          <CardHeader>
            <CardTitle className="text-xl">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            {authLoading || loadingStats ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading stats...</span>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground text-sm mb-3">
                  A summary of your job search activity.
                </p>
                <ul className="space-y-1 text-sm">
                  <li>
                    <span className="font-medium text-foreground">{applicationCount ?? 0}</span>
                    <span className="text-muted-foreground"> Applications Sent</span>
                  </li>
                  <li>
                    <span className="font-medium text-foreground">{userProfile?.savedJobs?.length ?? 0}</span>
                    <span className="text-muted-foreground"> Saved Jobs</span>
                  </li>
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

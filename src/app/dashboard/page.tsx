
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Briefcase, Users, WalletCards, PlusCircle, UserMinus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({ jobCount: 0, applicationCount: 0, withdrawnCount: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user && userProfile) {
      const fetchStats = async () => {
        setLoadingStats(true);
        try {
          // Fetch job count
          const jobsQuery = query(collection(db, "jobs"), where("recruiterId", "==", user.uid));
          const jobsSnapshot = await getCountFromServer(jobsQuery);
          
          // Fetch application count
          const appsQuery = query(collection(db, "applications"), where("recruiterId", "==", user.uid));
          const appsSnapshot = await getCountFromServer(appsQuery);
          
          // Fetch withdrawn count
          const appsWithdrawnQuery = query(collection(db, "applications"), where("recruiterId", "==", user.uid), where("status", "==", "Withdrawn"));
          const withdrawnSnapshot = await getCountFromServer(appsWithdrawnQuery);

          setStats({
            jobCount: jobsSnapshot.data().count,
            applicationCount: appsSnapshot.data().count,
            withdrawnCount: withdrawnSnapshot.data().count
          });

        } catch (error) {
          console.error("Error fetching dashboard stats:", error);
          setStats({ jobCount: 0, applicationCount: 0, withdrawnCount: 0 });
        } finally {
          setLoadingStats(false);
        }
      };
      fetchStats();
    } else if (!authLoading) {
      setLoadingStats(false);
    }
  }, [user, userProfile, authLoading]);

  const isLoading = authLoading || loadingStats;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Recruiter Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Here's a quick overview of your recruitment activity.
          </p>
        </div>
         <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="/dashboard/post-job">
            <PlusCircle className="mr-2 h-5 w-5" /> Post New Job
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs Posted</CardTitle>
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/4" /> : 
              <div className="text-2xl font-bold">{stats.jobCount}</div>
            }
            <p className="text-xs text-muted-foreground">
              Number of jobs you have created.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/4" /> :
              <div className="text-2xl font-bold">{stats.applicationCount}</div>
            }
            <p className="text-xs text-muted-foreground">
              Received across all your job posts.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications Withdrawn</CardTitle>
            <UserMinus className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/4" /> :
              <div className="text-2xl font-bold">{stats.withdrawnCount}</div>
            }
            <p className="text-xs text-muted-foreground">
              By candidates across all jobs.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Job Credits</CardTitle>
            <WalletCards className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-1/2" /> :
              <div className="text-2xl font-bold">
                {(userProfile?.freePostsRemaining ?? 0) + (userProfile?.purchasedPostsRemaining ?? 0)}
              </div>
            }
            <p className="text-xs text-muted-foreground">
              {userProfile?.freePostsRemaining ?? 0} free + {userProfile?.purchasedPostsRemaining ?? 0} purchased.
            </p>
          </CardContent>
        </Card>
      </div>

       <Card className="shadow-md">
        <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>Manage your postings or create a new one.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
             <Button asChild variant="outline">
                <Link href="/dashboard/my-jobs">
                    <Briefcase className="mr-2 h-4 w-4" /> View All My Jobs
                </Link>
            </Button>
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/dashboard/post-job">
                <PlusCircle className="mr-2 h-4 w-4" /> Post a New Job
              </Link>
            </Button>
        </CardContent>
       </Card>
    </div>
  );
}


"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ArrowRight, Briefcase, LayoutDashboard, Loader2 } from 'lucide-react'; // Added LayoutDashboard, Loader2
import Image from 'next/image';

export default function HomePage() {
  const { user, userProfile, loading } = useAuth(); // Added userProfile and loading

  return (
    <div className="container mx-auto px-4 py-12 md:py-20 text-center">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold mb-6">
          Find & Post <span className="text-primary">Platform Engineering</span> Jobs
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-10">
          PlatformPro Jobs is the leading destination for sourcing top-tier platform engineering talent and discovering your next career-defining role.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-12">
          {loading ? (
            <Button size="lg" disabled className="bg-accent text-accent-foreground shadow-lg">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
            </Button>
          ) : !user ? (
            <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg transition-transform hover:scale-105">
              <Link href="/signup">
                <Briefcase className="mr-2 h-5 w-5" /> Post a Job
              </Link>
            </Button>
          ) : userProfile?.role === 'recruiter' ? (
            <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg transition-transform hover:scale-105">
              <Link href="/dashboard/post-job">
                <Briefcase className="mr-2 h-5 w-5" /> Post a Job
              </Link>
            </Button>
          ) : userProfile?.role === 'candidate' ? (
            <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg transition-transform hover:scale-105">
              <Link href="/dashboard/candidate/profile">
                <LayoutDashboard className="mr-2 h-5 w-5" /> My Dashboard
              </Link>
            </Button>
          ) : (
            // Fallback for user logged in but profile/role not loaded or defined - shows if loading is false but profile is still missing
             <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg transition-transform hover:scale-105">
               <Link href="/signup"> 
                 <Briefcase className="mr-2 h-5 w-5" /> Post a Job
               </Link>
             </Button>
          )}
          <Button size="lg" variant="outline" asChild className="shadow-lg transition-transform hover:scale-105">
            <Link href="/jobs">
              Browse Jobs <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-16">
        <Image 
          src="https://placehold.co/1200x400.png"
          alt="Abstract representation of a professional network or job platform"
          data-ai-hint="teamwork collaboration"
          width={1200}
          height={400}
          className="rounded-lg shadow-xl mx-auto"
        />
      </div>

      <section className="mt-20 py-12 bg-card rounded-lg shadow-xl">
        <h2 className="text-3xl font-headline font-semibold mb-8">Why Choose PlatformPro Jobs?</h2>
        <div className="grid md:grid-cols-3 gap-8 px-6">
          <div className="p-6 rounded-md border">
            <h3 className="text-xl font-headline font-semibold mb-3 text-primary">Niche Focus</h3>
            <p className="text-muted-foreground">Dedicated solely to platform engineering, connecting specialized talent with relevant opportunities.</p>
          </div>
          <div className="p-6 rounded-md border">
            <h3 className="text-xl font-headline font-semibold mb-3 text-primary">Quality Candidates</h3>
            <p className="text-muted-foreground">Access a curated pool of skilled professionals actively seeking platform engineering roles.</p>
          </div>
          <div className="p-6 rounded-md border">
            <h3 className="text-xl font-headline font-semibold mb-3 text-primary">Streamlined Posting</h3>
            <p className="text-muted-foreground">Easily post job openings and manage applications through our intuitive recruiter dashboard.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

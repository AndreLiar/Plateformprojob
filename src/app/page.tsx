
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { 
  ArrowRight, 
  Briefcase, 
  LayoutDashboard, 
  Loader2,
  Rocket,
  Target,
  Users,
  Quote,
  UserCheck,
  Building
} from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Simple SVG logos as components for featured platforms
const SalesforceLogo = () => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500">
    <title>Salesforce</title>
    <path d="M11.35 15.39c.42.41.67.98.67 1.63 0 .66-.25 1.23-.67 1.64-.42.42-1 .67-1.65.67-.65 0-1.22-.25-1.64-.67-.42-.41-.66-1-.66-1.64 0-.65.24-1.22.66-1.63.42-.42.99-.67 1.64-.67.65 0 1.23.25 1.65.67Zm4.06-2.18c.34.33.53.79.53 1.32 0 .53-.19 1.05-.53 1.39-.33.34-.78.53-1.32.53-.53 0-1.04-.19-1.32-.53-.33-.34-.53-.86-.53-1.39 0-.53.2-1.06.53-1.32.28-.27.67-.45 1.32-.45.65 0 .99.18 1.32.45Zm-8.11 0c.33.33.53.79.53 1.32 0 .53-.2 1.05-.53 1.39-.28.34-.72.53-1.32.53-.6 0-1.11-.19-1.32-.53-.34-.34-.53-.86-.53-1.39 0-.53.19-1.06.53-1.32.21-.27.72-.45 1.32-.45.6 0 1.04.18 1.32.45Zm4.05-6.52c.68.68.68 2.02 0 2.7-.68.68-2.02.68-2.7 0-.68-.68-.68-2.02 0-2.7.68-.68 2.02-.68 2.7 0Z" fill="currentColor"/>
    <path d="M13.63 4.28c.53.53.53 1.54 0 2.07-.53.53-1.54.53-2.07 0-.53-.53-.53-1.54 0-2.07.53-.53 1.54-.53 2.07 0Z" fill="currentColor"/>
  </svg>
);

const SapLogo = () => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600">
    <title>SAP</title>
    <path d="M12.019.25L0 6.218v5.865l6.045 3.161v5.86l6.045 3.013 11.91-5.955V6.218L12.02.25zM6.045 7.822l5.975-2.943 5.975 2.943-5.975 3.013-5.975-3.013zm11.91 1.633l-5.903 2.943v5.64l5.903-3.013v-5.57zm-11.91 0v5.57l5.975 3.013v-5.64L6.045 9.455z" fill="currentColor"/>
  </svg>
);

const OracleLogo = () => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600">
    <title>Oracle</title>
    <path d="M14.24 16.5c-1.39 0-2.78-.5-3.88-1.48v-2.8c1.1.99 2.49 1.48 3.88 1.48 2.98 0 5.02-1.88 5.02-4.57s-2.04-4.57-5.02-4.57c-1.39 0-2.78.49-3.88 1.48V3.16C11.46 2.18 12.85 1.7 14.24 1.7c4.6 0 8.02 2.87 8.02 7.47s-3.42 7.33-8.02 7.33M1.74 3.16v13.58c1.1.99 2.49 1.48 3.88 1.48 2.98 0 5.02-1.88 5.02-4.57s-2.04-4.57-5.02-4.57c-1.39 0-2.78.49-3.88 1.48V3.16H1.74Z" fill="currentColor"/>
  </svg>
);

const HubspotLogo = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-orange-500">
        <title>HubSpot</title>
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3.844 14.71a.91.91 0 01-1.287 0l-1.928-1.928a.91.91 0 010-1.287l1.928-1.928a.91.91 0 011.287 1.287L14.2 12.5l1.644 1.644a.91.91 0 010 1.287l-.001.001zM9.444 9.59a.91.91 0 011.287 0l1.928 1.928a.91.91 0 010 1.287l-1.928 1.928a.91.91 0 01-1.287-1.287L9.8 12.5l-1.644-1.644a.91.91 0 010-1.287l.001-.001z" fill="currentColor"/>
    </svg>
);

export default function HomePage() {
  const { user, userProfile, loading } = useAuth();

  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-28 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold mb-6 text-primary">
            The Hub for Platform Engineering Talent
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10">
            Discover specialized roles in Salesforce, SAP, and Oracle. Connect with top-tier companies and deploy your expertise where it matters most.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            {loading ? (
              <Button size="lg" disabled className="bg-accent text-accent-foreground shadow-lg">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
              </Button>
            ) : !user ? (
              <>
                <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg transition-transform hover:scale-105">
                  <Link href="/signup?role=candidate">
                    <UserCheck className="mr-2 h-5 w-5" /> Find Your Next Role
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="shadow-lg transition-transform hover:scale-105">
                  <Link href="/signup?role=recruiter">
                    <Building className="mr-2 h-5 w-5" /> Post a Job
                  </Link>
                </Button>
              </>
            ) : (
               <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg transition-transform hover:scale-105">
                <Link href={userProfile?.role === 'recruiter' ? "/dashboard" : "/dashboard/candidate"}>
                  <LayoutDashboard className="mr-2 h-5 w-5" /> Go to Dashboard
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Featured Platforms Section */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-headline font-semibold text-center mb-10">Specializing In Top Enterprise Platforms</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
              <CardHeader>
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-card mb-4">
                  <SalesforceLogo />
                </div>
                <CardTitle>Salesforce</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Roles from Admin to Architect in the world's #1 CRM platform.</p>
              </CardContent>
            </Card>
            <Card className="text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
              <CardHeader>
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-card mb-4">
                  <SapLogo />
                </div>
                <CardTitle>SAP</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Opportunities in S/4HANA, Fiori, ABAP, and core SAP modules.</p>
              </CardContent>
            </Card>
            <Card className="text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
              <CardHeader>
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-card mb-4">
                  <OracleLogo />
                </div>
                <CardTitle>Oracle</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Find jobs in Oracle Cloud, Fusion, APEX, and database administration.</p>
              </CardContent>
            </Card>
            <Card className="text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
              <CardHeader>
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-card mb-4">
                  <HubspotLogo />
                </div>
                <CardTitle>HubSpot</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Explore careers in CRM, Marketing Automation, and CMS Hub.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Us Section */}
       <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-headline font-semibold mb-4">The PlatformPro Advantage</h2>
          <p className="text-lg text-muted-foreground mb-12">
            We bridge the gap between elite platform talent and the companies that need them.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 text-center">
            <Rocket className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-headline font-semibold mb-3">Direct Access</h3>
            <p className="text-muted-foreground">Recruiters connect directly with a pre-qualified pool of specialized professionals, saving time and resources.</p>
          </div>
          <div className="p-6 text-center">
            <Target className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-headline font-semibold mb-3">Niche Focus</h3>
            <p className="text-muted-foreground">No more sifting through generic job boards. Find roles and candidates that perfectly match your expertise.</p>
          </div>
          <div className="p-6 text-center">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-headline font-semibold mb-3">Community-Centric</h3>
            <p className="text-muted-foreground">Join a growing community dedicated to platform engineering excellence and career growth.</p>
          </div>
        </div>
      </section>
      
      {/* How it Works Section */}
       <section className="bg-muted py-20">
        <div className="container mx-auto px-4">
           <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-headline font-semibold mb-12">Simple, Fast, and Effective</h2>
           </div>
           <div className="grid md:grid-cols-2 gap-10 items-center">
                <div>
                    <h3 className="text-2xl font-headline font-semibold mb-6 text-primary">For Candidates</h3>
                    <ul className="space-y-6">
                        <li className="flex items-start">
                            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-lg mr-4 shrink-0">1</span>
                            <div>
                                <h4 className="font-semibold">Create Your Profile</h4>
                                <p className="text-muted-foreground">Showcase your skills and experience to attract top recruiters.</p>
                            </div>
                        </li>
                         <li className="flex items-start">
                            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-lg mr-4 shrink-0">2</span>
                            <div>
                                <h4 className="font-semibold">Browse Specialized Jobs</h4>
                                <p className="text-muted-foreground">Find opportunities you won't see on generic job boards.</p>
                            </div>
                        </li>
                         <li className="flex items-start">
                            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-lg mr-4 shrink-0">3</span>
                            <div>
                                <h4 className="font-semibold">Apply with One Click</h4>
                                <p className="text-muted-foreground">Upload your CV once and apply to multiple roles seamlessly.</p>
                            </div>
                        </li>
                    </ul>
                </div>
                 <div>
                    <Image 
                      src="https://img.freepik.com/free-photo/hiring-concept-with-empty-chair_23-2149519862.jpg?ga=GA1.1.307298436.1750762634&semt=ais_items_boosted&w=740"
                      alt="A professional candidate reviewing job opportunities on a laptop"
                      data-ai-hint="developer job search"
                      width={600}
                      height={400}
                      className="rounded-lg shadow-xl"
                    />
                </div>
           </div>
        </div>
       </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-headline font-semibold mb-12">Trusted by Professionals and Recruiters</h2>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="bg-card border-border shadow-lg">
            <CardContent className="p-8">
              <Quote className="h-8 w-8 text-primary mb-4" />
              <p className="text-muted-foreground mb-6 italic">"PlatformPro Jobs cut through the noise. We found a senior Salesforce architect in two weeks, a process that used to take months. The quality of candidates is unparalleled."</p>
              <div className="flex items-center">
                <Avatar className="h-12 w-12 mr-4">
                  <AvatarImage src="https://img.freepik.com/free-photo/portrait-business-woman-office_1398-6.jpg?ga=GA1.1.307298436.1750762634&semt=ais_items_boosted&w=740" alt="Avatar of a recruiter" data-ai-hint="woman portrait" />
                  <AvatarFallback>SR</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">Sarah Reynolds</p>
                  <p className="text-sm text-muted-foreground">Lead Recruiter, TechCorp</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-lg">
            <CardContent className="p-8">
              <Quote className="h-8 w-8 text-primary mb-4" />
              <p className="text-muted-foreground mb-6 italic">"As an SAP consultant, finding the right-fit roles was always a challenge. On PlatformPro, I found three relevant opportunities in my first search and landed my dream job."</p>
              <div className="flex items-center">
                <Avatar className="h-12 w-12 mr-4">
                  <AvatarImage src="https://img.freepik.com/free-photo/portrait-confident-young-businessman-with-his-arms-crossed_23-2148176206.jpg?ga=GA1.1.307298436.1750762634&semt=ais_items_boosted&w=740" alt="Avatar of a candidate" data-ai-hint="man portrait" />
                  <AvatarFallback>MJ</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">Michael Chen</p>
                  <p className="text-sm text-muted-foreground">Senior SAP FI/CO Consultant</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Final CTA Section */}
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-headline font-semibold mb-4">Ready to Take the Next Step?</h2>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Whether you're looking to hire the best or be hired by the best, your journey starts here.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg transition-transform hover:scale-105">
                <Link href="/jobs">
                  <Briefcase className="mr-2 h-5 w-5" /> Browse Open Roles
                </Link>
              </Button>
              <Button size="lg" asChild variant="outline" className="border-primary-foreground/50 hover:bg-primary-foreground/10 text-primary-foreground shadow-lg transition-transform hover:scale-105">
                <Link href="/signup">
                  Join PlatformPro Today <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
          </div>
        </div>
      </section>

    </div>
  );
}

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { UserCircle, Mail, Phone, LinkedinIcon, FileText, UploadCloud, Briefcase, GraduationCap, Settings } from "lucide-react"; // Changed Linkedin to LinkedinIcon for consistency if available

// This is a placeholder page. In a real app, this would involve a form and state management.
export default function CandidateProfilePage() {
  return (
    <Card className="shadow-xl rounded-lg">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3 mb-1">
            <UserCircle className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-headline text-primary">My Profile</CardTitle>
        </div>
        <CardDescription>Keep your professional information up-to-date to stand out to recruiters.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 p-6">
        
        <section>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2"><UserCircle className="h-5 w-5 text-primary"/> Basic Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="e.g., Jane Doe" defaultValue="Candidate Name" className="bg-muted/30"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="you@example.com" defaultValue="candidate@example.com" disabled className="bg-muted/30 cursor-not-allowed" />
                <p className="text-xs text-muted-foreground">Email is managed through your account settings.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="(123) 456-7890" className="bg-muted/30"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
                <div className="flex items-center gap-2">
                    <LinkedinIcon className="h-5 w-5 text-muted-foreground" />
                    <Input id="linkedin" placeholder="linkedin.com/in/yourprofile" className="bg-muted/30"/>
                </div>
              </div>
            </div>
        </section>
        
        <section>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary"/> Professional Summary</h3>
            <div className="space-y-2">
              <Label htmlFor="headline">Professional Headline</Label>
              <Input id="headline" placeholder="e.g., Experienced Software Engineer | Cloud Native Enthusiast" className="bg-muted/30"/>
              <p className="text-xs text-muted-foreground">A catchy headline that summarizes your expertise.</p>
            </div>
            <div className="space-y-2 mt-4">
              <Label htmlFor="summary">Summary/Bio</Label>
              <Textarea id="summary" placeholder="Tell recruiters about yourself, your skills, and career aspirations. Highlight your key achievements and what you're looking for in your next role." rows={6} className="bg-muted/30"/>
            </div>
        </section>

        <section>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Resume/CV
            </h3>
            <div className="p-6 border border-dashed rounded-md text-center bg-muted/20 hover:border-primary transition-colors">
                <UploadCloud className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-md font-medium text-foreground mb-1">Upload your Resume</p>
                <p className="text-sm text-muted-foreground mb-3">Drag & drop your file here, or click to browse.</p>
                <Button variant="outline" onClick={() => alert('Resume upload functionality to be implemented.')}>
                    <UploadCloud className="mr-2 h-4 w-4" /> Upload File (PDF, DOCX)
                </Button>
                <p className="text-xs text-muted-foreground mt-3">Current: my_resume_v2.pdf (Placeholder)</p>
            </div>
        </section>
        
        {/* Placeholder for skills, experience, education sections */}
        <section>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2"><Settings className="h-5 w-5 text-primary"/> Skills</h3>
            <div className="p-4 border rounded-md bg-muted/20">
                <p className="text-sm text-muted-foreground">
                    List your technical skills, tools, and specializations. (e.g., Kubernetes, Python, AWS, CI/CD)
                </p>
                <Input placeholder="Add skills (comma-separated)..." className="mt-2 bg-card" />
                 {/* Future: Display skills as tags */}
            </div>
        </section>
        
        <section>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary"/> Work Experience (Coming Soon)</h3>
            <div className="p-4 border rounded-md bg-muted/20">
            <p className="text-sm text-muted-foreground">
                Detail your previous roles, responsibilities, and accomplishments. This section is under development.
            </p>
            </div>
        </section>

        <section>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary"/> Education (Coming Soon)</h3>
             <div className="p-4 border rounded-md bg-muted/20">
            <p className="text-sm text-muted-foreground">
                List your degrees, certifications, and relevant coursework. This section is under development.
            </p>
            </div>
        </section>


        <div className="flex justify-end pt-4 border-t">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 text-base">
            <UserCircle className="mr-2 h-5 w-5" />
            Save Profile Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Briefcase, UserCircle, Mail, Phone, Linkedin, FileText, UploadCloud } from "lucide-react";


// This is a placeholder page. In a real app, this would involve a form and state management.
export default function CandidateProfilePage() {
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
            <UserCircle className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-headline text-primary">My Profile</CardTitle>
        </div>
        <CardDescription>Keep your professional information up-to-date.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" placeholder="e.g., Jane Doe" defaultValue="Candidate Name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="you@example.com" defaultValue="candidate@example.com" disabled />
            <p className="text-xs text-muted-foreground">Email is managed through your account settings.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="(123) 456-7890" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
                <div className="flex items-center gap-2">
                    <Linkedin className="h-5 w-5 text-muted-foreground" />
                    <Input id="linkedin" placeholder="linkedin.com/in/yourprofile" />
                </div>
            </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="headline">Professional Headline</Label>
          <Input id="headline" placeholder="e.g., Experienced Software Engineer | Cloud Native Enthusiast" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="summary">Summary/Bio</Label>
          <Textarea id="summary" placeholder="Tell recruiters about yourself, your skills, and career aspirations." rows={5} />
        </div>

        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Resume/CV
            </h3>
            <div className="p-4 border border-dashed rounded-md text-center">
                <UploadCloud className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">Drag & drop your resume here, or click to upload.</p>
                <Button variant="outline" size="sm" onClick={() => alert('Resume upload functionality to be implemented.')}>
                    Upload Resume (PDF, DOCX)
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Current: my_resume_v2.pdf (Placeholder)</p>
            </div>
        </div>
        
        {/* Placeholder for skills, experience, education sections */}
        <div className="space-y-2">
            <Label>Skills (Coming Soon)</Label>
            <p className="text-sm text-muted-foreground p-4 border rounded-md">
                A section to list and manage your skills will be available here.
            </p>
        </div>


        <div className="flex justify-end">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <UserCircle className="mr-2 h-5 w-5" />
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useEffect, useState, useId } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import type { WorkExperience, Education } from "@/lib/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UserCircle, LinkedinIcon, Briefcase, FileText, UploadCloud, Settings, GraduationCap, Loader2, ExternalLink, PlusCircle, Trash2, Edit, X, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format, parse } from 'date-fns';

const profileSchema = z.object({
  displayName: z.string().min(2, "Full name must be at least 2 characters.").max(50, "Full name is too long."),
  phone: z.string().max(20, "Phone number is too long.").optional().or(z.literal('')),
  linkedin: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  headline: z.string().max(100, "Headline is too long.").optional().or(z.literal('')),
  summary: z.string().max(1500, "Summary is too long.").optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const emptyWorkExperience: WorkExperience = { id: '', title: '', company: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' };
const emptyEducation: Education = { id: '', institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' };

export default function CandidateProfilePage() {
  const { user, userProfile, loading: authLoading, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // State for complex fields
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);

  // State for CV upload
  const [newCvFile, setNewCvFile] = useState<File | null>(null);
  const [cvUploadError, setCvUploadError] = useState<string | null>(null);
  
  // Dialog states
  const [isWorkDialogOpen, setIsWorkDialogOpen] = useState(false);
  const [currentWork, setCurrentWork] = useState<WorkExperience | null>(null);
  
  const [isEduDialogOpen, setIsEduDialogOpen] = useState(false);
  const [currentEdu, setCurrentEdu] = useState<Education | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: "", phone: "", linkedin: "", headline: "", summary: "" },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        displayName: userProfile.displayName || "",
        phone: userProfile.phone || "",
        linkedin: userProfile.linkedin || "",
        headline: userProfile.headline || "",
        summary: userProfile.summary || "",
      });
      setSkills(userProfile.skills ? userProfile.skills.split(',').map(s => s.trim()).filter(Boolean) : []);
      setWorkExperience(userProfile.workExperience || []);
      setEducation(userProfile.education || []);
    }
  }, [userProfile, form]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // ... (same as before)
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newSkill = skillInput.trim();
      if (newSkill && !skills.includes(newSkill)) {
        setSkills([...skills, newSkill]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };
  
  // Work Experience Handlers
  const handleAddWork = () => {
    setCurrentWork(emptyWorkExperience);
    setIsWorkDialogOpen(true);
  };

  const handleEditWork = (exp: WorkExperience) => {
    setCurrentWork(exp);
    setIsWorkDialogOpen(true);
  };

  const handleDeleteWork = (id: string) => {
    setWorkExperience(workExperience.filter(exp => exp.id !== id));
  };

  const handleSaveWork = (exp: WorkExperience) => {
    if (exp.id) {
      setWorkExperience(workExperience.map(item => item.id === exp.id ? exp : item));
    } else {
      setWorkExperience([...workExperience, { ...exp, id: `work_${Date.now()}` }]);
    }
    setIsWorkDialogOpen(false);
  };

  // Education Handlers
  const handleAddEdu = () => {
    setCurrentEdu(emptyEducation);
    setIsEduDialogOpen(true);
  };

  const handleEditEdu = (edu: Education) => {
    setCurrentEdu(edu);
    setIsEduDialogOpen(true);
  };

  const handleDeleteEdu = (id: string) => {
    setEducation(education.filter(edu => edu.id !== id));
  };
  
  const handleSaveEdu = (edu: Education) => {
    if (edu.id) {
      setEducation(education.map(item => item.id === edu.id ? edu : item));
    } else {
      setEducation([...education, { ...edu, id: `edu_${Date.now()}` }]);
    }
    setIsEduDialogOpen(false);
  };


  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) {
      toast({ variant: "destructive", title: "Not authenticated" });
      return;
    }

    setIsSaving(true);
    let cvData: { cvUrl?: string; cvPublicId?: string } = {};

    if (newCvFile) {
      // ... CV upload logic (same as before)
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const updateData = {
        ...data,
        ...cvData,
        skills: skills.join(','),
        workExperience,
        education,
      };
      await updateDoc(userDocRef, updateData);
      
      await refreshUserProfile();
      setNewCvFile(null);
      toast({ title: "Profile Saved!", description: "Your information has been updated." });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save profile changes. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return <div className="flex justify-center items-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <Card className="shadow-xl rounded-lg">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3 mb-1">
              <UserCircle className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl font-headline text-primary">My Profile</CardTitle>
          </div>
          <CardDescription>Keep your professional information up-to-date to stand out to recruiters.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
              <section>
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2"><UserCircle className="h-5 w-5 text-primary"/> Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="displayName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormItem>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={userProfile?.email || ''} disabled className="bg-muted/30 cursor-not-allowed" />
                  </FormItem>
                   <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl><Input type="tel" placeholder="(123) 456-7890" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="linkedin" render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn Profile URL</FormLabel>
                      <div className="flex items-center gap-2">
                        <LinkedinIcon className="h-5 w-5 text-muted-foreground" />
                        <FormControl><Input placeholder="https://linkedin.com/in/yourprofile" {...field} /></FormControl>
                      </div>
                    </FormItem>
                  )} />
                </div>
              </section>

              <section>
                  <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary"/> Professional Summary</h3>
                  <div className="space-y-4">
                    <FormField control={form.control} name="headline" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professional Headline</FormLabel>
                        <FormControl><Input placeholder="e.g., Experienced Software Engineer | Cloud Native Enthusiast" {...field} /></FormControl>
                        <FormDescription>A catchy headline that summarizes your expertise.</FormDescription>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="summary" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Summary/Bio</FormLabel>
                        <FormControl><Textarea placeholder="Tell recruiters about yourself..." rows={6} {...field} /></FormControl>
                      </FormItem>
                    )} />
                  </div>
              </section>

              <section>
                  <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2"><Settings className="h-5 w-5 text-primary"/> Skills</h3>
                  <div className="p-4 border rounded-md bg-muted/20 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-base py-1 pl-3 pr-2">
                          {skill}
                          <button type="button" onClick={() => removeSkill(skill)} className="ml-2 rounded-full hover:bg-destructive/20 p-0.5">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <Input 
                      placeholder="Type a skill and press Enter..." 
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleSkillKeyDown}
                    />
                  </div>
                   <FormDescription className="pt-2">List your technical skills, tools, and specializations. Press Enter or comma to add a skill.</FormDescription>
              </section>
              
              <section>
                  <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary"/> Work Experience</h3>
                  <div className="space-y-4">
                      {workExperience.map((exp) => (
                          <Card key={exp.id} className="bg-muted/30">
                              <CardHeader className="flex flex-row justify-between items-start pb-2">
                                  <div>
                                      <CardTitle className="text-lg">{exp.title}</CardTitle>
                                      <CardDescription>{exp.company} {exp.location && `· ${exp.location}`}</CardDescription>
                                      <p className="text-xs text-muted-foreground pt-1">{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}</p>
                                  </div>
                                  <div className="flex gap-2">
                                      <Button type="button" variant="outline" size="icon" onClick={() => handleEditWork(exp)}><Pencil className="h-4 w-4"/></Button>
                                      <Button type="button" variant="destructive" size="icon" onClick={() => handleDeleteWork(exp.id)}><Trash2 className="h-4 w-4"/></Button>
                                  </div>
                              </CardHeader>
                              {exp.description && <CardContent><p className="text-sm whitespace-pre-wrap">{exp.description}</p></CardContent>}
                          </Card>
                      ))}
                  </div>
                  <Button type="button" variant="outline" onClick={handleAddWork} className="mt-4"><PlusCircle className="mr-2 h-4 w-4"/> Add Work Experience</Button>
              </section>

              <section>
                  <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary"/> Education</h3>
                  <div className="space-y-4">
                      {education.map((edu) => (
                          <Card key={edu.id} className="bg-muted/30">
                              <CardHeader className="flex flex-row justify-between items-start pb-2">
                                  <div>
                                      <CardTitle className="text-lg">{edu.institution}</CardTitle>
                                      <CardDescription>{edu.degree}{edu.fieldOfStudy && `, ${edu.fieldOfStudy}`}</CardDescription>
                                      <p className="text-xs text-muted-foreground pt-1">{edu.startDate} – {edu.endDate}</p>
                                  </div>
                                  <div className="flex gap-2">
                                      <Button type="button" variant="outline" size="icon" onClick={() => handleEditEdu(edu)}><Pencil className="h-4 w-4"/></Button>
                                      <Button type="button" variant="destructive" size="icon" onClick={() => handleDeleteEdu(edu.id)}><Trash2 className="h-4 w-4"/></Button>
                                  </div>
                              </CardHeader>
                          </Card>
                      ))}
                  </div>
                   <Button type="button" variant="outline" onClick={handleAddEdu} className="mt-4"><PlusCircle className="mr-2 h-4 w-4"/> Add Education</Button>
              </section>

              <div className="flex justify-end pt-8 border-t">
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 text-base" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserCircle className="mr-2 h-5 w-5" />}
                  {isSaving ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {isWorkDialogOpen && <WorkExperienceDialog isOpen={isWorkDialogOpen} onOpenChange={setIsWorkDialogOpen} onSave={handleSaveWork} experience={currentWork} />}
      {isEduDialogOpen && <EducationDialog isOpen={isEduDialogOpen} onOpenChange={setIsEduDialogOpen} onSave={handleSaveEdu} education={currentEdu} />}
    </>
  );
}


// Work Experience Dialog Component
function WorkExperienceDialog({ isOpen, onOpenChange, onSave, experience }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (exp: WorkExperience) => void, experience: WorkExperience | null }) {
  const [expData, setExpData] = useState<WorkExperience>(experience || emptyWorkExperience);
  
  useEffect(() => {
    setExpData(experience || emptyWorkExperience);
  }, [experience]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setExpData(prev => ({...prev, [name]: value}));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setExpData(prev => ({...prev, isCurrent: checked, endDate: checked ? '' : prev.endDate }));
  }

  const handleSaveClick = () => {
    onSave(expData);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{expData.id ? 'Edit' : 'Add'} Work Experience</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input name="title" placeholder="Job Title" value={expData.title} onChange={handleChange} />
          <Input name="company" placeholder="Company" value={expData.company} onChange={handleChange} />
          <Input name="location" placeholder="Location (e.g., San Francisco, CA)" value={expData.location} onChange={handleChange} />
          <div className="grid grid-cols-2 gap-4">
            <Input name="startDate" placeholder="Start Date (e.g., Jan 2020)" value={expData.startDate} onChange={handleChange} />
            <Input name="endDate" placeholder="End Date (e.g., Dec 2022)" value={expData.endDate} onChange={handleChange} disabled={expData.isCurrent} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="isCurrent" checked={expData.isCurrent} onCheckedChange={handleCheckboxChange} />
            <label htmlFor="isCurrent" className="text-sm font-medium leading-none">I currently work here</label>
          </div>
          <Textarea name="description" placeholder="Description of your role and accomplishments..." value={expData.description} onChange={handleChange} rows={5} />
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSaveClick}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Education Dialog Component
function EducationDialog({ isOpen, onOpenChange, onSave, education }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (edu: Education) => void, education: Education | null }) {
  const [eduData, setEduData] = useState<Education>(education || emptyEducation);
  
  useEffect(() => {
    setEduData(education || emptyEducation);
  }, [education]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEduData(prev => ({...prev, [name]: value}));
  };

  const handleSaveClick = () => {
    onSave(eduData);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{eduData.id ? 'Edit' : 'Add'} Education</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input name="institution" placeholder="School or Institution" value={eduData.institution} onChange={handleChange} />
          <Input name="degree" placeholder="Degree (e.g., Bachelor of Science)" value={eduData.degree} onChange={handleChange} />
          <Input name="fieldOfStudy" placeholder="Field of Study (e.g., Computer Science)" value={eduData.fieldOfStudy} onChange={handleChange} />
          <div className="grid grid-cols-2 gap-4">
            <Input name="startDate" placeholder="Start Date (e.g., Aug 2016)" value={eduData.startDate} onChange={handleChange} />
            <Input name="endDate" placeholder="End Date (e.g., May 2020)" value={eduData.endDate} onChange={handleChange} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSaveClick}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

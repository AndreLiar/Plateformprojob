import type { Timestamp } from 'firebase/firestore';

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string; 
  isCurrent: boolean;
  description?: string;
}

export interface Education {
  id:string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'recruiter' | 'candidate';
  createdAt: Timestamp;
  freePostsRemaining?: number;
  purchasedPostsRemaining?: number;
  
  // Recruiter specific
  companyName?: string;
  companyWebsite?: string;
  companyDescription?: string;
  companyLogoUrl?: string;
  companyLogoPublicId?: string;

  // Candidate specific
  savedJobs?: string[];
  phone?: string;
  linkedin?: string;
  headline?: string;
  summary?: string;
  skills?: string;
  cvUrl?: string;
  cvPublicId?: string;
  workExperience?: WorkExperience[];
  education?: Education[];
}

export type ContractType = 'Full-time' | 'Part-time' | 'Contract';
export type ExperienceLevel = 'Entry' | 'Mid' | 'Senior';

export interface Job {
  id?: string; // Firestore document ID
  title: string;
  description: string;
  platform: string;
  technologies: string;
  modules?: string;
  location: string;
  contractType: ContractType;
  experienceLevel: ExperienceLevel;
  recruiterId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Denormalized company data
  companyName?: string;
  companyWebsite?: string;
  companyDescription?: string;
  companyLogoUrl?: string;
}

export type ApplicationStatus = "Applied" | "Under Review" | "Interviewing" | "Offer Extended" | "Rejected" | "Withdrawn";

export interface Application {
  id?: string; // Firestore document ID
  candidateId: string;
  candidateName: string | null;
  candidateEmail: string | null;
  jobId: string;
  jobTitle: string;
  recruiterId: string;
  cvUrl: string;
  cloudinaryPublicId?: string;
  appliedAt: Timestamp;
  status: ApplicationStatus;
  aiScore?: number;
  aiAnalysisSummary?: string;
  aiStrengths?: string[];
  aiWeaknesses?: string[];
}
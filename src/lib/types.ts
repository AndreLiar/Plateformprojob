import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'recruiter' | 'candidate';
  createdAt: Timestamp;
  freePostsRemaining?: number; // Optional for existing users, will be set for new ones
  purchasedPostsRemaining?: number; // Optional for existing users
  savedJobs?: string[]; // Array of saved job IDs
  
  // Candidate specific fields
  phone?: string;
  linkedin?: string;
  headline?: string;
  summary?: string;
  skills?: string; // Comma-separated string of skills
  cvUrl?: string;
  cvPublicId?: string;
}

export type ContractType = 'Full-time' | 'Part-time' | 'Contract';
export type ExperienceLevel = 'Entry' | 'Mid' | 'Senior';

export interface Job {
  id?: string; // Firestore document ID
  title: string;
  description: string;
  platform: string; // This is the new platform category e.g. Salesforce, SAP
  technologies: string; // Comma-separated specific tech e.g. Kubernetes, AWS, GCP
  modules?: string; // Optional: Comma-separated modules e.g. Sales Cloud, FI/CO
  location: string;
  contractType: ContractType;
  experienceLevel: ExperienceLevel;
  recruiterId: string; // UID of the recruiter who posted
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ApplicationStatus = "Applied" | "Under Review" | "Interviewing" | "Offer Extended" | "Rejected" | "Withdrawn";

export interface Application {
  id?: string; // Firestore document ID
  candidateId: string;
  candidateName: string | null; // Denormalized for recruiter view
  candidateEmail: string | null; // Denormalized
  jobId: string;
  jobTitle: string; // Denormalized from Job for quick display
  recruiterId: string; // UID of the recruiter for this job
  cvUrl: string; // URL to the CV stored in Cloudinary
  cloudinaryPublicId?: string; // Public ID from Cloudinary if needed for management
  appliedAt: Timestamp;
  status: ApplicationStatus;
  // coverLetter?: string; // Optional
  aiScore?: number; // AI-generated score (e.g., 0-100)
  aiAnalysisSummary?: string; // Brief AI summary
  aiStrengths?: string[]; // Array of AI-identified strengths
  aiWeaknesses?: string[]; // Array of AI-identified weaknesses/gaps
}

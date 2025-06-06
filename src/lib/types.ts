
import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'recruiter' | 'candidate';
  createdAt: Timestamp;
  freePostsRemaining?: number; // Optional for existing users, will be set for new ones
  purchasedPostsRemaining?: number; // Optional for existing users
}

export type ContractType = 'Full-time' | 'Part-time' | 'Contract';
export type ExperienceLevel = 'Entry' | 'Mid' | 'Senior';

export interface Job {
  id?: string; // Firestore document ID
  title: string;
  description: string;
  platform: string; // e.g. Kubernetes, AWS, GCP
  location: string;
  contractType: ContractType;
  experienceLevel: ExperienceLevel;
  recruiterId: string; // UID of the recruiter who posted
  // companyName?: string; // Optional company name
  // companyLogo?: string; // Optional company logo URL
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
}

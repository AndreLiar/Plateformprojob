import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'recruiter' | 'candidate';
  createdAt: Timestamp;
}

export type ContractType = 'Full-time' | 'Part-time' | 'Contract';
export type ExperienceLevel = 'Entry' | 'Mid' | 'Senior';

export interface Job {
  id?: string;
  title: string;
  description: string;
  platform: string;
  location: string;
  contractType: ContractType;
  experienceLevel: ExperienceLevel;
  recruiterId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

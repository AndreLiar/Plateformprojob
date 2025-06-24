import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { UserProfile } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateProfileStrength(profile: UserProfile | null): number {
  if (!profile) {
    return 10; // Base for just having an account
  }

  let score = 0;
  const totalPoints = 6; // The number of fields we're checking

  if (profile.displayName && profile.displayName.trim() !== '') score++;
  if (profile.headline && profile.headline.trim() !== '') score++;
  if (profile.summary && profile.summary.trim() !== '') score++;
  if (profile.skills && profile.skills.trim() !== '') score++;
  if (profile.phone && profile.phone.trim() !== '') score++;
  if (profile.cvUrl && profile.cvUrl.trim() !== '') score++;

  // Base score of 10% for just existing, the rest 90% is for the fields
  const calculatedPercentage = 10 + Math.round((score / totalPoints) * 90);
  
  return calculatedPercentage;
}

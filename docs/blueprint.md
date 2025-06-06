# **App Name**: PlatformPro Jobs

## Core Features:

- Firebase Authentication: User sign-up/sign-in with Firebase Authentication (email + social login).
- Role Management: Role-based access control to differentiate between recruiter and candidate roles, defaulting new users to recruiter.
- Secure Recruiter Dashboard: A protected dashboard route available only to authenticated recruiter users.
- Job Posting: Job posting form allowing recruiters to enter job details (title, description, platform, location, contract type, experience level).
- Job Listing: Display of jobs in a list format inside the recruiter dashboard.
- Firestore Integration: Storage of job postings in Firestore under the `jobs/{jobId}` path.
- Homepage CTA: Homepage introducing the job board and guiding recruiters to post jobs with a call-to-action and login links.

## Style Guidelines:

- Primary color: Deep indigo (#3F51B5) to reflect the professional platform engineering focus.
- Background color: Light gray (#F5F5F5), almost white, for a clean, modern feel.
- Accent color: Cyan (#00BCD4) for interactive elements and calls to action.
- Body font: 'Inter' sans-serif, for a neutral, readable style in body text. Headline Font: 'Space Grotesk' for headlines and titles, providing a tech-forward feel.
- Responsive layout using Tailwind CSS, ensuring a consistent experience across devices. Use of sidebar navigation in dashboard for easy access to job management features.
- Clean, simple icons from a set like Remix Icon or Material Icons to represent job categories and functions within the platform.
- Subtle transitions and animations on button hover states and form submissions to enhance user engagement.
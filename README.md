
# PlatformPro Jobs - Next.js & Firebase

PlatformPro Jobs is a specialized job board built with Next.js, Firebase, and Genkit, designed for sourcing top-tier platform engineering talent and helping candidates find their next career-defining role.

## Current Features

### Core Platform:
- **Next.js 15 App Router**: Modern, performant React framework.
- **Firebase Suite**:
    - **Authentication**: Secure email/password login for Recruiters and Candidates.
    - **Firestore**: NoSQL database for storing user profiles, job postings, and applications.
- **Tailwind CSS & ShadCN UI**: For a modern, responsive, and accessible user interface.
- **TypeScript**: For robust, type-safe code.

### Recruiter Features:
- **Authentication**: Sign up and log in as a Recruiter.
- **Centralized Company Profile**: Manage a dedicated company profile with a name, logo, website, and description that automatically appears on all job postings.
- **Dashboard**:
    - **Post New Jobs**: A form to create and publish job listings, with fields for title, platform (Salesforce, SAP, Oracle, HubSpot), technologies, modules, location, contract type, experience level, and description.
    - **My Job Postings**: View and manage jobs posted by the recruiter.
    - **View Applicants**: For each job, recruiters can view a list of candidates who have applied.
- **AI-Powered Candidate Scoring & Sorting**:
    - Candidates are automatically scored and sorted based on how well their CV matches the job description.
    - Recruiters see a concise AI-generated summary for each candidate, highlighting their fit.
- **Application Status Management**: Recruiters can update the status of each application (e.g., "Under Review", "Interviewing", "Rejected", "Withdrawn"), which is reflected on the candidate's dashboard.
- **Stripe Integration**:
    - Recruiters receive initial free job posts.
    - Ability to purchase additional job post credits via Stripe Checkout.
    - Webhooks to fulfill orders and update recruiter post credits.
- **AI-Powered Job Description Generation**: Recruiters can use Genkit to automatically generate a job description based on key inputs like job title, platform, technologies, and a summary of responsibilities.

### Candidate Features:
- **Authentication**: Sign up and log in as a Candidate.
- **Comprehensive Profile Management**:
    - Build a detailed professional profile including a headline, summary, and contact information.
    - Add skills using an interactive tag system.
    - List detailed work experience and education history.
- **Dashboard**:
    - **Profile Strength Indicator**: A visual guide that encourages candidates to complete their profile for better visibility.
    - **Applied Jobs**: View a list of jobs they have applied for, track their real-time application status, and withdraw applications.
    - **Saved Jobs**: Bookmark interesting jobs to apply for later.
- **Job Application & Withdrawal**:
    - Browse all open job listings.
    - View detailed job descriptions.
    - **One-Click Apply**: Candidates with a completed profile and a saved CV can apply for jobs instantly.
    - **Withdraw Application**: Candidates can withdraw their application from a job post at any time.
    - Standard application process with CV upload for new users. CVs are stored in Cloudinary.

### General Features:
- **Public Job Listings**: A page accessible to everyone, displaying all active job postings.
- **Transparent Applicant Counts**: Job listings can display the number of candidates who have already applied, providing insight into the role's popularity.
- **CV Management**: CVs uploaded by candidates are stored in Cloudinary, and recruiters can download them.

## Project Structure

- `src/app/`: Next.js App Router pages.
    - `(auth)`: Route group for authentication pages (login, signup).
    - `dashboard/`: Layout and pages for recruiter dashboard.
    - `dashboard/candidate/`: Layout and pages for candidate dashboard.
    - `api/`: API routes (e.g., Stripe webhooks, CV upload, status updates).
- `src/components/`: Reusable UI components.
    - `auth/`: Authentication-related components.
    - `dashboard/`: Components specific to dashboards (for both recruiters and candidates).
    - `jobs/`: Components related to job listings and applications.
    - `layout/`: Header, Footer components.
    - `ui/`: ShadCN UI components.
- `src/ai/`: Genkit AI flows and configuration.
    - `flows/`: Specific AI tasks like job description generation and CV analysis.
- `src/context/`: React Context providers (e.g., AuthContext).
- `src/hooks/`: Custom React hooks.
- `src/lib/`: Utility functions, Firebase configuration, type definitions, static data (job titles, technologies).

## Getting Started

### Prerequisites
- Node.js (v18 or later recommended)
- npm or yarn

### Environment Variables
Create a `.env.local` file in the root of your project and add the following environment variables with your specific Firebase, Cloudinary, and Stripe credentials:

```env
# Firebase Configuration (Obtain from your Firebase project settings)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Cloudinary Configuration (Obtain from your Cloudinary dashboard)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Stripe Configuration (Obtain from your Stripe dashboard)
# Publishable key for client-side Stripe.js
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
# Secret key for server-side Stripe API calls
NEXT_STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
# Price ID for the job post product in Stripe
NEXT_PUBLIC_STRIPE_PRICE_PREMIUM=price_your_job_post_price_id
# Stripe Webhook Secret (for verifying webhook events - obtain from Stripe CLI or dashboard)
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# Google AI / Genkit Configuration (If using Gemini models)
# Ensure your GOOGLE_API_KEY is set in your environment for Genkit to use Google AI
# Example: export GOOGLE_API_KEY="your_google_ai_studio_api_key"
# Or set it up via `genkit credentials add google-ai`
```

**Note on Genkit and Google AI:** For AI features powered by Genkit (like job description generation or CV analysis using Gemini), ensure your Google AI API key is configured in your environment or via Genkit's credential manager.

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/AndreLiar/Plateformprojob.git
   cd Plateformprojob
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application Locally

You need to run two separate development servers: one for the Next.js frontend and one for the Genkit AI flows.

1.  **Start the Next.js development server:**
    Open a terminal and run:
    ```bash
    npm run dev
    ```
    This will typically start the application on `http://localhost:9002`.

2.  **Start the Genkit development server:**
    Open a new terminal and run:
    ```bash
    npm run genkit:dev
    # or for watching file changes and restarting:
    # npm run genkit:watch
    ```
    This starts the Genkit development environment, usually making flows available for local inspection and execution (e.g., via `http://localhost:4000/flows`).

### Firebase Setup
- Ensure you have a Firebase project created.
- Enable Firebase Authentication (Email/Password).
- Set up Firestore database and configure security rules as needed.
    - You will need a `users` collection to store user profiles.
    - You will need a `jobs` collection to store job postings.
    - You will need an `applications` collection to store job applications.
    - **Important for "View Applicants"**: Create a composite index in Firestore for the `applications` collection on `jobId` (ascending) and `appliedAt` (descending). You can often find a direct link to create this index in Firestore console error messages if it's missing.

### Cloudinary Setup
- Create a Cloudinary account.
- Note your Cloud Name, API Key, and API Secret for the environment variables.

### Stripe Setup
- Create a Stripe account.
- Create a product (e.g., "Job Post Credit") and a one-time price for it. Note the Price ID.
- Get your Publishable Key and Secret Key.
- Set up a webhook endpoint in Stripe to listen for `checkout.session.completed` events. The URL will typically be `http://localhost:<your_nextjs_port>/api/stripe/webhook` during local development (you might need to use a tool like `ngrok` or the Stripe CLI to expose your local webhook endpoint to Stripe). Note the Webhook Signing Secret.

This README should give a good overview of the project and how to get it running!

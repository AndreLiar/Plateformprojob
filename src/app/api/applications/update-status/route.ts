
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import type { Application, ApplicationStatus } from '@/lib/types';

// Define the statuses a recruiter can set. 'Withdrawn' is managed by the candidate.
const validStatuses: ApplicationStatus[] = ["Applied", "Under Review", "Interviewing", "Offer Extended", "Rejected"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { applicationId, status, recruiterId } = body;

    if (!applicationId || !status || !recruiterId) {
      return NextResponse.json({ error: 'Application ID, status, and recruiter ID are required.' }, { status: 400 });
    }

    if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: `Invalid status provided. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Firestore is not initialized.' }, { status: 500 });
    }

    const appDocRef = doc(db, 'applications', applicationId);
    const appDocSnap = await getDoc(appDocRef);

    if (!appDocSnap.exists()) {
        return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }
    
    const application = appDocSnap.data() as Application;

    // Security check: ensure the recruiter making the request is the one who owns the job
    if (application.recruiterId !== recruiterId) {
        return NextResponse.json({ error: 'Forbidden: You are not authorized to update this application.' }, { status: 403 });
    }

    await updateDoc(appDocRef, {
      status: status,
    });

    return NextResponse.json({ message: 'Application status updated successfully.' });

  } catch (error: any) {
    console.error('Update Application Status API Error:', error);
    return NextResponse.json({ error: 'Failed to update application status due to an unexpected server error.' }, { status: 500 });
  }
}

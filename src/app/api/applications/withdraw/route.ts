
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import type { Application } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { applicationId, candidateId } = body;

    if (!applicationId || !candidateId) {
      return NextResponse.json({ error: 'Application ID and Candidate ID are required.' }, { status: 400 });
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

    // Security check: ensure the candidate making the request is the one who owns the application
    if (application.candidateId !== candidateId) {
        return NextResponse.json({ error: 'Forbidden: You are not authorized to withdraw this application.' }, { status: 403 });
    }
    
    // Check if the application can be withdrawn
    if (application.status === 'Withdrawn' || application.status === 'Rejected') {
         return NextResponse.json({ error: `Cannot withdraw an application that is already ${application.status}.` }, { status: 409 });
    }

    await updateDoc(appDocRef, {
      status: 'Withdrawn',
    });

    return NextResponse.json({ message: 'Application withdrawn successfully.' });

  } catch (error: any) {
    console.error('Withdraw Application API Error:', error);
    return NextResponse.json({ error: 'Failed to withdraw application due to an unexpected server error.' }, { status: 500 });
  }
}

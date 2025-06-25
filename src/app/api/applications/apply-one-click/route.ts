
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, addDoc, updateDoc, increment, serverTimestamp, collection, query, where, getCountFromServer } from 'firebase/firestore';
import type { UserProfile, Job } from '@/lib/types';
import { analyzeCvAgainstJob, type AnalyzeCvInput, type AnalyzeCvOutput } from '@/ai/flows/analyze-cv-flow';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, candidateId } = body;

    if (!jobId || !candidateId) {
      return NextResponse.json({ success: false, error: 'Job ID and Candidate ID are required.' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ success: false, error: 'Firestore is not initialized.' }, { status: 500 });
    }

    // 1. Fetch Job and Candidate Profile
    const jobDocRef = doc(db, 'jobs', jobId);
    const candidateDocRef = doc(db, 'users', candidateId);

    const [jobSnap, candidateSnap] = await Promise.all([getDoc(jobDocRef), getDoc(candidateDocRef)]);

    if (!jobSnap.exists()) {
      return NextResponse.json({ success: false, error: 'Job not found.' }, { status: 404 });
    }
    if (!candidateSnap.exists()) {
      return NextResponse.json({ success: false, error: 'Candidate profile not found.' }, { status: 404 });
    }

    const job = { id: jobSnap.id, ...jobSnap.data() } as Job;
    const candidateProfile = candidateSnap.data() as UserProfile;

    if (!candidateProfile.cvUrl || !candidateProfile.cvMimeType) {
      return NextResponse.json({ success: false, error: 'Candidate CV URL or file type is missing from profile. Please re-upload your CV to enable one-click apply.' }, { status: 400 });
    }
    
    // Check if already applied
    const appsRef = collection(db, 'applications');
    const q = query(appsRef, where('jobId', '==', jobId), where('candidateId', '==', candidateId));
    const countSnap = await getCountFromServer(q);
    if(countSnap.data().count > 0) {
        return NextResponse.json({ success: false, error: 'You have already applied for this job.' }, { status: 409 });
    }

    // 2. Fetch CV from Cloudinary URL
    const cvResponse = await fetch(candidateProfile.cvUrl);
    if (!cvResponse.ok) {
        throw new Error(`Failed to fetch CV from Cloudinary. Status: ${cvResponse.status}`);
    }
    const cvBuffer = await cvResponse.arrayBuffer();
    const base64String = Buffer.from(cvBuffer).toString('base64');
    const cvDataUri = `data:${candidateProfile.cvMimeType};base64,${base64String}`;

    // 3. Perform AI Analysis
    let aiAnalysisResult: AnalyzeCvOutput | null = null;
    try {
        const analysisInput: AnalyzeCvInput = {
            cvDataUri: cvDataUri,
            jobTitle: job.title,
            jobDescription: job.description,
            jobTechnologies: job.technologies,
            jobExperienceLevel: job.experienceLevel,
        };
        aiAnalysisResult = await analyzeCvAgainstJob(analysisInput);
    } catch (aiError: any) {
        console.error("AI analysis failed during one-click apply:", aiError);
        // Don't fail the whole application, just submit without analysis and provide a helpful message.
        aiAnalysisResult = {
            score: 0,
            summary: `AI analysis could not be completed for this application. Reason: ${aiError.message || 'Model did not respond correctly.'}`,
            strengths: [],
            weaknesses: ["AI analysis was not performed."]
        }
    }
    
    // 4. Create Application and Update Job Count
    const applicationData = {
        candidateId: candidateId,
        candidateName: candidateProfile.displayName || candidateProfile.email,
        candidateEmail: candidateProfile.email,
        jobId: jobId,
        jobTitle: job.title,
        recruiterId: job.recruiterId,
        cvUrl: candidateProfile.cvUrl,
        cloudinaryPublicId: candidateProfile.cvPublicId || null,
        appliedAt: serverTimestamp(),
        status: 'Applied' as const,
        aiScore: aiAnalysisResult?.score ?? null,
        aiAnalysisSummary: aiAnalysisResult?.summary ?? "AI analysis was not performed.",
        aiStrengths: aiAnalysisResult?.strengths ?? [],
        aiWeaknesses: aiAnalysisResult?.weaknesses ?? [],
        companyName: job.companyName || '',
        companyLogoUrl: job.companyLogoUrl || '',
    };
    
    const appCollectionRef = collection(db, 'applications');
    await addDoc(appCollectionRef, applicationData);

    await updateDoc(jobDocRef, {
        applicationCount: increment(1),
    });

    return NextResponse.json({ success: true, message: 'Application submitted successfully.' });

  } catch (error: any) {
    console.error('One-Click Apply API Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to submit application due to an unexpected server error.' }, { status: 500 });
  }
}

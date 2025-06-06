
// src/app/api/upload-cv/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { uploadStreamToCloudinary } from '@/lib/cloudinary';
import { auth } from '@/lib/firebase'; // Assuming you have auth initialized in firebase.ts
import { onAuthStateChanged } from 'firebase/auth'; // To verify user

// Helper to get current user (simplified for API route)
const getCurrentUser = (): Promise<import('firebase/auth').User | null> => {
  return new Promise((resolve, reject) => {
    if (!auth) {
      return reject(new Error("Firebase auth not initialized"));
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, (error) => {
      unsubscribe();
      reject(error);
    });
  });
};


export async function POST(request: NextRequest) {
  // This is a basic auth check. In a real app, you'd verify the user's session token
  // passed in headers, rather than relying on onAuthStateChanged in an API route.
  // For Firebase Studio, this might work for simple cases, but proper token validation is better.
  // For now, we'll proceed with a simplified check. It's better to use a middleware or token validation.

  // A more robust way would be to get the Firebase ID token from the client request's Authorization header
  // and verify it using Firebase Admin SDK on the backend.
  // This example simplifies by assuming the client is authenticated if this route is hit.
  // This is NOT production-ready auth for an API route.

  const formData = await request.formData();
  const file = formData.get('cv') as File | null;

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file provided.' }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    return NextResponse.json({ success: false, error: 'File is too large. Max 5MB.' }, { status: 400 });
  }

  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ success: false, error: 'Invalid file type. Only PDF, DOC, DOCX allowed.' }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract original filename for Cloudinary to use
    const originalFilename = file.name.split('.').slice(0, -1).join('.');

    const result = await uploadStreamToCloudinary(buffer, {
      folder: 'cv_uploads', // Optional: organize uploads in Cloudinary
      public_id: `${originalFilename}_${Date.now()}`, // Creates a unique public_id
      // type: 'upload', // not needed for raw
      // access_mode: 'public', // default is public
    });

    if (result && 'secure_url' in result) {
      return NextResponse.json({ success: true, url: result.secure_url, publicId: result.public_id });
    } else {
      console.error('Cloudinary upload error in API route:', result);
      const errorMessage = (result as any)?.error?.message || 'Cloudinary upload failed.';
      return NextResponse.json({ success: false, error: `Upload to Cloudinary failed: ${errorMessage}` }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error uploading CV:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to upload CV.' }, { status: 500 });
  }
}

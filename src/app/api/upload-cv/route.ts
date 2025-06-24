
// src/app/api/upload-cv/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { uploadStreamToCloudinary } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  let cvUrl: string | null = null;
  let cvPublicId: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get('cv') as File | null;

    if (!file) {
      return NextResponse.json({ 
        success: false, error: 'No file provided.', 
        url: null, publicId: null 
      }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json({ 
        success: false, error: 'File is too large. Max 5MB.', 
        url: null, publicId: null 
      }, { status: 400 });
    }
    const allowedTypes = [
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, error: 'Invalid file type. Only PDF, DOC, DOCX allowed.', 
        url: null, publicId: null 
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // --- Cloudinary Upload ---
    const originalFilename = file.name.split('.').slice(0, -1).join('.') || `cv_${Date.now()}`;
    const cloudinaryResult = await uploadStreamToCloudinary(buffer, {
      folder: 'cv_uploads',
      public_id: `${originalFilename}_${Date.now()}`,
      resource_type: 'raw', 
    });

    if (cloudinaryResult && 'secure_url' in cloudinaryResult) {
      cvUrl = cloudinaryResult.secure_url;
      cvPublicId = cloudinaryResult.public_id;
      return NextResponse.json({
        success: true,
        url: cvUrl,
        publicId: cvPublicId,
      });
    } else {
      const cloudinaryErrorMessage = (cloudinaryResult as any)?.error?.message || 'Cloudinary upload failed.';
      console.error('Cloudinary upload error in API route /api/upload-cv:', cloudinaryResult);
      return NextResponse.json({
        success: false,
        error: `Cloudinary upload failed: ${cloudinaryErrorMessage}.`,
        url: null,
        publicId: null,
      }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error("!!!!!!!!!!!! EMERGENCY CATCH IN /api/upload-cv !!!!!!!!!!!!");
    let messageForDev = "Unknown server error during CV processing.";
    let clientMessage = "Server encountered an unexpected issue processing the CV.";

    if (error instanceof Error) {
      messageForDev = error.message;
      clientMessage = "Failed to process CV: " + error.message.substring(0, 100); 
      console.error("Error Name:", error.name);
      console.error("Error Message:", error.message);
      console.error("Error Stack:", error.stack);
    } else {
      console.error("Non-Error object caught in /api/upload-cv:", error);
      try {
        messageForDev = JSON.stringify(error);
        clientMessage = "An unknown server error occurred (non-standard error object).";
      } catch (e) {
        messageForDev = "Unstringifiable error object caught.";
        clientMessage = "An unknown server error occurred (unstringifiable error object).";
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: clientMessage,
        url: cvUrl, 
        publicId: cvPublicId,
        _dev_error_details: messageForDev 
      }, 
      { status: 500 }
    );
  }
}

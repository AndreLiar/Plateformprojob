
// src/app/api/upload-cv/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { uploadStreamToCloudinary } from '@/lib/cloudinary';
// pdf-parse and mammoth are removed as text extraction is temporarily disabled

export async function POST(request: NextRequest) {
  let cvUrl: string | null = null;
  let cvPublicId: string | null = null;
  // Text extraction is deferred, so these will be null or default messages
  const extractedText: string | null = null; 
  const extractionError: string | null = "Text extraction feature is temporarily unavailable.";

  try {
    const formData = await request.formData();
    const file = formData.get('cv') as File | null;

    if (!file) {
      return NextResponse.json({ 
        success: false, error: 'No file provided.', 
        extractedText: null, extractionError: 'No file provided for processing.', 
        url: null, publicId: null 
      }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json({ 
        success: false, error: 'File is too large. Max 5MB.', 
        extractedText: null, extractionError: 'File too large.', 
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
        extractedText: null, extractionError: 'Invalid file type.', 
        url: null, publicId: null 
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // --- Text Extraction Logic Removed Temporarily ---
    // The extractedText and extractionError variables are initialized above.

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
        extractedText: extractedText, 
        extractionError: extractionError, // Will indicate feature is unavailable
      });
    } else {
      const cloudinaryErrorMessage = (cloudinaryResult as any)?.error?.message || 'Cloudinary upload failed.';
      console.error('Cloudinary upload error in API route /api/upload-cv:', cloudinaryResult);
      return NextResponse.json({
        success: false,
        error: `Cloudinary upload failed: ${cloudinaryErrorMessage}.`,
        extractedText, 
        extractionError, // Will indicate feature is unavailable
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
        extractedText: null, // Ensure null if critical error
        extractionError: "CV processing encountered a critical server error.", // Specific error for this case
        url: cvUrl, 
        publicId: cvPublicId,
        _dev_error_details: messageForDev 
      }, 
      { status: 500 }
    );
  }
}

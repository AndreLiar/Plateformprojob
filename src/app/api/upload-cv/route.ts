
// src/app/api/upload-cv/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { uploadStreamToCloudinary } from '@/lib/cloudinary';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export async function POST(request: NextRequest) {
  let extractedText: string | null = null;
  let extractionError: string | null = null;
  let cvUrl: string | null = null;
  let cvPublicId: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get('cv') as File | null;

    if (!file) {
      return NextResponse.json({ 
        success: false, error: 'No file provided.', 
        extractedText: null, extractionError: 'No file provided for extraction.', 
        url: null, publicId: null 
      }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json({ 
        success: false, error: 'File is too large. Max 5MB.', 
        extractedText: null, extractionError: 'File too large for extraction.', 
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
        extractedText: null, extractionError: 'Invalid file type for extraction.', 
        url: null, publicId: null 
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    extractedText = null; 
    extractionError = null;

    if (file.type === 'application/pdf') {
      try {
        const data = await pdf(buffer);
        extractedText = data.text;
      } catch (err: any) {
        console.warn('PDF parsing error in /api/upload-cv:', err.message);
        extractionError = `Failed to extract text from PDF: ${err.message || 'Unknown PDF parsing error'}. AI analysis might be impacted.`;
      }
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // DOCX
      try {
        const { value } = await mammoth.extractRawText({ buffer });
        extractedText = value;
      } catch (err: any) {
        console.warn('DOCX parsing error in /api/upload-cv:', err.message);
        extractionError = `Failed to extract text from DOCX: ${err.message || 'Unknown DOCX parsing error'}. AI analysis might be impacted.`;
      }
    } else if (file.type === 'application/msword') { // DOC
      try {
        const { value } = await mammoth.extractRawText({ buffer }); // Attempt for .doc
        extractedText = value;
        if (!extractedText || extractedText.trim() === "") {
          extractionError = 'Text extraction from .doc file yielded no content or failed. The .doc format has limited support. Consider converting to DOCX or PDF for better results. AI analysis might be impacted.';
        }
      } catch (docErr: any) {
        console.warn('Mammoth .doc parsing error in /api/upload-cv:', docErr.message);
        extractionError = `Failed to extract text from .doc file: ${docErr.message || 'Unknown .doc parsing error'}. This format has limited support. Consider converting to DOCX or PDF. AI analysis might be impacted.`;
      }
    }

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
        extractionError: extractionError, 
      });
    } else {
      const cloudinaryErrorMessage = (cloudinaryResult as any)?.error?.message || 'Cloudinary upload failed.';
      console.error('Cloudinary upload error in API route /api/upload-cv:', cloudinaryResult);
      const combinedErrorForClient = `Cloudinary upload failed: ${cloudinaryErrorMessage}. ${extractionError ? `Text extraction issue: ${extractionError}` : ''}`.trim();
      return NextResponse.json({
        success: false,
        error: combinedErrorForClient,
        extractedText, 
        extractionError,
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
      clientMessage = "Failed to process CV: " + error.message.substring(0, 100); // Keep client message somewhat generic
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
    
    // Ensure extractedText and extractionError are passed if they were determined before this critical error
    const finalExtractedText = typeof extractedText === 'string' || extractedText === null ? extractedText : null;
    const finalExtractionError = typeof extractionError === 'string' || extractionError === null ? extractionError : 'Error during text extraction stage, details unavailable.';

    return NextResponse.json(
      { 
        success: false, 
        error: clientMessage, // User-facing, possibly generic error
        // Include these for potential debugging on client or if some part of the process succeeded before the fatal error
        extractedText: finalExtractedText,
        extractionError: finalExtractionError,
        url: cvUrl, // cvUrl and cvPublicId might be null if Cloudinary upload didn't happen or failed
        publicId: cvPublicId,
        // Add a developer-specific message for more detailed insight if needed on client debug
        _dev_error_details: messageForDev 
      }, 
      { status: 500 }
    );
  }
}

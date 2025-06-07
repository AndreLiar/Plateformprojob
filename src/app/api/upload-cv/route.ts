
// src/app/api/upload-cv/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { uploadStreamToCloudinary } from '@/lib/cloudinary';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export async function POST(request: NextRequest) {
  let extractedText: string | null = null;
  let extractionError: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get('cv') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided.', extractedText, extractionError }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json({ success: false, error: 'File is too large. Max 5MB.', extractedText, extractionError }, { status: 400 });
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Only PDF, DOC, DOCX allowed.', extractedText, extractionError }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Attempt text extraction based on MIME type
    if (file.type === 'application/pdf') {
      try {
        const data = await pdf(buffer);
        extractedText = data.text;
      } catch (err: any) {
        console.warn('PDF parsing error in /api/upload-cv:', err.message);
        extractionError = `Failed to extract text from PDF: ${err.message || 'Unknown PDF parsing error'}. AI analysis might be impacted.`;
        // Do not return yet, proceed to Cloudinary upload
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
        // Mammoth's .doc support is limited.
        const { value } = await mammoth.extractRawText({ buffer });
        extractedText = value; // value can be null if extraction fails
        if (extractedText === null || extractedText.trim() === "") {
          extractionError = 'Text extraction from .doc file yielded no content or failed. The .doc format has limited support. Consider converting to DOCX or PDF for better results. AI analysis might be impacted.';
          extractedText = null; // Ensure it's explicitly null
        }
      } catch (docErr: any) {
        console.warn('Mammoth .doc parsing error in /api/upload-cv:', docErr.message);
        extractionError = `Failed to extract text from .doc file: ${docErr.message || 'Unknown .doc parsing error'}. This format has limited support. Consider converting to DOCX or PDF. AI analysis might be impacted.`;
        extractedText = null;
      }
    }

    // Proceed with Cloudinary upload regardless of text extraction success/failure
    const originalFilename = file.name.split('.').slice(0, -1).join('.') || `cv_${Date.now()}`;
    const cloudinaryResult = await uploadStreamToCloudinary(buffer, {
      folder: 'cv_uploads',
      public_id: `${originalFilename}_${Date.now()}`,
      resource_type: 'raw',
    });

    if (cloudinaryResult && 'secure_url' in cloudinaryResult) {
      return NextResponse.json({
        success: true,
        url: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        extractedText: extractedText,
        extractionError: extractionError,
      });
    } else {
      // Cloudinary upload itself failed
      console.error('Cloudinary upload error in API route /api/upload-cv:', cloudinaryResult);
      const errorMessage = (cloudinaryResult as any)?.error?.message || 'Cloudinary upload failed.';
      // Ensure extractionError from earlier stage is preserved if Cloudinary upload itself fails
      return NextResponse.json({ success: false, error: `Upload to Cloudinary failed: ${errorMessage}`, extractedText, extractionError: extractionError || `Cloudinary error, extraction status: ${extractionError ? 'failed' : 'not attempted or succeeded'}` }, { status: 500 });
    }

  } catch (error: any) {
    // This is the final catch-all for any unhandled errors during the process
    console.error('!!! Critical unhandled error in /api/upload-cv route:', error);
    let safeErrorMessage = 'An unexpected server error occurred while processing the CV.';
    
    // Attempt to get a more specific message from the error object
    if (error instanceof Error) {
        safeErrorMessage = error.message;
    } else if (typeof error === 'string') {
        safeErrorMessage = error;
    } else {
        // If the error is not a standard Error object or string, log its structure for debugging
        try {
            console.error('!!! Non-standard error object structure:', JSON.stringify(error));
        } catch (stringifyError) {
            console.error('!!! Could not stringify non-standard error object.');
        }
    }
    
    // Log the message that will be sent to the client
    console.error('!!! Responding with JSON error in /api/upload-cv:', safeErrorMessage);

    return NextResponse.json({
      success: false,
      error: safeErrorMessage,
      extractedText: extractedText, 
      extractionError: extractionError || (error instanceof Error ? error.message : "Details in server logs"),
    }, { status: 500 });
  }
}

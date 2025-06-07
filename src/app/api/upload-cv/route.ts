
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

    // File validation (size, type) - Step 1 (backend part) & Step 2
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

    // Step 3: Extract Text from the File (Preprocessing)
    // Reset for current file processing
    extractedText = null; 
    extractionError = null;

    if (file.type === 'application/pdf') {
      try {
        const data = await pdf(buffer);
        extractedText = data.text; // data.text is plain text
      } catch (err: any) {
        console.warn('PDF parsing error in /api/upload-cv:', err.message);
        extractionError = `Failed to extract text from PDF: ${err.message || 'Unknown PDF parsing error'}. AI analysis might be impacted.`;
        // extractedText remains null
      }
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // DOCX
      try {
        const { value } = await mammoth.extractRawText({ buffer });
        extractedText = value; // value is plain text
      } catch (err: any) {
        console.warn('DOCX parsing error in /api/upload-cv:', err.message);
        extractionError = `Failed to extract text from DOCX: ${err.message || 'Unknown DOCX parsing error'}. AI analysis might be impacted.`;
        // extractedText remains null
      }
    } else if (file.type === 'application/msword') { // DOC
      try {
        const { value } = await mammoth.extractRawText({ buffer });
        extractedText = value; // value is plain text
        if (!extractedText || extractedText.trim() === "") {
          // This specific case might not be an "error" but rather mammoth not finding text in a .doc
          extractionError = 'Text extraction from .doc file yielded no content or failed. The .doc format has limited support. Consider converting to DOCX or PDF for better results. AI analysis might be impacted.';
          extractedText = null; 
        }
      } catch (docErr: any) {
        console.warn('Mammoth .doc parsing error in /api/upload-cv:', docErr.message);
        extractionError = `Failed to extract text from .doc file: ${docErr.message || 'Unknown .doc parsing error'}. This format has limited support. Consider converting to DOCX or PDF. AI analysis might be impacted.`;
        // extractedText remains null
      }
    }
    // Normalization: The libraries themselves aim to provide plain text. Further normalization (e.g. stripping specific characters) is not added here
    // but `extractedText` will be the "clean, plain text string" as per the guide, or null.

    // Proceed with Cloudinary upload (even if text extraction had issues)
    const originalFilename = file.name.split('.').slice(0, -1).join('.') || `cv_${Date.now()}`;
    const cloudinaryResult = await uploadStreamToCloudinary(buffer, {
      folder: 'cv_uploads',
      public_id: `${originalFilename}_${Date.now()}`,
      resource_type: 'raw', 
    });

    if (cloudinaryResult && 'secure_url' in cloudinaryResult) {
      cvUrl = cloudinaryResult.secure_url;
      cvPublicId = cloudinaryResult.public_id;
      // Successfully uploaded to Cloudinary
      return NextResponse.json({
        success: true,
        url: cvUrl,
        publicId: cvPublicId,
        extractedText: extractedText, 
        extractionError: extractionError, 
      });
    } else {
      // Cloudinary upload itself failed
      const cloudinaryErrorMessage = (cloudinaryResult as any)?.error?.message || 'Cloudinary upload failed.';
      console.error('Cloudinary upload error in API route /api/upload-cv:', cloudinaryResult);
      
      const combinedErrorForClient = `Cloudinary upload failed: ${cloudinaryErrorMessage}. ${extractionError ? `Text extraction issue: ${extractionError}` : ''}`.trim();
      
      return NextResponse.json({
        success: false,
        error: combinedErrorForClient,
        extractedText, 
        extractionError, // The original text extraction error, if any
        url: null,
        publicId: null,
      }, { status: 500 });
    }

  } catch (error: unknown) {
    // This is the final catch-all for unexpected errors during the process.
    console.error('!!! Critical unhandled error in /api/upload-cv route (main catch block):', error);
    let clientErrorMessage = 'An unexpected server error occurred while processing the CV.';
    let detailedServerErrorInfo = 'Error object could not be fully processed for logging.';

    if (error instanceof Error) {
        clientErrorMessage = error.message;
        detailedServerErrorInfo = `Error: ${error.message}${error.stack ? `\nStack: ${error.stack}` : ''}`;
    } else if (typeof error === 'string') {
        clientErrorMessage = error;
        detailedServerErrorInfo = `String error: ${error}`;
    } else {
        try {
            const errorString = JSON.stringify(error, Object.getOwnPropertyNames(Object.getPrototypeOf(error) || error));
            clientErrorMessage = `A non-standard error occurred. Partial details: ${errorString.substring(0, 200)}`; 
            detailedServerErrorInfo = `Non-standard error (stringified): ${errorString}`;
        } catch (stringifyError: any) {
            clientErrorMessage = 'A non-standard, unstringifiable error occurred.';
            detailedServerErrorInfo = `Failed to stringify error object: ${stringifyError.message}`;
        }
    }
    console.error('!!! Detailed server error info for /api/upload-cv (critical catch):', detailedServerErrorInfo);

    // Values of extractedText, extractionError, cvUrl, cvPublicId would be from the outer scope,
    // reflecting their state when the critical error occurred.
    return NextResponse.json({
      success: false,
      error: clientErrorMessage,
      extractedText, 
      extractionError, 
      url: cvUrl, 
      publicId: cvPublicId,
    }, { status: 500 });
  }
}

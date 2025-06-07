
// src/app/api/upload-cv/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { uploadStreamToCloudinary } from '@/lib/cloudinary';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('cv') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided.' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json({ success: false, error: 'File is too large. Max 5MB.' }, { status: 400 });
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Only PDF, DOC, DOCX allowed.' }, { status: 400 });
    }

    let extractedText: string | null = null;
    let extractionError: string | null = null;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Attempt text extraction based on MIME type
    if (file.type === 'application/pdf') {
      try {
        const data = await pdf(buffer);
        extractedText = data.text;
      } catch (err: any) {
        console.warn('PDF parsing error:', err.message);
        extractionError = `Failed to extract text from PDF: ${err.message || 'Unknown PDF parsing error'}. AI analysis might be based on image content if applicable.`;
      }
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const { value } = await mammoth.extractRawText({ buffer });
        extractedText = value;
      } catch (err: any) {
        console.warn('DOCX parsing error:', err.message);
        extractionError = `Failed to extract text from DOCX: ${err.message || 'Unknown DOCX parsing error'}. AI analysis might be based on image content if applicable.`;
      }
    } else if (file.type === 'application/msword') {
      try {
        const { value } = await mammoth.extractRawText({ buffer });
        extractedText = value;
        if (extractedText !== null && extractedText.trim() === "") {
            // Mammoth might "succeed" but return empty string for some .doc files
            extractionError = 'Text extraction from .doc file yielded no content. The .doc format has limited support. Consider converting to DOCX or PDF for better results.';
            extractedText = null; // Ensure it's null if empty
        } else if (extractedText === null) {
            extractionError = 'Text extraction from .doc file failed (returned null). The .doc format has limited support. Consider converting to DOCX or PDF.';
        }
      } catch (docErr: any) {
        console.warn('Mammoth .doc parsing error:', docErr);
        let specificErrorMessage = "Failed to extract text from .doc file due to an error. This format has limited support.";
        if (docErr instanceof Error) {
            specificErrorMessage += ` Details: ${docErr.message}`;
        } else if (typeof docErr === 'string') {
            specificErrorMessage += ` Details: ${docErr}`;
        }
        extractionError = specificErrorMessage + " Consider converting to DOCX or PDF. AI analysis might be based on image content if applicable.";
        extractedText = null; 
      }
    }

    const originalFilename = file.name.split('.').slice(0, -1).join('.');
    const result = await uploadStreamToCloudinary(buffer, {
      folder: 'cv_uploads',
      public_id: `${originalFilename}_${Date.now()}`,
      resource_type: 'raw', 
    });

    if (result && 'secure_url' in result) {
      return NextResponse.json({
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        extractedText: extractedText, 
        extractionError: extractionError, 
      });
    } else {
      console.error('Cloudinary upload error in API route:', result);
      const errorMessage = (result as any)?.error?.message || 'Cloudinary upload failed.';
      // Ensure extractionError from earlier stage is preserved if Cloudinary upload itself fails
      return NextResponse.json({ success: false, error: `Upload to Cloudinary failed: ${errorMessage}`, extractionError: extractionError }, { status: 500 });
    }
  } catch (error: any) {
    console.error('!!! Critical error in /api/upload-cv route:', error);
    let errorMessage = 'Failed to process CV due to an unexpected server error.';
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    } else {
        try {
            errorMessage = `Unexpected error structure: ${JSON.stringify(error)}`;
        } catch (e) {
            // If stringify fails, stick to the generic message
        }
    }
    // Log the message that will be sent
    console.error('!!! Responding with JSON error:', errorMessage);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

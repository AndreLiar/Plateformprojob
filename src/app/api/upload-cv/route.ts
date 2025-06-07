
// src/app/api/upload-cv/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { uploadStreamToCloudinary } from '@/lib/cloudinary';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export async function POST(request: NextRequest) {
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

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Attempt text extraction based on MIME type
    if (file.type === 'application/pdf') {
      try {
        const data = await pdf(buffer);
        extractedText = data.text;
      } catch (err: any) {
        console.warn('PDF parsing error:', err.message);
        extractionError = `Failed to extract text from PDF: ${err.message}. AI analysis might be based on image content if applicable.`;
      }
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const { value } = await mammoth.extractRawText({ buffer });
        extractedText = value;
      } catch (err: any) {
        console.warn('DOCX parsing error:', err.message);
        extractionError = `Failed to extract text from DOCX: ${err.message}. AI analysis might be based on image content if applicable.`;
      }
    } else if (file.type === 'application/msword') {
        // Mammoth might handle some .doc files, but it's less reliable.
        try {
            const { value } = await mammoth.extractRawText({ buffer }); // Attempt for .doc
            extractedText = value;
        } catch (err: any) {
            console.warn('DOC parsing error (attempted with mammoth):', err.message);
            extractionError = `Failed to extract text from DOC: ${err.message}. Support for .doc is limited. Consider converting to DOCX or PDF. AI analysis might be based on image content if applicable.`;
        }
    }

    const originalFilename = file.name.split('.').slice(0, -1).join('.');
    const result = await uploadStreamToCloudinary(buffer, {
      folder: 'cv_uploads',
      public_id: `${originalFilename}_${Date.now()}`,
      resource_type: 'raw', // Keep as raw for storage
    });

    if (result && 'secure_url' in result) {
      return NextResponse.json({ 
        success: true, 
        url: result.secure_url, 
        publicId: result.public_id,
        extractedText: extractedText, // Include extracted text
        extractionError: extractionError, // Include any extraction error
      });
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

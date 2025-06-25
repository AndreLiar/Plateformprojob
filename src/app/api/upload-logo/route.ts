
// src/app/api/upload-logo/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { uploadStreamToCloudinary } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('logo') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided.' }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      return NextResponse.json({ success: false, error: 'File is too large. Max 2MB.' }, { status: 400 });
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Only JPG, PNG, WEBP, or SVG are allowed.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const originalFilename = file.name.split('.').slice(0, -1).join('.') || `logo_${Date.now()}`;
    const cloudinaryResult = await uploadStreamToCloudinary(buffer, {
      folder: 'company_logos',
      public_id: `${originalFilename}_${Date.now()}`,
      resource_type: 'image', // Use 'image' for image files
    });

    if (cloudinaryResult && 'secure_url' in cloudinaryResult) {
      return NextResponse.json({
        success: true,
        url: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
      });
    } else {
      const cloudinaryErrorMessage = (cloudinaryResult as any)?.error?.message || 'Cloudinary upload failed.';
      console.error('Cloudinary upload error in API route /api/upload-logo:', cloudinaryResult);
      return NextResponse.json({
        success: false,
        error: `Cloudinary upload failed: ${cloudinaryErrorMessage}.`,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error in /api/upload-logo:", error);
    return NextResponse.json({ success: false, error: error.message || 'Server error during logo upload.' }, { status: 500 });
  }
}

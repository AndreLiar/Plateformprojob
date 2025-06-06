
// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn(
    'Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not fully set. File uploads will likely fail.'
  );
} else {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export const uploadStreamToCloudinary = (
  fileBuffer: Buffer,
  options: Record<string, any> = {}
): Promise<UploadApiResponse | UploadApiErrorResponse> => {
  return new Promise((resolve, reject) => {
    if (!cloudName || !apiKey || !apiSecret) {
      return reject(new Error('Cloudinary not configured. Missing API credentials.'));
    }
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'raw', ...options }, // 'raw' for files like PDF, DOCX
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Cloudinary upload failed, no result returned.'));
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export { cloudinary };

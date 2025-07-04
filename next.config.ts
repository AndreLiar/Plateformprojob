
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // Add other image domains if needed, e.g., for user avatars from Google
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', 
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Added for Cloudinary
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.freepik.com', // Added for landing page images
        port: '',
        pathname: '/**',
      }
    ],
  },
  // The env block has been removed. Next.js automatically exposes
  // environment variables prefixed with NEXT_PUBLIC_ to the browser.
  // For server-side only env vars, access them directly via process.env
};

export default nextConfig;

import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google'; // Import specific fonts
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { cn } from '@/lib/utils';

// Setup fonts using next/font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // CSS variable for Inter
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk', // CSS variable for Space Grotesk
});

export const metadata: Metadata = {
  title: 'PlatformPro Jobs',
  description: 'The premier job board for platform engineering roles.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Fonts links are managed by next/font, so direct links are not needed here if using next/font */}
      </head>
      <body 
        className={cn("font-body antialiased", inter.variable, spaceGrotesk.variable)}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

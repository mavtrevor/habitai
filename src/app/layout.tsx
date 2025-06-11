
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'HabitAI - Build Better Habits',
  description: 'AI-Driven Habit Builder to help you achieve your goals.',
  manifest: '/manifest.json', // Link to the manifest file
};

export const generateViewport = (): Viewport => {
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#29ABE2', // Primary color for theme-color meta tag
  };
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          The viewport meta tag will be automatically injected by Next.js
          from the generateViewport function above.
          The theme-color meta tag will also be injected.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        
        {/* Apple PWA specific meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="HabitAI" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

import React from 'react';
import './globals.css';
import { Providers } from './providers';
import AppShell from '@/components/AppShell';

export const metadata = {
  title: 'Orbit - Team Management & Workspace Platform',
  description: 'Streamlined team onboarding, profile management, and workspace collaboration with Orbit.',
  icons: {
    icon: '/orbit-logo.png',
    shortcut: '/orbit-logo.png',
    apple: '/orbit-logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Merriweather:ital,opsz,wght@0,18..144,300..900;1,18..144,300..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-[#F7F8FA] text-slate-900 selection:bg-blue-500 selection:text-white">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}

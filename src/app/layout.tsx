import { Outfit } from 'next/font/google';
import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { Metadata } from 'next';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://1i1.ae'),
  title: {
    default: 'OneToOne - All-in-One Business Management Platform',
    template: '%s | OneToOne',
  },
  description: 'OneToOne is the all-in-one platform for managing CRM, projects, events, finance, team, and documents. Streamline your business operations with powerful tools designed for agencies and enterprises. Start your free trial today.',
  keywords: [
    'business management software',
    'CRM platform',
    'project management tool',
    'event management software',
    'client management system',
    'invoice software',
    'team collaboration',
    'agency management',
    'document management',
    'sales pipeline',
    'all-in-one business platform',
  ],
  authors: [{ name: 'Lunar Labs', url: 'https://1i1.ae' }],
  creator: 'Lunar Labs',
  publisher: 'Lunar Labs',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/LogoSmall.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/Logo.svg', type: 'image/svg+xml' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://1i1.ae',
    siteName: 'OneToOne',
    title: 'OneToOne - All-in-One Business Management Platform',
    description: 'Manage CRM, projects, events, finance, and team all in one powerful platform. Start your free trial - no credit card required.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'OneToOne - Business Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OneToOne - All-in-One Business Management Platform',
    description: 'Manage CRM, projects, events, finance, and team all in one powerful platform. Start your free trial today.',
    images: ['/og-image.png'],
    creator: '@onetoone',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <AuthProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

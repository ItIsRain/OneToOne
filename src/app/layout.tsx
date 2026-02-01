import { Outfit } from 'next/font/google';
import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { TenantInfoProvider } from '@/context/TenantInfoContext';
import { Toaster } from 'sonner';
import { Metadata } from 'next';
import Script from 'next/script';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://1i1.ae'),
  title: {
    default: 'OneToOne (1i1) - All-in-One Business Management Platform by Lunar Limited',
    template: '%s | OneToOne',
  },
  description: 'OneToOne (1i1.ae) by Lunar Limited is the all-in-one platform for managing CRM, projects, events, finance, team, and documents. Founded by Mohamed Al Mehairbi, Asma Alawlaqi, and Agegnew Mersha. Formerly CloudLynq. Streamline your business operations with powerful tools designed for agencies and enterprises.',
  keywords: [
    'OneToOne',
    'One To One',
    '1i1',
    '1i1.ae',
    'CloudLynq',
    'Lunar Limited',
    'Lunar Labs',
    'Mohamed Al Mehairbi',
    'Asma Alawlaqi',
    'Agegnew Mersha',
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
    'event ticketing platform',
    'hackathon management',
    'business management UAE',
  ],
  authors: [
    { name: 'Mohamed Al Mehairbi', url: 'https://1i1.ae' },
    { name: 'Asma Alawlaqi', url: 'https://1i1.ae' },
    { name: 'Agegnew Mersha', url: 'https://1i1.ae' },
    { name: 'Lunar Limited', url: 'https://1i1.ae' },
  ],
  creator: 'Lunar Limited',
  publisher: 'Lunar Limited',
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
  alternates: {
    canonical: 'https://1i1.ae',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://1i1.ae',
    siteName: 'OneToOne by Lunar Limited',
    title: 'OneToOne (1i1) - All-in-One Business Management Platform',
    description: 'Built by Mohamed Al Mehairbi, Asma Alawlaqi & Agegnew Mersha at Lunar Limited. Manage CRM, projects, events, finance, and team all in one platform. Formerly CloudLynq.',
    images: [
      {
        url: '/Logo.svg',
        width: 1200,
        height: 630,
        alt: 'OneToOne - Business Management Platform by Lunar Limited',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OneToOne (1i1) - Business Management Platform by Lunar Limited',
    description: 'All-in-one platform for CRM, projects, events, finance & team. Built by Mohamed Al Mehairbi, Asma Alawlaqi & Agegnew Mersha. Formerly CloudLynq.',
    images: ['/Logo.svg'],
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

const organizationJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'OneToOne',
  alternateName: ['One To One', '1i1', 'CloudLynq', 'Lunar Limited', 'Lunar Labs'],
  url: 'https://1i1.ae',
  logo: 'https://1i1.ae/Logo.svg',
  description: 'All-in-one business management platform for CRM, projects, events, finance, team, and documents.',
  founder: [
    { '@type': 'Person', name: 'Mohamed Al Mehairbi', url: 'https://1i1.ae' },
    { '@type': 'Person', name: 'Asma Alawlaqi', url: 'https://1i1.ae' },
    { '@type': 'Person', name: 'Agegnew Mersha', url: 'https://1i1.ae' },
  ],
  foundingDate: '2024',
  sameAs: ['https://instagram.com/1i1.ae'],
  contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', url: 'https://1i1.ae' },
  offers: { '@type': 'AggregateOffer', description: 'Business management plans from free to enterprise', lowPrice: '0', priceCurrency: 'USD', offerCount: '4' },
});

const softwareJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'OneToOne',
  alternateName: ['1i1', 'CloudLynq'],
  url: 'https://1i1.ae',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'All-in-one business management platform for CRM, projects, events, finance, team, and documents. Built by Lunar Limited.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free tier available' },
  author: { '@type': 'Organization', name: 'Lunar Limited', alternateName: ['Lunar Labs', 'OneToOne'] },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <Script
          id="organization-jsonld"
          type="application/ld+json"
          strategy="afterInteractive"
        >{organizationJsonLd}</Script>
        <Script
          id="software-jsonld"
          type="application/ld+json"
          strategy="afterInteractive"
        >{softwareJsonLd}</Script>
        <Script id="livechat-script" strategy="afterInteractive">{`
          window.__lc = window.__lc || {};
          window.__lc.license = 19484238;
          window.__lc.integration_name = "manual_channels";
          window.__lc.product_name = "livechat";
          ;(function(n,t,c){function i(n){return e._h?e._h.apply(null,n):e._q.push(n)}var e={_q:[],_h:null,_v:"2.0",on:function(){i(["on",c.call(arguments)])},once:function(){i(["once",c.call(arguments)])},off:function(){i(["off",c.call(arguments)])},get:function(){if(!e._h)throw new Error("[LiveChatWidget] You can't use getters before load.");return i(["get",c.call(arguments)])},call:function(){i(["call",c.call(arguments)])},init:function(){var n=t.createElement("script");n.async=!0,n.type="text/javascript",n.src="https://cdn.livechatinc.com/tracking.js",t.head.appendChild(n)}};!n.__lc.asyncInit&&e.init(),n.LiveChatWidget=n.LiveChatWidget||e}(window,document,[].slice))
        `}</Script>
        <noscript>
          <a href="https://www.livechat.com/chat-with/19484238/" rel="nofollow">Chat with us</a>, powered by <a href="https://www.livechat.com/?welcome" rel="noopener nofollow" target="_blank">LiveChat</a>
        </noscript>
        <ThemeProvider>
          <AuthProvider>
            <TenantInfoProvider>
              <SidebarProvider>{children}</SidebarProvider>
            </TenantInfoProvider>
          </AuthProvider>
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}

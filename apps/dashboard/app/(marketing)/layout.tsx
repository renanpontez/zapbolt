import type { Metadata } from 'next';
import { LandingHeader } from '@/components/landing/header';
import { LandingFooter } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: {
    default: 'Zapbolt - Feedback at Lightning Speed',
    template: '%s | Zapbolt',
  },
  description:
    'Collect bug reports and feature requests with screenshots and session replays. Install in 5 minutes with one script tag. Free forever.',
  keywords: [
    'feedback widget',
    'bug reports',
    'feature requests',
    'session replay',
    'user feedback',
    'screenshot capture',
    'customer feedback',
    'product feedback',
    'user research',
    'feedback tool',
  ],
  authors: [{ name: 'Zapbolt' }],
  creator: 'Zapbolt',
  publisher: 'Zapbolt',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://zapbolt.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://zapbolt.com',
    siteName: 'Zapbolt',
    title: 'Zapbolt - Feedback at Lightning Speed',
    description:
      'Collect bug reports and feature requests with screenshots and session replays. Install in 5 minutes with one script tag. Free forever.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Zapbolt - Feedback at Lightning Speed',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zapbolt - Feedback at Lightning Speed',
    description:
      'Collect bug reports and feature requests with screenshots and session replays. Install in 5 minutes.',
    images: ['/og-image.png'],
    creator: '@zapbolt',
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
    google: 'google-site-verification-token',
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  );
}

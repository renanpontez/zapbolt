import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { getServerUser } from '@/lib/auth/getServerUser';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Zapbolt - Feedback Management',
  description: 'Collect and manage user feedback with ease',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getServerUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers initialUser={user}>{children}</Providers>
      </body>
    </html>
  );
}

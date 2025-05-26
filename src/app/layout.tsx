import { auth } from '@/auth';
import ClientProviders from '@/providers';
import '@worldcoin/mini-apps-ui-kit-react/styles.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Ganti Geist dengan Inter
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '600'], // Sesuaikan dengan kebutuhan (400 untuk body, 600 untuk heading)
});

export const metadata: Metadata = {
  title: 'RashPieCoin Claim',
  description: 'Claim RashPieCoin coin every day.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body
        className={`${inter.variable} h-[100dvh] bg-white px-2 sm:px-4 md:px-8 lg:px-16 w-full`}
        style={{ overscrollBehavior: 'none', fontFamily: 'var(--font-inter)' }} // Mengurangi padding untuk layar kecil
      >
        <ClientProviders session={session}>{children}</ClientProviders>
      </body>
    </html>
  );
}
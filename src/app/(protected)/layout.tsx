import { Inter } from 'next/font/google';
import { auth } from '@/auth';
import ClientProviders from '@/providers';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '600'], // Untuk body (400) dan heading (600)
});

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <div
      className={`${inter.variable} h-screen w-full bg-white px-4 sm:px-8 md:px-16`}
      style={{ overscrollBehavior: 'none', fontFamily: 'var(--font-inter)' }}
    >
      <ClientProviders session={session}>{children}</ClientProviders>
    </div>
  );
}
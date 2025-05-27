'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

const ErudaComponent = dynamic(() => import('./eruda-provider').then((mod) => mod.Eruda), {
  ssr: false,
  loading: () => null,
});

export const ErudaProvider = ({ children }: { children: ReactNode }) => {
  if (process.env.NEXT_PUBLIC_APP_ENV === 'production' || process.env.NODE_ENV === 'production') {
    return <>{children}</>;
  }
  return <ErudaComponent>{children}</ErudaComponent>;
};
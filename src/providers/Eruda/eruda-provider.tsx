'use client';

import { ReactNode, useEffect } from 'react';

const loadEruda = () => import('eruda');

interface ErudaWindow extends Window {
  eruda?: {
    init(): void;
    destroy(): void;
    _hide?(): void;
    [key: string]: any;
  };
}

export const Eruda = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_APP_ENV !== 'production') {
      loadEruda()
        .then(({ default: eruda }) => {
          try {
            const erudaWindow = window as unknown as ErudaWindow;
            if (!erudaWindow.eruda) {
              eruda.init();
            } else {
              console.warn('Eruda already initialized, skipping.');
            }
          } catch (error) {
            console.error('Eruda initialization failed:', error);
          }
        })
        .catch((error) => {
          console.error('Failed to load Eruda:', error);
        });

      return () => {
        const erudaWindow = window as unknown as ErudaWindow;
        if (erudaWindow.eruda?.destroy) {
          erudaWindow.eruda.destroy();
        }
      };
    }
  }, []);

  return <>{children}</>;
};
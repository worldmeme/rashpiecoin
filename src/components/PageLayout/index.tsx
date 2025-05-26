import clsx from 'clsx';
import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

export const Page = (props: { children: ReactNode; className?: string }) => {
  return (
    <div
      className={twMerge(
        clsx('flex h-[100dvh] w-full flex-col max-w-[1200px] mx-auto', props.className),
        'overscroll-y-none'
      )}
      style={{ overscrollBehavior: 'none' }}
    >
      {props.children}
    </div>
  );
};

const Header = (props: { children: ReactNode; className?: string }) => {
  return (
    <header
      className={twMerge(
        'bg-white flex flex-col justify-center px-6 sm:px-8 md:px-10 lg:px-12 pt-6 pb-3 z-10 w-full',
        clsx(props.className),
      )}
    >
      {props.children}
    </header>
  );
};

const Main = (props: { children: ReactNode; className?: string }) => {
  return (
    <main
      className={twMerge(
        clsx('grow overflow-y-auto p-2 sm:p-4 md:p-6 lg:p-8 w-full', props.className),
      )}
    >
      {props.children}
    </main>
  );
};

const Footer = (props: { children: ReactNode; className?: string }) => {
  return (
    <footer
      className={twMerge('px-6 sm:px-8 md:px-10 lg:px-12 pb-[35px] w-full', clsx(props.className))}
    >
      {props.children}
    </footer>
  );
};

Page.Header = Header;
Page.Main = Main;
Page.Footer = Footer;
'use client';
import { walletAuth } from '@/auth/wallet';
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { useMiniKit } from '@worldcoin/minikit-js/minikit-provider';
import { useCallback, useState } from 'react';

export const AuthButton = () => {
  const [isPending, setIsPending] = useState(false);
  const { isInstalled } = useMiniKit();

  const onClick = useCallback(async () => {
    if (!isInstalled || isPending) {
      return;
    }
    setIsPending(true);
    try {
      await walletAuth();
    } catch (error) {
      console.error('Wallet authentication button error', error);
    } finally {
      setIsPending(false);
    }
  }, [isInstalled, isPending]);

  return (
    <LiveFeedback
      label={{
        failed: 'Failed to login',
        pending: 'Logging in',
        success: 'Logged in',
      }}
      state={isPending ? 'pending' : undefined}
      className="w-full px-4 sm:px-6 md:px-8 lg:px-12"
    >
      <Button
        onClick={onClick}
        disabled={isPending}
        size="lg"
        variant="primary"
        className="w-full py-4 sm:py-5 md:py-6 text-xl sm:text-2xl md:text-3xl font-medium focus:outline-none focus:ring-2 focus:ring-[#006CFF]"
      >
        Login with Wallet
      </Button>
    </LiveFeedback>
  );
};
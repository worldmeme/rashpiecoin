'use client'; // Pastikan ini ada di baris pertama

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import TestContractABI from '@/abi/TestContract.json';
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { MiniKit } from '@worldcoin/minikit-js';
import { useWaitForTransactionReceipt } from '@worldcoin/minikit-react';
import { createPublicClient, http } from 'viem';
import { worldchain } from 'viem/chains';
import { ethers } from 'ethers';

interface MiniAppTransactionPayload {
  status?: string;
  description?: string;
  mini_app_id?: string;
  version?: number;
  transaction_id?: string;
  [key: string]: unknown;
}

interface TransactionProps {
  walletAddress: string | undefined;
  hasClaimed?: boolean | null;
  onSuccess?: () => void;
  onError?: (error: string | Error) => void;
  onClaimStatusUpdate?: (hasClaimed: boolean) => void;
}

const TransactionComponent = React.memo(
  ({
    walletAddress,
    hasClaimed,
    onSuccess,
    onError,
    onClaimStatusUpdate,
  }: TransactionProps) => {
    const [buttonState, setButtonState] = useState<'pending' | 'success' | 'failed' | undefined>(undefined);
    const [transactionId, setTransactionId] = useState<string>('');
    const [balance, setBalance] = useState<string>('0');
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [localHasClaimed, setLocalHasClaimed] = useState<boolean | null>(hasClaimed ?? false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showError, setShowError] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS || '0xc08C1CE8063f4d2FcC387aebb863313126Cee975';
    const appId = process.env.NEXT_PUBLIC_APP_ID;
    if (!tokenAddress) {
      throw new Error('NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS is not set in .env');
    }
    if (!appId) {
      throw new Error('NEXT_PUBLIC_APP_ID is not set in .env');
    }

    const rpcUrl = 'https://worldchain-mainnet.g.alchemy.com/public';
    const provider = useMemo(() => new ethers.JsonRpcProvider(rpcUrl), [rpcUrl]);

    const contract = useMemo(() => new ethers.Contract(tokenAddress, TestContractABI, provider), [tokenAddress, provider]);

    const fetchBalance = useCallback(async () => {
      if (!walletAddress || walletAddress === '0x0') {
        setBalance('0');
        return '0';
      }
      try {
        const balanceBigInt = await contract.balanceOf(walletAddress);
        const balanceInTokens = ethers.formatUnits(balanceBigInt, 18);
        const formattedBalance = parseFloat(balanceInTokens).toFixed(2);
        setBalance(formattedBalance);
        return formattedBalance;
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance('0');
        setErrorMessage('Failed to fetch balance');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
        return '0';
      }
    }, [walletAddress, contract]);

    const checkTimeUntilNextClaim = useCallback(async () => {
      if (!walletAddress || walletAddress === '0x0') {
        setRemainingTime(0);
        setLocalHasClaimed(false);
        setIsLoading(false);
        return;
      }
      try {
        const remainingSeconds = Number(await contract.getNextClaimTime(walletAddress));
        const lastClaim = Number(await contract.lastClaimTime(walletAddress));
        const balanceBigInt = await contract.balanceOf(walletAddress);

        const currentTime = Math.floor(Date.now() / 1000);
        const claimPeriod = 24 * 60 * 60;
        const timeSinceLastClaim = lastClaim > 0 ? currentTime - lastClaim : 0;

        const hasClaimedFromContract = (lastClaim > 0 || balanceBigInt > 0) && timeSinceLastClaim < claimPeriod;

        setLocalHasClaimed(hasClaimedFromContract);
        setRemainingTime(remainingSeconds > 0 ? remainingSeconds : 0);
        setErrorMessage(null);
        setShowError(false);
        if (onClaimStatusUpdate) onClaimStatusUpdate(hasClaimedFromContract);
      } catch (error) {
        console.error('Error checking time until next claim:', error);
        setErrorMessage('Failed to check claim status');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
        if (onError) onError('Failed to check claim status');
      } finally {
        setIsLoading(false);
      }
    }, [walletAddress, contract, onClaimStatusUpdate, onError]);

    const updateCountdown = useCallback(() => {
      setRemainingTime((prev) => {
        const newTime = Math.max(0, prev - 1);
        if (newTime <= 0 && localHasClaimed) {
          setLocalHasClaimed(false);
        }
        return newTime;
      });
    }, [localHasClaimed]);

    const formatCountdown = (seconds: number) => {
      if (seconds <= 0 && !localHasClaimed) return 'Get Token';
      const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
      const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      return `Wait ${hours}h ${minutes}m ${secs}s`;
    };

    useEffect(() => {
      if (!walletAddress || walletAddress === '0x0') {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      fetchBalance();
      checkTimeUntilNextClaim();

      const syncInterval = setInterval(() => {
        if (walletAddress && walletAddress !== '0x0') {
          fetchBalance();
          checkTimeUntilNextClaim();
        }
      }, 10000);

      const countdownInterval = setInterval(updateCountdown, 1000);

      return () => {
        clearInterval(syncInterval);
        clearInterval(countdownInterval);
      };
    }, [walletAddress, fetchBalance, checkTimeUntilNextClaim, updateCountdown]);

    const client = createPublicClient({
      chain: worldchain,
      transport: http(rpcUrl),
    });

    const { isLoading: isConfirming, isSuccess: isConfirmed, isError, error } = useWaitForTransactionReceipt({
      client,
      appConfig: { app_id: appId as `app_${string}` },
      transactionId,
    });

    useEffect(() => {
      if (transactionId && !isConfirming) {
        if (isConfirmed) {
          setButtonState('success');
          fetchBalance().then(() => {
            setLocalHasClaimed(true);
            setRemainingTime(24 * 60 * 60);
            setErrorMessage(null);
            setShowError(false);
            if (onClaimStatusUpdate) onClaimStatusUpdate(true);
            if (onSuccess) onSuccess();
            setTimeout(() => setButtonState(undefined), 3000);
          });
          checkTimeUntilNextClaim();
        } else if (isError) {
          console.error('Transaction failed:', error);
          setButtonState('failed');
          setErrorMessage('Transaction failed: ' + (error?.message || 'Unknown error'));
          setShowError(true);
          setTimeout(() => setShowError(false), 5000);
          if (onError) onError(error?.message || 'Transaction failed');
          setTimeout(() => setButtonState(undefined), 3000);
        }
      }
    }, [isConfirmed, isConfirming, isError, error, transactionId, fetchBalance, checkTimeUntilNextClaim, onSuccess, onError, onClaimStatusUpdate]);

    const handleClaim = async () => {
      if (!MiniKit.isInstalled()) {
        setButtonState('failed');
        setErrorMessage('MiniKit is not installed');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
        if (onError) onError('MiniKit is not installed');
        setTimeout(() => setButtonState(undefined), 3000);
        return;
      }

      if (!walletAddress || walletAddress === '0x0') {
        setButtonState('failed');
        setErrorMessage('Wallet address is invalid');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
        if (onError) onError('Wallet address is invalid');
        setTimeout(() => setButtonState(undefined), 3000);
        return;
      }

      if (remainingTime > 0 || localHasClaimed) {
        setButtonState('failed');
        setErrorMessage('Please wait until next claim time or you have already claimed');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
        if (onError) onError('Please wait until next claim time or you have already claimed');
        setTimeout(() => setButtonState(undefined), 3000);
        return;
      }

      setButtonState('pending');
      setTransactionId('');
      setErrorMessage(null);
      setShowError(false);

      try {
        const transactionPayload = {
          transaction: [
            {
              address: tokenAddress,
              abi: TestContractABI,
              functionName: 'claim',
              args: [],
            },
          ],
        };
        const result = await MiniKit.commandsAsync.sendTransaction(transactionPayload);
        const finalPayload = result as MiniAppTransactionPayload;
        console.log('Transaction Payload:', transactionPayload);
        console.log('Final Payload:', finalPayload);

        const balanceBefore = await fetchBalance();

        if (finalPayload && typeof finalPayload.transaction_id === 'string') {
          setTransactionId(finalPayload.transaction_id);
          console.log('Transaction submitted, waiting for confirmation:', finalPayload.transaction_id);
        } else if (finalPayload && 'status' in finalPayload && finalPayload.status === 'error') {
          const description = typeof finalPayload.description === 'string' ? finalPayload.description : 'Unknown error';
          console.error('Transaction submission failed:', description);
          setButtonState('failed');
          setErrorMessage(`Transaction failed: ${description}`);
          setShowError(true);
          setTimeout(() => setShowError(false), 5000);
          if (onError) onError(description);
          setTimeout(() => setButtonState(undefined), 3000);
        } else {
          console.warn('No transaction_id in payload, checking balance change:', finalPayload);

          await new Promise((resolve) => setTimeout(resolve, 5000));
          const balanceAfter = await fetchBalance();

          if (parseFloat(balanceAfter) > parseFloat(balanceBefore)) {
            setButtonState('success');
            setLocalHasClaimed(true);
            setRemainingTime(24 * 60 * 60);
            setErrorMessage(null);
            setShowError(false);
            if (onClaimStatusUpdate) onClaimStatusUpdate(true);
            if (onSuccess) onSuccess();
            setTimeout(() => setButtonState(undefined), 3000);
            checkTimeUntilNextClaim();
          } else {
            console.error('No balance change detected, assuming transaction failed:', finalPayload);
            setButtonState('failed');
            setErrorMessage('Transaction failed: No balance change detected');
            setShowError(true);
            setTimeout(() => setShowError(false), 5000);
            if (onError) onError('No balance change detected');
            setTimeout(() => setButtonState(undefined), 3000);
          }
        }
      } catch (err) {
        console.error('Error sending transaction:', err);
        setButtonState('failed');
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        if (errorMsg.toLowerCase().includes('cancel') || errorMsg.toLowerCase().includes('user denied')) {
          setErrorMessage('Transaction cancelled by user');
          setShowError(true);
          setTimeout(() => setShowError(false), 5000);
          if (onError) onError('Transaction cancelled by user');
        } else {
          setErrorMessage('Error sending transaction: ' + errorMsg);
          setShowError(true);
          setTimeout(() => setShowError(false), 5000);
          if (onError) onError('Error sending transaction: ' + errorMsg);
        }
        setTimeout(() => setButtonState(undefined), 3000);
      }
    };

    return (
      <div className="w-full flex flex-col items-center justify-center gap-4 p-4 sm:max-w-md">
        <p className="text-base font-inter text-[#666666] mb-2">
          Every human can claim every day.
        </p>
        {showError && errorMessage && (
          <p className="text-[#FF3333] font-inter text-base mb-2">{errorMessage}</p>
        )}
        <LiveFeedback
          label={{
            failed: 'Transaction failed',
            pending: 'Transaction pending',
            success: 'Transaction successful',
          }}
          state={buttonState}
          className="w-full text-base font-inter text-[#666666]"
        >
          {isLoading ? (
            <Button
              disabled={true}
              size="lg"
              variant="primary"
              className="w-full py-3 text-base font-inter font-medium rounded-lg bg-[#E6E6E6] text-[#1A1A1A]"
            >
              Loading...
            </Button>
          ) : (
            <Button
              onClick={handleClaim}
              disabled={buttonState === 'pending' || (remainingTime > 0 || localHasClaimed) || !walletAddress}
              size="lg"
              variant="primary"
              className={`w-full py-3 text-base font-inter font-medium rounded-lg transition-colors ${
                buttonState === 'pending' || (remainingTime > 0 || localHasClaimed) || !walletAddress
                  ? 'bg-[#E6E6E6] text-[#1A1A1A]'
                  : 'bg-[#006CFF] text-white hover:bg-[#0056CC]'
              } focus:outline-none focus:ring-2 focus:ring-[#006CFF]`}
            >
              {formatCountdown(remainingTime)}
            </Button>
          )}
        </LiveFeedback>
        {localHasClaimed && !isLoading && (
          <p className="text-[#666666] text-base font-inter mt-2">
            You have already claimed.
          </p>
        )}
        <div className="flex items-center gap-2 mt-4">
          <svg
            className="w-6 h-6 text-[#006CFF]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-2c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 12c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7-6-6-6z"
            />
          </svg>
          <a
            href="https://worldcoin.org/mini-app?app_id=app_a4f7f3e62c1de0b9490a5260cb390b56&app_mode=mini-app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-inter font-semibold text-[#006CFF] hover:underline"
          >
            Balance: {isLoading ? 'Loading...' : `${balance} RASH`}
          </a>
        </div>
      </div>
    );
  }
);

// Tetapkan displayName setelah memo
TransactionComponent.displayName = 'TransactionComponent';

export { TransactionComponent as Transaction };
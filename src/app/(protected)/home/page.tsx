'use client';

import { Page } from '@/components/PageLayout';
import { Transaction } from '@/components/Transaction';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { AuthButton } from '@/components/AuthButton';
import { toast } from 'react-toastify';

export default function HomePage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'claim' | 'invite' | 'about' | 'reward'>('claim');
  const [error, setError] = useState<string | null>(null);
  const [hasClaimed, setHasClaimed] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      setActiveTab('claim');
    }
  }, [status, session]);

  const user = session?.user || {
    id: '0x0',
    walletAddress: '0x0',
    username: 'Guest User',
    profilePictureUrl: '',
  };

  if (status === 'loading') {
    return (
      <Page>
        <Page.Main className="flex items-center justify-center h-screen w-full bg-white px-4">
          <div className="flex items-center">
            <svg
              className="animate-spin h-10 w-10 text-black sm:h-12 sm:w-12"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="ml-2 text-black font-inter text-lg sm:text-xl">Loading...</p>
          </div>
        </Page.Main>
      </Page>
    );
  }

  if (status === 'unauthenticated' || user.walletAddress === '0x0') {
    return (
      <Page>
        <Page.Main className="flex flex-col items-center justify-center h-screen w-full bg-white px-4">
          {error && <p className="text-[#FF3333] font-inter text-lg mb-4">{error}</p>}
          <div className="p-4">
            <Image
              src="/worldcoin-logo.png"
              alt="RashPieCoin Claim"
              width={128}
              height={128}
              className="mb-4 rounded-full shadow-md"
            />
          </div>
          <p className="text-4xl font-inter font-semibold text-black">RashPieCoin Claim</p>
          <p className="text-lg font-inter text-[#666666] mt-2">Claim RashPieCoin coin every day.</p>
          <div className="w-full mt-4">
            <AuthButton />
          </div>
        </Page.Main>
      </Page>
    );
  }

  return (
    <Page>
      <Page.Header>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Image
              src="/worldcoin-logo.png"
              alt="RashPieCoin Claim"
              width={40}
              height={40}
              className="rounded-full"
            />
            <p className="text-xl font-inter font-semibold text-black">RashPieCoin Claim</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-[#006CFF] font-inter text-base hover:text-[#0056CC] focus:outline-none focus:ring-2 focus:ring-[#006CFF]"
          >
            Logout
          </button>
        </div>
      </Page.Header>
      <Page.Main className="flex flex-col h-screen w-full bg-white px-4 sm:px-8 md:px-16">
        <div className="bg-white rounded-lg p-4 mt-4 mb-4 flex-1">
          <div className="flex flex-col items-center gap-4">
            <Image
              src={user.profilePictureUrl || '/worldcoin-logo.png'}
              alt="Profile or Worldcoin Logo"
              width={80}
              height={80}
              className="rounded-full border-2 border-[#E6E6E6] shadow-sm"
            />
            <p className="text-2xl font-inter font-semibold text-black capitalize">{user.username}</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#F5F5F5] border border-[#E6E6E6] rounded-lg px-3 py-1">
                <span className="text-base font-inter text-[#666666]">
                  {`${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`}
                </span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(user.walletAddress).then(() => {
                    toast.success('Address copied to clipboard!');
                  }).catch((err) => {
                    toast.error('Failed to copy address.');
                    console.error(err);
                  });
                }}
                className="flex items-center justify-center bg-[#006CFF] text-white rounded-lg px-3 py-1 text-sm font-inter hover:bg-[#0056CC] transition-colors focus:outline-none focus:ring-2 focus:ring-[#006CFF]"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-2"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="tab-container border-b border-gray-300" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === 'claim'}
                onClick={() => setActiveTab('claim')}
                className={`tab-button ${activeTab === 'claim' ? 'active' : ''}`}
              >
                Claim
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'invite'}
                onClick={() => setActiveTab('invite')}
                className={`tab-button ${activeTab === 'invite' ? 'active' : ''}`}
              >
                Invite
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'about'}
                onClick={() => setActiveTab('about')}
                className={`tab-button ${activeTab === 'about' ? 'active' : ''}`}
              >
                About
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'reward'}
                onClick={() => setActiveTab('reward')}
                className={`tab-button ${activeTab === 'reward' ? 'active' : ''}`}
              >
                Reward
              </button>
            </div>

            <div className="mt-4 transition-opacity duration-300 flex-1 overflow-auto">
              {activeTab === 'claim' ? (
                <div className="flex flex-col items-center gap-4">
                  <Transaction
                    walletAddress={user.walletAddress}
                    hasClaimed={hasClaimed}
                    onClaimStatusUpdate={(status) => {
                      console.log('onClaimStatusUpdate called with:', status);
                      setHasClaimed(status);
                    }}
                    onError={(err) => setError(err instanceof Error ? err.message : 'Failed to claim token')}
                  />
                </div>
              ) : activeTab === 'invite' ? (
                <div>
                  <h2 className="text-2xl font-inter font-semibold text-black">Invite Friends</h2>
                  <p className="text-base font-inter text-[#666666] mt-2 leading-relaxed">
                    Coming soon! Stay tuned for updates on inviting friends.
                  </p>
                </div>
              ) : activeTab === 'reward' ? (
                <div>
                  <h2 className="text-2xl font-inter font-semibold text-black">Reward</h2>
                  <p className="text-base font-inter text-[#666666] mt-2 leading-relaxed">
                    Rewards feature is currently unavailable.
                  </p>
                </div>
              ) : activeTab === 'about' ? (
                <div>
                  <h2 className="text-2xl font-inter font-semibold text-black">About RashPieCoin App</h2>
                  <p className="text-base font-inter text-[#666666] mt-2 leading-relaxed">
                    RashPieCoin App is an exciting mini app crafted for the Worldcoin ecosystem, empowering verified users to effortlessly claim 2 RASH daily and dive into a rewarding digital experience!
                  </p>
                  <a
                    href="https://worldcoin.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 text-[#006CFF] hover:text-[#0056CC] mt-2 text-base font-inter transition-colors focus:outline-none focus:ring-2 focus:ring-[#006CFF]"
                  >
                    Learn More
                  </a>
                  <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    <button
                      onClick={() => (window.location.href = 'https://worldcoin.org/mini-app?app_id=app_a4f7f3e62c1de0b9490a5260cb390b56&app_mode=mini-app')}
                      className="w-full sm:w-auto bg-[#006CFF] text-white font-inter py-3 px-6 rounded-lg hover:bg-[#0056CC] text-base transition-colors focus:outline-none focus:ring-2 focus:ring-[#006CFF]"
                    >
                      Buy and Sell RASH
                    </button>
                    <button
                      onClick={() => (window.location.href = 'https://accounts.bmwweb.me/register?ref=ZKO2JGYW')}
                      className="w-full sm:w-auto bg-[#006CFF] text-white font-inter py-3 px-6 rounded-lg hover:bg-[#0056CC] text-base transition-colors focus:outline-none focus:ring-2 focus:ring-[#006CFF]"
                    >
                      Buy WLD
                    </button>
                    <a
                      href="https://x.com/RashPieCoin"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#14171A] font-inter py-3 px-6 rounded-lg hover:bg-[#272c30] text-base transition-colors !text-white focus:outline-none focus:ring-2 focus:ring-[#006CFF]"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="white"
                        className="min-w-[20px] min-h-[20px]"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      Follow us on X
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-[#FF3333] font-inter text-base">Invalid Tab State: {activeTab}</p>
              )}
            </div>
          </div>
        </div>
      </Page.Main>
    </Page>
  );
}
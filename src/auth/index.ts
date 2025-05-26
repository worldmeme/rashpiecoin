import { hashNonce } from '@/auth/wallet/client-helpers';
import {
  MiniAppWalletAuthSuccessPayload,
  MiniKit,
  verifySiweMessage,
} from '@worldcoin/minikit-js';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { ethers } from 'ethers';

declare module 'next-auth' {
  interface User {
    walletAddress: string;
    username: string;
    profilePictureUrl: string;
    hasClaimed?: boolean;
  }

  interface Session {
    user: {
      walletAddress: string;
      username: string;
      profilePictureUrl: string;
      hasClaimed?: boolean;
    } & DefaultSession['user'];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'World App Wallet',
      credentials: {
        nonce: { label: 'Nonce', type: 'text' },
        signedNonce: { label: 'Signed Nonce', type: 'text' },
        finalPayloadJson: { label: 'Final Payload', type: 'text' },
      },
      authorize: async (credentials) => {
        // Validasi bahwa semua properti ada dan bertipe string
        const nonce = credentials.nonce;
        const signedNonce = credentials.signedNonce;
        const finalPayloadJson = credentials.finalPayloadJson;

        if (
          typeof nonce !== 'string' ||
          typeof signedNonce !== 'string' ||
          typeof finalPayloadJson !== 'string'
        ) {
          console.log('Authorize - Missing or invalid credentials:', {
            nonce,
            signedNonce,
            finalPayloadJson,
          });
          return null;
        }

        const expectedSignedNonce = hashNonce({ nonce });

        if (signedNonce !== expectedSignedNonce) {
          console.log('Authorize - Invalid signed nonce');
          return null;
        }

        const finalPayload: MiniAppWalletAuthSuccessPayload = JSON.parse(finalPayloadJson);
        const result = await verifySiweMessage(finalPayload, nonce);

        if (!result.isValid || !result.siweMessageData.address) {
          console.log('Authorize - Invalid final payload');
          return null;
        }
        const userInfo = await MiniKit.getUserInfo(finalPayload.address);

        let hasClaimed = false;
        try {
          console.log(`Authorize - Checking claim status for address: ${finalPayload.address}`);
          const provider = new ethers.JsonRpcProvider('https://worldchain-mainnet.g.alchemy.com/public');
          const contractAddress = '0x3050c0A0A4466628e56D04DE48787C520EF4E445';
          console.log(`Authorize - Using contract: ${contractAddress}`);
          console.log(`Authorize - Using RPC: https://worldchain-mainnet.g.alchemy.com/public`);

          const contractABI = [
            'function getNextClaimTime(address user) external view returns (uint256)',
            'function balanceOf(address account) external view returns (uint256)',
            'function lastClaimTime(address user) external view returns (uint256)',
          ];
          const contract = new ethers.Contract(contractAddress, contractABI, provider);

          const time = await contract.getNextClaimTime(finalPayload.address);
          const remainingSeconds = Number(time);
          console.log(`Authorize - getNextClaimTime: ${remainingSeconds} seconds`);

          const lastClaim = await contract.lastClaimTime(finalPayload.address);
          console.log(`Authorize - lastClaimTime: ${lastClaim} (Unix timestamp)`);

          const balanceBigInt = await contract.balanceOf(finalPayload.address);
          console.log(`Authorize - Balance: ${ethers.formatUnits(balanceBigInt, 18)} RASH`);

          hasClaimed = (lastClaim > 0 && remainingSeconds === 0) || balanceBigInt > 0;
          console.log(`Authorize - Calculated hasClaimed: ${hasClaimed}`);

          if (lastClaim > 0) console.log(`Authorize - lastClaim > 0 is true, remainingSeconds: ${remainingSeconds}`);
          if (balanceBigInt > 0) console.log(`Authorize - balance > 0 is true, balance: ${ethers.formatUnits(balanceBigInt, 18)} RASH`);
        } catch (error) {
          console.error(`Authorize - Error checking claim status for ${finalPayload.address}:`, error);
          hasClaimed = false;
        }

        const user = {
          id: finalPayload.address,
          walletAddress: finalPayload.address,
          username: userInfo.username ?? '', // Berikan nilai default jika undefined
          profilePictureUrl: userInfo.profilePictureUrl ?? '', // Berikan nilai default jika undefined
          hasClaimed,
        };
        console.log('Authorize - User object being returned:', user);
        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.walletAddress = user.walletAddress;
        token.username = user.username;
        token.profilePictureUrl = user.profilePictureUrl;
        token.hasClaimed = user.hasClaimed;
      }
      console.log('JWT Token:', token);
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.walletAddress = token.walletAddress as string;
        session.user.username = token.username as string;
        session.user.profilePictureUrl = token.profilePictureUrl as string;
        session.user.hasClaimed = token.hasClaimed as boolean;
      }
      console.log('Session in callback:', session);
      return session;
    },
  },
});
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'https://687a-2001-448a-20e0-9ecc-2c77-d04d-de44-4ecf.ngrok-free.app',
  ],
  images: {
    domains: ['static.usernames.app-backend.toolsforhumanity.com'],
  },
  async rewrites() {
    return [
      {
        source: '/invite',
        destination: '/', // Arahkan ke halaman utama
      },
    ];
  },
};

export default nextConfig;
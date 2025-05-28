import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'https://2302-2001-448a-20e0-9ecc-442c-f71a-fdad-19df.ngrok-free.app',
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
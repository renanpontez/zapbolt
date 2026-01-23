import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@zapbolt/shared'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qmwqkirmfhmowdlapotd.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@zapbolt/shared'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // App directory is now stable in Next.js 14
  images: {
    domains: ['localhost', 'example.com'],
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  },
  webpack: (config) => {
    // Handle Three.js
    config.externals = config.externals || {};
    config.externals['three'] = 'three';
    
    return config;
  },
}

module.exports = nextConfig

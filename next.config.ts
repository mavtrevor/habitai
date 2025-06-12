
import type {NextConfig} from 'next';

const isProduction = process.env.NODE_ENV === 'production';

// Configuration for next-pwa
const pwaConfig = {
  dest: "public",
  register: true,
  skipWaiting: true,
  // Explicitly disable PWA features unless it's a production build
  disable: !isProduction, 
  // You can add more PWA options here if needed
  //  fallbacks: {
  //    document: '/offline', // if you want to fallback to a custom page
  //  }
};

const withPWA = require("@ducanh2912/next-pwa").default(pwaConfig);

// Base Next.js configuration
const baseConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com', // Ensures Pexels images are allowed
        port: '',
        pathname: '/**',
      },
    ],
  },
  // If you have Turbopack-specific options, they can go here,
  // but usually, Turbopack works by default without explicit experimental flags for basic features.
  // experimental: {
  //   turbo: {},
  // },
};

// Apply the PWA wrapper only in production
export default isProduction ? withPWA(baseConfig) : baseConfig;

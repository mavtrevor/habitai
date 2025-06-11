
import type {NextConfig} from 'next';

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // Disable PWA in development
  // You can add more PWA options here if needed
  //  fallbacks: {
  //    document: '/offline', // if you want to fallback to a custom page
  //  }
});

const nextConfig: NextConfig = {
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
};

export default withPWA(nextConfig);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Add any experimental features here if needed
  },
  // Don't fail the build on ESLint errors in production
  eslint: {
    // Only warn about ESLint errors; don't fail the build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

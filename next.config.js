/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  transpilePackages: [
    "@radix-ui/react-avatar",
    "@radix-ui/react-slot",
    "@radix-ui/react-tabs",
    "@radix-ui/react-toast",
  ],
};

module.exports = nextConfig;
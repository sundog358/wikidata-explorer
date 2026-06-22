/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  transpilePackages: [
    "@radix-ui/react-slot",
    "@radix-ui/react-tabs",
  ],
};

module.exports = nextConfig;
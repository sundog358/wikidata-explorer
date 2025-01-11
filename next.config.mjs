/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@radix-ui/react-avatar",
    "@radix-ui/react-slot",
    "@radix-ui/react-toast",
  ],
  swcMinify: true,
};

export default nextConfig;

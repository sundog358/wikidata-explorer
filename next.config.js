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
  outputFileTracingIncludes: {
    "/opengraph-image": ["./public/images/jean-francois-millet-gleaners-google-art-project-2.jpg"],
  },
  outputFileTracingExcludes: {
    "*": [
      "./.git/**/*",
      "./.tmp/**/*",
      "./data/**/*",
      "./docs/screenshots/**/*",
      "./images/**/*",
      "./metagenauto/**/*",
      "./notebooks/**/*",
      "./out/**/*",
      "./utils/**/*",
      "./*.ipynb",
      "./*.pdf",
      "./*.png",
      "./*.csv",
      "./*.txt",
      "./next.config.js",
      "./pywikibot.lwp",
      "./throttle.ctrl",
      "./user-config.py",
      "./user-password.py",
      "./**/__pycache__/**/*",
    ],
  },
};

module.exports = nextConfig;

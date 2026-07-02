/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    instrumentationHook: true,
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

module.exports = nextConfig;

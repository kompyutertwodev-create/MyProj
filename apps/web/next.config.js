/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: ['@workspace/platform-client'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

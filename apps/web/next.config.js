/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@snh/shared-types']
};

module.exports = nextConfig;

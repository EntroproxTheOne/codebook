/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  poweredByHeader: false,
  compress: true,
}

module.exports = nextConfig

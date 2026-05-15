/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['playwright', 'cheerio', 'sqlite3'],
  output: 'standalone',
  allowedDevOrigins: ['192.168.15.3', '192.168.15.4'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['playwright', 'cheerio', 'sqlite3'],
  output: 'standalone',
  allowedDevOrigins: ['192.168.15.3', '192.168.15.4'],
}

module.exports = nextConfig

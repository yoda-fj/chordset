/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['playwright', 'cheerio', 'sqlite3'],
  output: 'standalone',
}

module.exports = nextConfig

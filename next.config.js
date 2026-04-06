/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Não bundlar playwright e cheerio no servidor
    serverComponentsExternalPackages: ['playwright', 'cheerio'],
  },
}

module.exports = nextConfig

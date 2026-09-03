/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['playwright', 'cheerio'],
  output: 'standalone',
  allowedDevOrigins: ['192.168.15.3', '192.168.15.4'],
}

// SPIKE 0.8 — Serwist (PWA). @serwist/next é ESM-only, por isso o import dinâmico
// dentro de uma função de config assíncrona (suportada pelo Next).
module.exports = async () => {
  const { default: withSerwistInit } = await import('@serwist/next')
  const withSerwist = withSerwistInit({
    swSrc: 'src/app/sw.ts',
    swDest: 'public/sw.js',
    // Dev roda com Turbopack (não suportado pelo Serwist) — SW só no build de produção.
    // Produção exige `next build --webpack` (ver docs/aaa-reviews/07-spike-pwa.md).
    disable: process.env.NODE_ENV !== 'production',
  })
  return withSerwist(nextConfig)
}

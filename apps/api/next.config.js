/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@reino-flor/database', '@reino-flor/auth'],
}

module.exports = nextConfig

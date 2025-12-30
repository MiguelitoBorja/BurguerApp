/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignora errores de ESLint (como variables no usadas)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignora errores de TypeScript (como tipos 'any')
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
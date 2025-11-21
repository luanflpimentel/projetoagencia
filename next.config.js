/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Habilitar output standalone para Docker
  output: 'standalone',
  
  // Desabilitar telemetria
  telemetry: false,
  
  // Otimizações
  poweredByHeader: false,
  compress: true,
  
  // ESLint e TypeScript
  eslint: {
    ignoreDuringBuilds: true, // Ajuste conforme necessário
  },
  typescript: {
    ignoreBuildErrors: false, // Mantenha false para produção
  },
  
  // Configurações de imagem (se usar next/image)
  images: {
    domains: [
      'supabase.co',
      // Adicione outros domínios se necessário
    ],
  },
  
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
    ]
  },
}

module.exports = nextConfig

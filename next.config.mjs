/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://ep2.adtrafficquality.google https://partner.googleadservices.com https://adservice.google.com https://tpc.googlesyndication.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: https://images.unsplash.com https://*.unsplash.com https://*.premierpet.com.br https://*.royalcanin.com https://*.royalcanin.com.br https://*.hills.com.br https://*.hills.com https://res.cloudinary.com https://*.vercel-storage.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net",
      "font-src 'self' data:",
      "frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com",
      "connect-src 'self' https://pagead2.googlesyndication.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://stats.g.doubleclick.net",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
  {
    key: 'Link',
    value: '</llms.txt>; rel="describedby"',
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Remove o cabeçalho X-Powered-By para evitar fingerprinting de versão
  // Impede que pastas pesadas sejam empacotadas no bundle zip das Serverless Functions da Vercel
  outputFileTracingExcludes: {
    '*': [
      './public/uploads/**/*',
      './biblioteca_regulatoria/**/*',
      './produtos_cadastro/**/*',
      './_backup_fichas_pdf/**/*',
    ],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.premierpet.com.br',
      },
      {
        protocol: 'https',
        hostname: '*.royalcanin.com',
      },
      {
        protocol: 'https',
        hostname: '*.royalcanin.com.br',
      },
      {
        protocol: 'https',
        hostname: '*.hills.com.br',
      },
      {
        protocol: 'https',
        hostname: '*.hills.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.vercel-storage.com',
      },
    ],
  },
  async headers() {
    return [
      {
        // Aplica cabeçalhos de segurança a todas as rotas do site
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

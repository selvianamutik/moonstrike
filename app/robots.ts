import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://moonstrike.pro'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Allow all major crawlers including AI bots
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/profile/',
          '/cart/',
          '/checkout/',
          '/login',
          '/register',
          '/auth/',
        ],
      },
      // Explicitly allow AI crawlers on public content
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'Applebot-Extended', allow: '/' },
      { userAgent: 'Bytespider', allow: '/' },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}

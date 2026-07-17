import type { APIRoute } from 'astro';

const getRobotsTxt = (sitemapURL: URL) => `User-agent: *
Allow: /
Sitemap: ${sitemapURL.href}
`;

export const GET: APIRoute = ({ site }) => {
  if (!site) {
    throw new Error('The Astro site option is required to generate robots.txt.');
  }

  return new Response(getRobotsTxt(new URL('sitemap-index.xml', site)), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};

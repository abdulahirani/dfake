import type { AppConfig, Post } from './firebase';
import { optimizeImageUrl } from './image';

export type PageId =
  | 'home'
  | 'blog'
  | 'sitemap'
  | 'docs'
  | 'faq'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'disclaimer';

export interface SitePageMeta {
  id: PageId;
  label: string;
  title: string;
  description: string;
  group: 'core' | 'legal';
}

export const DEFAULT_DOMAIN = 'https://scandeepfake.web.app';

export const SITE_PAGES: SitePageMeta[] = [
  {
    id: 'home',
    label: 'Neural Scanner',
    title: 'ScanDeepFake | AI Forensic & Deepfake Detector',
    description:
      'Detect AI-generated images, face swaps, and synthetic videos instantly with ScanDeepFake neural forensic tools.',
    group: 'core',
  },
  {
    id: 'blog',
    label: 'Forensic Blog & Articles',
    title: 'Forensic Blog & Daily AI Reports | ScanDeepFake',
    description:
      'Read daily deepfake detection guides, neural artifact analysis, and digital forensic reports on ScanDeepFake.',
    group: 'core',
  },
  {
    id: 'sitemap',
    label: 'Sitemap Directory',
    title: 'Sitemap & Full Directory | ScanDeepFake',
    description:
      'Browse the complete ScanDeepFake directory of deepfake detection tools, forensic reports, guides, and policies.',
    group: 'core',
  },
  {
    id: 'docs',
    label: 'Forensic Manual & Docs',
    title: 'Forensic Manual & Neural Docs | ScanDeepFake',
    description:
      'Explore ScanDeepFake frequency domain analysis, Vision Transformer architecture, and zero-retention sandbox docs.',
    group: 'core',
  },
  {
    id: 'faq',
    label: 'Help & FAQ',
    title: 'Deepfake Detection FAQ & Help | ScanDeepFake',
    description:
      'Answers to common questions about spotting deepfake videos, AI face swaps, and media authenticity checks.',
    group: 'core',
  },
  {
    id: 'about',
    label: 'About Forensic Lab',
    title: 'About ScanDeepFake Forensic Lab | ScanDeepFake',
    description:
      'Learn about ScanDeepFake, our privacy-first forensic mission, and how we protect digital truth online.',
    group: 'core',
  },
  {
    id: 'contact',
    label: 'Contact Us',
    title: 'Contact ScanDeepFake Support | ScanDeepFake',
    description:
      'Get in touch with the ScanDeepFake forensic team for support, feedback, or media verification inquiries.',
    group: 'legal',
  },
  {
    id: 'privacy',
    label: 'Privacy Policy',
    title: 'Privacy Policy | ScanDeepFake',
    description:
      'Read the ScanDeepFake Privacy Policy detailing zero-retention local processing and ephemeral sandbox security.',
    group: 'legal',
  },
  {
    id: 'terms',
    label: 'Terms of Service',
    title: 'Terms of Service | ScanDeepFake',
    description:
      'Review the ScanDeepFake Terms of Service for personal and professional media verification usage.',
    group: 'legal',
  },
  {
    id: 'disclaimer',
    label: 'Legal Disclaimer',
    title: 'Legal Disclaimer | ScanDeepFake',
    description:
      'Read the probabilistic detection disclaimer and forensic verification guidelines for ScanDeepFake.',
    group: 'legal',
  },
];

export function getPagePath(page: PageId, postId?: string | null): string {
  if (page === 'home') return '/';
  if (page === 'blog' && postId) {
    return `/?p=blog&post=${encodeURIComponent(postId)}`;
  }
  return `/?p=${page}`;
}

export function getCanonicalUrl(
  page: PageId,
  postId?: string | null,
  domain?: string
): string {
  const origin =
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    !window.location.hostname.includes('127.0.0.1')
      ? window.location.origin
      : domain || DEFAULT_DOMAIN;
  return `${origin.replace(/\/$/, '')}${getPagePath(page, postId)}`;
}

export function parseRouteFromLocation(): {
  page: PageId;
  postId: string | null;
} {
  if (typeof window === 'undefined') {
    return { page: 'home', postId: null };
  }
  const params = new URLSearchParams(window.location.search);
  const queryPage = params.get('p') as PageId | null;
  const queryPost = params.get('post');
  const validPages: PageId[] = [
    'home',
    'blog',
    'sitemap',
    'docs',
    'faq',
    'about',
    'contact',
    'privacy',
    'terms',
    'disclaimer',
  ];

  if (queryPage && validPages.includes(queryPage)) {
    return { page: queryPage, postId: queryPage === 'blog' ? queryPost : null };
  }
  if (queryPost) {
    return { page: 'blog', postId: queryPost };
  }

  // Also support clean pathname routes like /blog, /blog/slug, /sitemap, /docs, etc.
  const segments = window.location.pathname
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean);
  if (segments.length > 0) {
    const first = segments[0].toLowerCase() as PageId;
    if (validPages.includes(first)) {
      return {
        page: first,
        postId: first === 'blog' && segments[1] ? segments[1] : null,
      };
    }
  }

  return { page: 'home', postId: null };
}

export function generateSitemapXml(
  posts: Post[],
  baseUrl: string = DEFAULT_DOMAIN
): string {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const today = new Date().toISOString().split('T')[0];

  const pageEntries = SITE_PAGES.map((page) => {
    const loc =
      page.id === 'home' ? `${cleanBase}/` : `${cleanBase}/?p=${page.id}`;
    const priority =
      page.id === 'home'
        ? '1.0'
        : page.id === 'blog'
          ? '0.9'
          : page.id === 'sitemap'
            ? '0.8'
            : '0.7';
    const changefreq =
      page.id === 'home' || page.id === 'blog' || page.id === 'sitemap'
        ? 'daily'
        : 'weekly';
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  });

  const postEntries = posts
    .filter((p) => p.published !== false && p.id)
    .map((p) => {
      const loc = `${cleanBase}/?p=blog&amp;post=${encodeURIComponent(p.id)}`;
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
    });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[
    ...pageEntries,
    ...postEntries,
  ].join('\n')}\n</urlset>`;
}

function upsertMetaTag(
  attrName: 'name' | 'property',
  attrValue: string,
  content: string
) {
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function updateHeadSeo({
  page,
  postId,
  posts,
  config,
}: {
  page: PageId;
  postId: string | null;
  posts: Post[];
  config: AppConfig | null;
}) {
  if (typeof document === 'undefined') return;

  const siteName = config?.settings?.siteName || 'ScanDeepFake';
  const domain = config?.settings?.domain || DEFAULT_DOMAIN;
  const pageMeta =
    SITE_PAGES.find((p) => p.id === page) || SITE_PAGES[0];
  const activePost =
    page === 'blog' && postId
      ? posts.find((p) => p.id === postId) || null
      : null;

  let rawTitle = pageMeta.title;
  let description = pageMeta.description;
  let ogType = 'website';

  if (activePost) {
    rawTitle = `${activePost.title} | ${siteName}`;
    description =
      activePost.metaDesc ||
      activePost.desc ||
      pageMeta.description;
    ogType = 'article';
  } else if (page === 'home' && config?.settings?.siteDescription) {
    description = config.settings.siteDescription;
  }

  const finalTitle =
    rawTitle.length > 60 ? `${rawTitle.slice(0, 57)}...` : rawTitle;
  const finalDesc =
    description.length > 160
      ? `${description.slice(0, 157)}...`
      : description;
  const canonicalUrl = getCanonicalUrl(
    page,
    activePost ? activePost.id : null,
    domain
  );
  const ogImage = optimizeImageUrl(
    activePost?.imageUrl || posts[0]?.imageUrl,
    1200
  );

  document.title = finalTitle;
  upsertMetaTag('name', 'description', finalDesc);
  upsertMetaTag('property', 'og:type', ogType);
  upsertMetaTag('property', 'og:title', finalTitle);
  upsertMetaTag('property', 'og:description', finalDesc);
  upsertMetaTag('property', 'og:url', canonicalUrl);
  upsertMetaTag('property', 'og:site_name', siteName);
  upsertMetaTag('property', 'og:image', ogImage);
  upsertMetaTag('name', 'twitter:card', 'summary_large_image');
  upsertMetaTag('name', 'twitter:title', finalTitle);
  upsertMetaTag('name', 'twitter:description', finalDesc);
  upsertMetaTag('name', 'twitter:image', ogImage);

  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', canonicalUrl);

  // Structured Data (JSON-LD)
  let jsonLdScript = document.getElementById('dynamic-jsonld');
  if (!jsonLdScript) {
    jsonLdScript = document.createElement('script');
    jsonLdScript.id = 'dynamic-jsonld';
    jsonLdScript.setAttribute('type', 'application/ld+json');
    document.head.appendChild(jsonLdScript);
  }

  const schemaObj = activePost
    ? {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BlogPosting',
            headline: activePost.title,
            description: finalDesc,
            datePublished: activePost.date,
            author: {
              '@type': 'Person',
              name: activePost.author || 'ScanDeepFake Editorial',
            },
            publisher: {
              '@type': 'Organization',
              name: siteName,
            },
            mainEntityOfPage: canonicalUrl,
            image: ogImage,
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: getCanonicalUrl('home', null, domain),
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Blog',
                item: getCanonicalUrl('blog', null, domain),
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: activePost.title,
                item: canonicalUrl,
              },
            ],
          },
        ],
      }
    : page === 'blog'
      ? {
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: `${siteName} Forensic Blog`,
          description: finalDesc,
          url: canonicalUrl,
          blogPost: posts.slice(0, 20).map((p) => ({
            '@type': 'BlogPosting',
            headline: p.title,
            url: getCanonicalUrl('blog', p.id, domain),
            datePublished: p.date,
            image: optimizeImageUrl(p.imageUrl, 640),
          })),
        }
      : page === 'faq' && config?.faqs?.length
        ? {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: config.faqs.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: f.a,
              },
            })),
          }
        : page === 'sitemap'
          ? {
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: `${siteName} Sitemap`,
              description: finalDesc,
              url: canonicalUrl,
            }
          : {
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: siteName,
              url: canonicalUrl,
              applicationCategory: 'SecurityApplication',
              operatingSystem: 'All',
              description: finalDesc,
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
            };

  jsonLdScript.textContent = JSON.stringify(schemaObj);
}

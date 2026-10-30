/**
 * Finalitie · Sanity CMS Client Integration
 * -------------------------------------------------------------
 * Easy, zero-dependency Sanity integration using native fetch and GROQ.
 * Hardened for production: XSS escaping, AbortController timeouts,
 * zero external CDN dependencies, and resilient offline fallbacks.
 */

const SANITY_CONFIG = {
  projectId: 'ljymyve8',
  dataset: 'production',
  apiVersion: '2023-05-03',
  useCdn: false,
};

// Fallback articles with 100% local assets
const FALLBACK_POSTS = [
  {
    _id: 'fallback-1',
    title: 'SEO Basics Every Business Owner Should Know',
    slug: 'seo-basics-every-business-owner-should-know',
    publishedAt: '2025-02-10T12:00:00Z',
    category: 'SEO',
    author: 'Kamil',
    excerpt: 'Understanding basic SEO helps you rank higher in Google and get found by customers actively searching for what you offer.',
    imageUrl: 'images/JCCcDDTMhZn6T2xZAW5O8nRLM.jpg',
    url: 'blog/seo-basics-every-business-owner-should-know.html'
  },
  {
    _id: 'fallback-2',
    title: 'Why Every Business Needs a Website',
    slug: 'why-every-business-needs-a-website',
    publishedAt: '2025-07-08T12:00:00Z',
    category: 'Business Growth',
    author: 'Kamil',
    excerpt: 'Why a professional website brings more customers and helps you beat competitors online.',
    imageUrl: 'images/lJz1YNuOJsmllMOCqSPKGDQOtA.jpg',
    url: 'blog/why-every-business-needs-a-website.html'
  },
  {
    _id: 'fallback-3',
    title: 'Custom Website vs WordPress Template',
    slug: 'custom-website-vs-wordpress-template',
    publishedAt: '2025-09-06T12:00:00Z',
    category: 'Web Design',
    author: 'Kamil',
    excerpt: 'Templates cost less upfront but more long-term. Custom sites bring better ROI through speed and SEO.',
    imageUrl: 'images/UX8TVZdzOAePEbH2W2z2Znd3tA.jpg',
    url: 'blog/custom-website-vs-wordpress-template.html'
  }
];

class SanityClient {
  constructor(config = SANITY_CONFIG) {
    this.config = config;
  }

  isConfigured() {
    return this.config.projectId && this.config.projectId !== 'YOUR_PROJECT_ID';
  }

  getEndpoint(query) {
    const encoded = encodeURIComponent(query);
    const cdnHost = this.config.useCdn ? 'apicdn.sanity.io' : 'api.sanity.io';
    return `https://${this.config.projectId}.${cdnHost}/v${this.config.apiVersion}/data/query/${this.config.dataset}?query=${encoded}`;
  }

  async fetch(query, timeoutMs = 5000) {
    if (!this.isConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return null;
    }

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

    try {
      const response = await fetch(this.getEndpoint(query), {
        signal: controller ? controller.signal : undefined
      });
      if (!response.ok) {
        console.warn('Sanity API response not OK:', response.status, response.statusText);
        return null;
      }
      const data = await response.json();
      return data.result;
    } catch (err) {
      console.warn('Sanity fetch error or timeout (using local fallback):', err.message || err);
      return null;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  /**
   * Fetch recent posts for homepage (max 3)
   */
  async getRecentPosts(limit = 3) {
    const query = `*[_type == "post"] | order(publishedAt desc)[0...${limit}] {
      _id,
      title,
      "slug": slug.current,
      publishedAt,
      category,
      author,
      excerpt,
      "imageUrl": mainImage.asset->url
    }`;
    const result = await this.fetch(query);
    if (result && result.length > 0) {
      return result.map(p => ({
        ...p,
        url: `post.html?slug=${encodeURIComponent(p.slug || '')}`
      }));
    }
    return FALLBACK_POSTS.slice(0, limit);
  }

  /**
   * Fetch all posts for blog.html listing with optional category filtering
   */
  async getAllPosts(category = 'all') {
    let filter = '_type == "post"';
    if (category && category !== 'all') {
      const sanitizedCat = category.replace(/[^a-zA-Z0-9 _-]/g, '');
      filter += ` && category == "${sanitizedCat}"`;
    }
    const query = `*[${filter}] | order(publishedAt desc) {
      _id,
      title,
      "slug": slug.current,
      publishedAt,
      category,
      author,
      excerpt,
      "imageUrl": mainImage.asset->url
    }`;
    const result = await this.fetch(query);
    if (result && result.length > 0) {
      return result.map(p => ({
        ...p,
        url: `post.html?slug=${encodeURIComponent(p.slug || '')}`
      }));
    }
    if (category === 'all') {
      return FALLBACK_POSTS;
    }
    return FALLBACK_POSTS.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  /**
   * Fetch single post by slug for reader page
   */
  async getPostBySlug(slug) {
    const cleanSlug = (slug || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const query = `*[_type == "post" && slug.current == "${cleanSlug}"][0] {
      _id,
      title,
      "slug": slug.current,
      publishedAt,
      category,
      author,
      excerpt,
      "imageUrl": mainImage.asset->url,
      body,
      content
    }`;
    const result = await this.fetch(query);
    if (result) return result;
    return FALLBACK_POSTS.find(p => p.slug === cleanSlug) || null;
  }
}

// Global instance
window.sanityClient = new SanityClient();

// Security: Robust HTML entity escaping for XSS prevention
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Helper to format date with internationalized Intl API
function formatSanityDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(d);
  } catch (e) {
    return '';
  }
}

// Helper to render an article card with security sanitization and local image fallback
function renderArticleCard(post) {
  const dateFormatted = formatSanityDate(post.publishedAt);
  const targetUrl = escapeHTML(post.url || `post.html?slug=${encodeURIComponent(post.slug || '')}`);
  const category = escapeHTML(post.category || 'General');
  const author = escapeHTML(post.author || 'Kamil');
  const title = escapeHTML(post.title || 'Untitled Post');
  const excerpt = escapeHTML(post.excerpt || '');
  const imageUrl = escapeHTML(post.imageUrl || 'images/UX8TVZdzOAePEbH2W2z2Znd3tA.jpg');

  return `
    <a href="${targetUrl}" class="article-card group p-6 rounded-2xl bg-white border border-neutral-200 card-shadcn card-shadcn-hover flex flex-col justify-between cursor-pointer block text-inherit no-underline" data-category="${category}">
      <div>
        <div class="w-full h-48 rounded-xl overflow-hidden mb-5 bg-neutral-100 border border-neutral-100">
          <img 
            src="${imageUrl}" 
            alt="${title}" 
            width="800"
            height="450"
            class="w-full h-full object-cover grayscale contrast-125 transition-all duration-300" 
            loading="lazy"
          >
        </div>
        <div class="flex items-center justify-between mb-3.5 text-xs text-neutral-500 font-medium">
          <div class="badge-section">
            <span class="badge-section-solid text-emerald-800 font-semibold">${category}</span>
          </div>
          <span>${dateFormatted}</span>
        </div>
        <h3 class="text-xl font-medium text-neutral-950 group-hover:text-emerald-brand transition-colors mb-2.5 leading-snug">
          ${title}
        </h3>
        <p class="text-sm text-neutral-600 leading-relaxed font-normal line-clamp-3">
          ${excerpt}
        </p>
      </div>
      <div class="pt-5 mt-5 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
        <span>by ${author}</span>
        <span class="font-medium text-neutral-900 group-hover:text-emerald-brand transition-colors">Read Article &rarr;</span>
      </div>
    </a>
  `;
}

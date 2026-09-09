/**
 * Finalitie · Sanity CMS Client Integration
 * -------------------------------------------------------------
 * Easy, zero-dependency Sanity integration using native fetch and GROQ.
 * Enter your projectId below to connect your live Sanity Studio.
 */

const SANITY_CONFIG = {
  projectId: 'ljymyve8', // Twoje Project ID z Sanity
  dataset: 'production',
  apiVersion: '2023-05-03',
  useCdn: true,
};

// Fallback articles displayed when projectId is not yet configured or offline
const FALLBACK_POSTS = [
  {
    _id: 'fallback-1',
    title: 'SEO Basics Every Business Owner Should Know',
    slug: 'seo-basics-every-business-owner-should-know',
    publishedAt: '2025-02-10T12:00:00Z',
    category: 'SEO',
    author: 'Kamil',
    excerpt: 'Understanding basic SEO helps you rank higher in Google and get found by customers actively searching for what you offer.',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
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
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
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
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
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

  async fetch(query) {
    if (!this.isConfigured()) {
      return null;
    }
    try {
      const response = await fetch(this.getEndpoint(query));
      if (!response.ok) {
        console.warn('Sanity API response not OK:', response.status, response.statusText);
        return null;
      }
      const data = await response.json();
      return data.result;
    } catch (err) {
      console.warn('Sanity fetch error (using fallback):', err);
      return null;
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
        url: `post.html?slug=${p.slug}`
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
      filter += ` && category == "${category}"`;
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
        url: `post.html?slug=${p.slug}`
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
    const query = `*[_type == "post" && slug.current == "${slug}"][0] {
      _id,
      title,
      "slug": slug.current,
      publishedAt,
      category,
      author,
      excerpt,
      "imageUrl": mainImage.asset->url,
      body
    }`;
    const result = await this.fetch(query);
    if (result) return result;
    return FALLBACK_POSTS.find(p => p.slug === slug) || null;
  }
}

// Global instance
window.sanityClient = new SanityClient();

// Helper to format date
function formatSanityDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// Helper to render an article card in HTML
function renderArticleCard(post) {
  const dateFormatted = formatSanityDate(post.publishedAt);
  const targetUrl = post.url || `post.html?slug=${post.slug}`;
  const category = post.category || 'General';
  const author = post.author || 'Kamil';

  return `
    <a href="${targetUrl}" class="article-card group p-6 rounded-2xl bg-white border border-neutral-200 card-shadcn card-shadcn-hover flex flex-col justify-between cursor-pointer block text-inherit no-underline" data-category="${category}">
      <div>
        <div class="w-full h-48 rounded-xl overflow-hidden mb-5 bg-neutral-100 border border-neutral-100">
          <img 
            src="${post.imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80'}" 
            alt="${post.title}" 
            class="w-full h-full object-cover grayscale contrast-125 group-hover:scale-105 group-hover:grayscale-0 transition-all duration-500" 
            loading="lazy"
          >
        </div>
        <div class="flex items-center justify-between mb-3.5 text-xs text-neutral-500 font-medium">
          <div class="badge-section">
            <span class="badge-section-gradient">${category}</span>
          </div>
          <span>${dateFormatted}</span>
        </div>
        <h3 class="text-xl font-medium text-neutral-950 group-hover:text-emerald-brand transition-colors mb-2.5 leading-snug">
          ${post.title}
        </h3>
        <p class="text-sm text-neutral-600 leading-relaxed font-normal line-clamp-3">
          ${post.excerpt || ''}
        </p>
      </div>
      <div class="pt-5 mt-5 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
        <span>by ${author}</span>
        <span class="font-medium text-neutral-900 group-hover:text-emerald-brand transition-colors">Read Article &rarr;</span>
      </div>
    </a>
  `;
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, 'content', 'blog');
const BLOG_OUT_DIR = path.join(__dirname, 'blog');
const BLOG_HTML_PATH = path.join(__dirname, 'blog.html');
const INDEX_HTML_PATH = path.join(__dirname, 'index.html');
const POST_TEMPLATE_PATH = path.join(__dirname, 'post.html');

if (!fs.existsSync(BLOG_OUT_DIR)) {
  fs.mkdirSync(BLOG_OUT_DIR, { recursive: true });
}

function parseFrontmatter(fileContent) {
  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: fileContent };
  }
  const rawYaml = match[1];
  const body = match[2];
  const frontmatter = {};

  rawYaml.split(/\r?\n/).forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      frontmatter[key] = val;
    }
  });

  return { frontmatter, body };
}

function markdownToHtml(md) {
  let html = md;

  // Escape basic html tags if needed or preserve
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-medium text-neutral-950 mt-6 mb-3 tracking-tight">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-medium text-neutral-950 mt-8 mb-4 tracking-tight">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-medium text-neutral-950 mt-10 mb-5 tracking-tight">$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-2 border-emerald-brand pl-4 py-1 my-4 italic text-neutral-700 bg-surface-50 rounded-r-lg">$1</blockquote>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-emerald-brand hover:underline font-medium" target="_blank" rel="noopener noreferrer">$1</a>');

  // Unordered Lists
  const lines = html.split(/\r?\n/);
  const processedLines = [];
  let inList = false;

  for (let line of lines) {
    const listMatch = line.match(/^(\s*)[-*]\s+(.*)$/);
    if (listMatch) {
      if (!inList) {
        processedLines.push('<ul class="list-disc pl-5 space-y-2 mb-6 text-neutral-700 leading-relaxed">');
        inList = true;
      }
      processedLines.push(`  <li>${listMatch[2]}</li>`);
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push(line);
    }
  }
  if (inList) {
    processedLines.push('</ul>');
  }

  // Paragraphs
  const paragraphs = [];
  let currentP = [];

  for (let line of processedLines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentP.length > 0) {
        paragraphs.push(wrapInParagraph(currentP.join(' ')));
        currentP = [];
      }
    } else if (trimmed.startsWith('<h1') || trimmed.startsWith('<h2') || trimmed.startsWith('<h3') || trimmed.startsWith('<ul') || trimmed.startsWith('</ul>') || trimmed.startsWith('<li') || trimmed.startsWith('<blockquote') || trimmed.startsWith('<div') || trimmed.startsWith('</div')) {
      if (currentP.length > 0) {
        paragraphs.push(wrapInParagraph(currentP.join(' ')));
        currentP = [];
      }
      paragraphs.push(line);
    } else {
      currentP.push(trimmed);
    }
  }
  if (currentP.length > 0) {
    paragraphs.push(wrapInParagraph(currentP.join(' ')));
  }

  return paragraphs.join('\n\n');
}

function wrapInParagraph(text) {
  if (text.startsWith('<p') || text.startsWith('<h') || text.startsWith('<ul') || text.startsWith('<li') || text.startsWith('<blockquote')) {
    return text;
  }
  return `<p class="mb-5 text-neutral-700 leading-relaxed font-normal text-base">${text}</p>`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function build() {
  console.log('⚡ Rozpoczynam budowanie bloga Finalitie...');

  if (!fs.existsSync(CONTENT_DIR)) {
    console.warn('Brak folderu content/blog');
    return;
  }

  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  const posts = [];

  for (const file of files) {
    const fullPath = path.join(CONTENT_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(content);
    const slug = frontmatter.slug || path.basename(file, '.md');
    
    posts.push({
      ...frontmatter,
      slug,
      filename: file,
      rawBody: body,
      formattedDate: formatDate(frontmatter.pubDate)
    });
  }

  // Sortuj od najnowszego
  posts.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));
  console.log(`Znaleziono ${posts.length} artykułów.`);

  // 1. Wygeneruj podstronę każdego artykułu w blog/<slug>.html
  let postTemplate = '';
  if (fs.existsSync(POST_TEMPLATE_PATH)) {
    postTemplate = fs.readFileSync(POST_TEMPLATE_PATH, 'utf8');
  }

  for (const post of posts) {
    const postHtmlBody = markdownToHtml(post.rawBody);
    const postImg = post.image ? (post.image.startsWith('/') ? `..${post.image}` : `../${post.image}`) : '../images/UX8TVZdzOAePEbH2W2z2Znd3tA.jpg';
    const postOgImg = post.image ? (post.image.startsWith('/') ? `https://andkz.github.io/finalitie-v2${post.image}` : `https://andkz.github.io/finalitie-v2/${post.image}`) : 'https://andkz.github.io/finalitie-v2/images/GmYx3GkXDe3lTME4KumGFhegPoA.png';

    const renderedPostHtml = `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title} · Finalitie</title>
  <meta name="description" content="${post.description || ''}">
  <link rel="icon" href="../images/tGUOcqDgP6XO7Dpi82pGrgbkQg.png">
  <link rel="canonical" href="https://andkz.github.io/finalitie-v2/blog/${post.slug}.html">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${post.title} · Finalitie">
  <meta property="og:description" content="${post.description || ''}">
  <meta property="og:image" content="${postOgImg}">
  <meta property="og:url" content="https://andkz.github.io/finalitie-v2/blog/${post.slug}.html">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${post.title} · Finalitie">
  <meta name="twitter:description" content="${post.description || ''}">
  <meta name="twitter:image" content="${postOgImg}">

  <!-- Unified Geist Font System -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://cdn.tailwindcss.com">
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
            heading: ['Geist', 'sans-serif'],
            mono: ['"Geist Mono"', 'Geist', 'monospace']
          },
          colors: {
            emerald: {
              brand: '#2bb583',
              dark: '#00472d',
              light: '#eaf7f2'
            },
            surface: {
              50: '#fafafa',
              100: '#f8f8f9',
              150: '#f1f1f3',
              200: '#e4e4e7',
              900: '#09090b',
              950: '#030303'
            }
          }
        }
      }
    }
  </script>

  <style>
    :root {
      --font-geist: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    * { font-family: var(--font-geist); }
    body { background-color: #ffffff; color: #09090b; letter-spacing: -0.01em; }
    h1 { font-family: var(--font-geist); font-weight: 500; letter-spacing: -0.03em; line-height: 1.15; }
    h2 { font-family: var(--font-geist); font-weight: 500; letter-spacing: -0.03em; line-height: 1.25; }
    h3 { font-family: var(--font-geist); font-weight: 500; letter-spacing: -0.02em; }
    
    .btn-shadcn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      letter-spacing: -0.01em;
      transition: all 0.15s ease-in-out;
      outline: none;
      text-decoration: none;
      gap: 0.5rem;
    }
    .btn-shadcn:active { transform: scale(0.98); }
    .btn-primary { background-color: #09090b; color: #fafafa; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
    .btn-primary:hover { background-color: #27272a; }

    .badge-section {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 4px 14px;
      border-radius: 9999px;
      font-size: 12px;
      line-height: 1.4;
      letter-spacing: -0.01em;
      background: linear-gradient(180deg, #ffffff 0%, #f4f4f6 100%);
      border: 1px solid #e2e2e6;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.95);
      user-select: none;
    }
    .badge-section-solid,
    .badge-section-gradient {
      color: #27272a;
      background: linear-gradient(135deg, #18181b 0%, #4b5563 35%, #94a3b8 65%, #18181b 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 600;
      letter-spacing: -0.01em;
      display: inline-block;
    }
  </style>
</head>
<body class="min-h-screen flex flex-col justify-between selection:bg-emerald-brand selection:text-white antialiased">

  <!-- ==================== HEADER / NAVBAR ==================== -->
  <header class="w-full border-b border-neutral-200/70 bg-white/90 backdrop-blur-md sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
      <a href="../index.html" class="flex items-center gap-2 group">
        <img src="../finalitie-logo.svg" alt="Finalitie" width="8" height="18" class="h-[18px] w-auto">
        <span class="font-bold text-sm tracking-[0.11em] text-neutral-950 uppercase">FINALITIE</span>
      </a>

      <nav class="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-600">
        <a href="../index.html#projects" class="hover:text-neutral-950 transition-colors">Projects</a>
        <a href="../index.html#services" class="hover:text-neutral-950 transition-colors">Services</a>
        <a href="../index.html#pricing" class="hover:text-neutral-950 transition-colors">Pricing</a>
        <a href="../blog.html" class="text-neutral-950 font-semibold">Blog</a>
        <a href="../index.html#contact" class="hover:text-neutral-950 transition-colors">Contact</a>
      </nav>

      <div class="flex items-center gap-3">
        <a href="../index.html#contact" class="btn-shadcn btn-primary px-3.5 py-1.5 text-xs hidden sm:inline-flex">
          Free Consultation
        </a>
      </div>
    </div>
  </header>

  <!-- ==================== ARTICLE CONTENT ==================== -->
  <main class="max-w-3xl mx-auto px-6 sm:px-8 py-16 w-full flex-1" id="main-content">
    
    <!-- Breadcrumb & Badges -->
    <div class="mb-8">
      <a href="../blog.html" class="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-950 transition-colors mb-6 group">
        <span class="group-hover:-translate-x-0.5 transition-transform">&larr;</span> Back to all articles
      </a>
      <div class="flex items-center gap-3">
        <div class="badge-section">
          <span class="badge-section-gradient">${post.category || 'Article'}</span>
        </div>
        <span class="text-xs text-neutral-500">${post.formattedDate}</span>
        <span class="text-neutral-300">&bull;</span>
        <span class="text-xs text-neutral-500 font-medium">by ${post.author || 'Kamil'}</span>
      </div>
    </div>

    <!-- Main Title -->
    <h1 class="text-3xl sm:text-4xl lg:text-[44px] font-medium text-neutral-950 mb-6 tracking-tight leading-[1.15]">
      ${post.title}
    </h1>

    <!-- Excerpt / Subtitle -->
    ${post.description ? `
    <p class="text-lg sm:text-xl text-neutral-600 font-normal leading-relaxed mb-8 pb-6 border-b border-neutral-200/80">
      ${post.description}
    </p>` : ''}

    <!-- Main Image -->
    <div class="w-full h-64 sm:h-96 rounded-2xl overflow-hidden mb-12 bg-neutral-100 border border-neutral-100 shadow-sm">
      <img src="${postImg}" alt="${post.title}" width="1000" height="667" class="w-full h-full object-cover grayscale contrast-125" loading="lazy">
    </div>

    <!-- Body -->
    <div class="space-y-6 text-neutral-700 leading-relaxed font-normal text-base article-body">
      ${postHtmlBody}
    </div>

    <!-- Author Card -->
    <div class="mt-16 p-8 rounded-2xl bg-surface-50 border border-neutral-200/80 flex flex-col sm:flex-row items-center justify-between gap-6">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-neutral-950 flex items-center justify-center text-white font-bold text-sm">
          FL
        </div>
        <div>
          <p class="text-base font-semibold text-neutral-950">Written by ${post.author || 'Kamil'}</p>
          <p class="text-xs text-neutral-500 mt-0.5">Founder & Web Designer at Finalitie</p>
        </div>
      </div>
      <a href="../index.html#contact" class="btn-shadcn btn-primary px-4 py-2 text-xs whitespace-nowrap">
        Work With Me &rarr;
      </a>
    </div>

  </main>

  <!-- ==================== FOOTER ==================== -->
  <footer class="w-full border-t border-neutral-200/70 bg-white py-12">
    <div class="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
      <p>&copy; ${new Date().getFullYear()} Finalitie. All rights reserved.</p>
      <div class="flex items-center gap-6">
        <a href="../blog.html" class="hover:text-neutral-950 transition-colors">Blog</a>
        <a href="../privacy-policy.html" class="hover:text-neutral-950 transition-colors">Privacy Policy</a>
        <a href="../index.html#contact" class="hover:text-neutral-950 transition-colors">Contact</a>
      </div>
    </div>
  </footer>

</body>
</html>`;

    const outPath = path.join(BLOG_OUT_DIR, `${post.slug}.html`);
    fs.writeFileSync(outPath, renderedPostHtml, 'utf8');
  }

  // 2. Wygeneruj kafelki dla blog.html
  const blogCardsHtml = posts.map(post => {
    const cardImg = post.image ? (post.image.startsWith('/') ? post.image.slice(1) : post.image) : 'images/UX8TVZdzOAePEbH2W2z2Znd3tA.jpg';
    return `      <!-- Article: ${post.title} -->
      <a href="blog/${post.slug}.html" class="article-card group p-6 rounded-2xl bg-white border border-neutral-200 card-shadcn card-shadcn-hover flex flex-col justify-between cursor-pointer block text-inherit no-underline" data-category="${post.category || 'All'}">
        <div>
          <div class="w-full h-48 rounded-xl overflow-hidden mb-5 bg-neutral-100 border border-neutral-100">
            <img 
              src="${cardImg}" 
              alt="${post.title}" 
              width="1000" 
              height="667" 
              decoding="async"
              class="w-full h-full object-cover grayscale contrast-125 transition-all duration-300" 
              loading="lazy"
            >
          </div>
          <div class="flex items-center justify-between mb-3.5 text-xs text-neutral-500 font-medium">
            <div class="badge-section">
              <span class="badge-section-solid font-semibold">${post.category || 'Article'}</span>
            </div>
            <span>${post.formattedDate}</span>
          </div>
          <h3 class="text-xl font-medium text-neutral-950 group-hover:text-emerald-brand transition-colors mb-2.5 leading-snug">
            ${post.title}
          </h3>
          <p class="text-sm text-neutral-600 leading-relaxed font-normal">
            ${post.description || ''}
          </p>
        </div>
        <div class="pt-5 mt-5 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
          <span>by ${post.author || 'Kamil'}</span>
          <span class="font-medium text-neutral-900 group-hover:text-emerald-brand transition-colors">Read Article &rarr;</span>
        </div>
      </a>`;
  }).join('\n\n');

  if (fs.existsSync(BLOG_HTML_PATH)) {
    let blogHtml = fs.readFileSync(BLOG_HTML_PATH, 'utf8');
    const containerRegex = /(<div[^>]*id="articles-container"[^>]*>)([\s\S]*?)(<\/div>\s*<\/section>)/;
    if (containerRegex.test(blogHtml)) {
      blogHtml = blogHtml.replace(containerRegex, `$1\n${blogCardsHtml}\n    $3`);
      fs.writeFileSync(BLOG_HTML_PATH, blogHtml, 'utf8');
      console.log('✅ Zaktualizowano blog.html');
    }
  }

  // 3. Zaktualizuj sekcję bloga na stronie głównej index.html (najnowsze 3 posty)
  const homeCardsHtml = posts.slice(0, 3).map(post => {
    const cardImg = post.image ? (post.image.startsWith('/') ? post.image.slice(1) : post.image) : 'images/UX8TVZdzOAePEbH2W2z2Znd3tA.jpg';
    return `      <!-- Article: ${post.title} -->
      <a href="blog/${post.slug}.html" class="group p-6 rounded-2xl bg-white border border-neutral-200 card-shadcn card-shadcn-hover flex flex-col justify-between cursor-pointer block text-inherit no-underline">
        <div>
          <div class="w-full h-48 rounded-xl overflow-hidden mb-5 bg-neutral-100 border border-neutral-100">
            <img 
              src="${cardImg}" 
              alt="${post.title}" 
              width="1000" 
              height="667" 
              decoding="async"
              class="w-full h-full object-cover grayscale contrast-125 transition-all duration-300" 
              loading="lazy"
            >
          </div>
          <div class="flex items-center justify-between mb-3.5 text-xs text-neutral-500 font-medium">
            <div class="badge-section">
              <span class="badge-section-solid font-semibold">${post.category || 'Article'}</span>
            </div>
            <span>${post.formattedDate}</span>
          </div>
          <h3 class="text-xl font-medium text-neutral-950 group-hover:text-emerald-brand transition-colors mb-2.5 leading-snug">
            ${post.title}
          </h3>
          <p class="text-sm text-neutral-600 leading-relaxed font-normal">
            ${post.description || ''}
          </p>
        </div>
        <div class="pt-5 mt-5 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
          <span>by ${post.author || 'Kamil'}</span>
          <span class="font-medium text-neutral-900 group-hover:text-emerald-brand transition-colors">Read Article &rarr;</span>
        </div>
      </a>`;
  }).join('\n\n');

  if (fs.existsSync(INDEX_HTML_PATH)) {
    let indexHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
    const homeGridRegex = /(<div[^>]*id="homepage-articles-container"[^>]*>)([\s\S]*?)(<\/div>\s*<\/section>)/;
    if (homeGridRegex.test(indexHtml)) {
      indexHtml = indexHtml.replace(homeGridRegex, `$1\n${homeCardsHtml}\n    $3`);
      fs.writeFileSync(INDEX_HTML_PATH, indexHtml, 'utf8');
      console.log('✅ Zaktualizowano index.html (sekcja Blog)');
    } else {
      console.warn('Nie znaleziono id="homepage-articles-container" w index.html');
    }
  }

  console.log('🎉 Budowanie bloga zakończone sukcesem!');
}

build();

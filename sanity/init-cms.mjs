import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';

// 1. Read token from ~/.config/sanity/config.json
const homeDir = process.env.USERPROFILE || process.env.HOME || 'C:/Users/kamil';
const sanityConfigFile = path.join(homeDir, '.config', 'sanity', 'config.json');
let token = null;

if (fs.existsSync(sanityConfigFile)) {
  try {
    const configData = JSON.parse(fs.readFileSync(sanityConfigFile, 'utf-8'));
    token = configData.authToken;
    console.log('Loaded Sanity auth token from local config.');
  } catch (err) {
    console.warn('Could not read Sanity config:', err.message);
  }
}

const projectId = 'gkzj0x76';
const dataset = 'production';

if (!token) {
  console.error('ERROR: No Sanity auth token found!');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
});

async function main() {
  console.log(`Checking Sanity project "${projectId}"...`);

  // Ensure dataset exists
  try {
    const datasets = await client.datasets.list();
    const prodExists = datasets.some(d => d.name === dataset);
    if (!prodExists) {
      console.log(`Creating dataset "${dataset}"...`);
      await client.datasets.create(dataset, { aclMode: 'public' });
      console.log(`Dataset "${dataset}" created.`);
    } else {
      console.log(`Dataset "${dataset}" already exists.`);
    }
  } catch (err) {
    console.warn('Dataset check warning:', err.message);
  }

  // Set up CORS
  const corsOrigins = [
    'http://localhost:3333',
    'http://localhost:4321',
    'https://arik-astro-portfolio.netlify.app'
  ];

  for (const origin of corsOrigins) {
    try {
      const res = await fetch(`https://api.sanity.io/v2021-06-07/projects/${projectId}/cors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ origin, allowCredentials: true })
      });
      if (res.ok) {
        console.log(`CORS origin added: ${origin}`);
      } else {
        const text = await res.text();
        console.log(`CORS status for ${origin}:`, text);
      }
    } catch (err) {
      console.warn(`Failed to add CORS for ${origin}:`, err.message);
    }
  }

  // Set up Webhook for Netlify build
  try {
    const hookUrl = 'https://api.netlify.com/build_hooks/6aba26e4c41bcabfcb6e25ad';
    const hookRes = await fetch(`https://api.sanity.io/v2021-06-07/hooks/projects/${projectId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Netlify Deploy on Content Update',
        url: hookUrl,
        dataset: 'production'
      })
    });
    if (hookRes.ok) {
      console.log('Netlify build webhook registered successfully in Sanity!');
    } else {
      const txt = await hookRes.text();
      console.log('Webhook status:', txt);
    }
  } catch (err) {
    console.warn('Webhook error:', err.message);
  }

  // Upload local images to Sanity
  console.log('Uploading media assets to Sanity...');
  const publicImagesDir = path.resolve('public', 'images');
  const imageAssets = {};

  const imagesToUpload = [
    'work-space.jpg',
    'work-nova.jpg',
    'work-sonic.jpg',
    'work-solar.jpg',
    'blog-1.webp',
    'blog-2.webp',
    'blog-3.webp',
    'blog-4.webp',
    'blog-5.webp',
    'blog-6.webp',
  ];

  for (const filename of imagesToUpload) {
    const filePath = path.join(publicImagesDir, filename);
    if (fs.existsSync(filePath)) {
      try {
        const fileStream = fs.createReadStream(filePath);
        const doc = await client.assets.upload('image', fileStream, {
          filename,
        });
        imageAssets[filename] = doc._id;
        console.log(`Uploaded ${filename} -> ${doc._id}`);
      } catch (err) {
        console.warn(`Failed to upload ${filename}:`, err.message);
      }
    }
  }

  // Seed Projects
  console.log('Seeding portfolio projects...');
  const projects = [
    {
      _id: 'project-space',
      _type: 'project',
      title: 'Space',
      slug: { _type: 'slug', current: 'space' },
      category: 'Web Design',
      year: '2024',
      client: 'Space Exploration Lab',
      role: 'Lead UI/UX & Framer Developer',
      duration: '4 Weeks',
      excerpt: 'A visionary digital portal for next-generation aerospace research and interstellar satellite technology.',
      overview: 'Space needed an immersive, modern digital presence to communicate their mission to researchers, investors, and space enthusiasts worldwide. The project focused on high-performance interactive 3D visualizations, modular content blocks, and clean typographic hierarchy.',
      challenge: 'Presenting highly complex astronomical telemetry and research whitepapers in an accessible, visually breathtaking format without sacrificing mobile load speed.',
      solution: 'We engineered a dark-mode first design system utilizing subtle ambient particle glow, fluid micro-interactions, and modular CMS architecture with instant load times.',
      result: '180% increase in inbound partnership inquiries and recognition in web design showcases for high aesthetic polish.',
      mainImage: imageAssets['work-space.jpg'] ? {
        _type: 'image',
        asset: { _type: 'reference', _ref: imageAssets['work-space.jpg'] }
      } : undefined,
      gallery: [
        imageAssets['work-space.jpg'] ? { _type: 'image', asset: { _type: 'reference', _ref: imageAssets['work-space.jpg'] } } : null,
        imageAssets['work-nova.jpg'] ? { _type: 'image', asset: { _type: 'reference', _ref: imageAssets['work-nova.jpg'] } } : null,
      ].filter(Boolean)
    },
    {
      _id: 'project-nova',
      _type: 'project',
      title: 'Nova',
      slug: { _type: 'slug', current: 'nova' },
      category: 'Web Design',
      year: '2024',
      client: 'Nova Intelligence Inc.',
      role: 'Creative Director & Webflow Dev',
      duration: '3 Weeks',
      excerpt: 'Brand redesign and high-converting marketing site for an enterprise AI analytics platform.',
      overview: 'Nova is an AI-powered data intelligence suite. They needed a complete overhaul of their brand visual identity and a responsive website that converts enterprise tier visitors.',
      challenge: 'Differentiating Nova in a saturated AI landscape by avoiding clichéd robotic visuals in favor of refined, human-centric editorial design.',
      solution: 'Designed an editorial layout pairing custom serif typography, dynamic data charts, and interactive product demo previews.',
      result: 'Reduced bounce rate by 34% and grew enterprise demo requests by 2.4x in the first quarter post-launch.',
      mainImage: imageAssets['work-nova.jpg'] ? {
        _type: 'image',
        asset: { _type: 'reference', _ref: imageAssets['work-nova.jpg'] }
      } : undefined,
      gallery: [
        imageAssets['work-nova.jpg'] ? { _type: 'image', asset: { _type: 'reference', _ref: imageAssets['work-nova.jpg'] } } : null,
        imageAssets['work-sonic.jpg'] ? { _type: 'image', asset: { _type: 'reference', _ref: imageAssets['work-sonic.jpg'] } } : null,
      ].filter(Boolean)
    },
    {
      _id: 'project-sonic',
      _type: 'project',
      title: 'Sonic',
      slug: { _type: 'slug', current: 'sonic' },
      category: 'Web Design',
      year: '2023',
      client: 'Sonic Sound Studios',
      role: 'Full-Stack Design & CMS Build',
      duration: '2 Weeks',
      excerpt: 'Dynamic portfolio and audio licensing portal for an award-winning sound design studio.',
      overview: 'Sonic specializes in cinematic sound design and custom audio branding for Hollywood trailers and premier video game studios.',
      challenge: 'Integrating instant lossless audio streaming seamlessly with ultra-smooth page transitions.',
      solution: 'Crafted a dark, tactile interface with custom wave-form animations, integrated audio player, and rapid CMS filtering.',
      result: 'Seamless audio playback experience with over 50,000 monthly track previews from creative directors.',
      mainImage: imageAssets['work-sonic.jpg'] ? {
        _type: 'image',
        asset: { _type: 'reference', _ref: imageAssets['work-sonic.jpg'] }
      } : undefined,
      gallery: [
        imageAssets['work-sonic.jpg'] ? { _type: 'image', asset: { _type: 'reference', _ref: imageAssets['work-sonic.jpg'] } } : null,
        imageAssets['work-solar.jpg'] ? { _type: 'image', asset: { _type: 'reference', _ref: imageAssets['work-solar.jpg'] } } : null,
      ].filter(Boolean)
    },
    {
      _id: 'project-solar',
      _type: 'project',
      title: 'Solar',
      slug: { _type: 'slug', current: 'solar' },
      category: 'Web Design',
      year: '2023',
      client: 'Solar Energy Innovations',
      role: 'UI/UX & Framer Implementation',
      duration: '3 Weeks',
      excerpt: 'Sustainable green technology portal highlighting clean energy solutions for smart cities.',
      overview: 'Solar develops next-gen photovoltaic solar arrays designed to integrate organically into modern architectural facades.',
      challenge: 'Conveying scientific sustainability impact while inspiring municipal city planners with aesthetic architectural renders.',
      solution: 'Developed an interactive sustainability impact calculator alongside high-resolution interactive case study slides.',
      result: 'Awarded Sustainable Design Spotlight and featured in leading architectural technology publications.',
      mainImage: imageAssets['work-solar.jpg'] ? {
        _type: 'image',
        asset: { _type: 'reference', _ref: imageAssets['work-solar.jpg'] }
      } : undefined,
      gallery: [
        imageAssets['work-solar.jpg'] ? { _type: 'image', asset: { _type: 'reference', _ref: imageAssets['work-solar.jpg'] } } : null,
        imageAssets['work-space.jpg'] ? { _type: 'image', asset: { _type: 'reference', _ref: imageAssets['work-space.jpg'] } } : null,
      ].filter(Boolean)
    }
  ];

  for (const proj of projects) {
    try {
      await client.createOrReplace(proj);
      console.log(`Created/updated project: ${proj.title}`);
    } catch (err) {
      console.warn(`Failed project ${proj.title}:`, err.message);
    }
  }

  // Seed Blog Posts
  console.log('Seeding blog posts...');
  const posts = [
    {
      _id: 'post-how-to-build-a-stunning-website-with-framer',
      _type: 'post',
      title: 'How to Build a Stunning Website with Framer',
      slug: { _type: 'slug', current: 'how-to-build-a-stunning-website-with-framer' },
      publishedAt: '2024-07-29',
      category: 'Branding',
      readTime: '6 min read',
      excerpt: 'Discover the principles and advanced techniques for creating high-converting, visually breathtaking websites in record time.',
      mainImage: imageAssets['blog-1.webp'] ? {
        _type: 'image',
        asset: { _type: 'reference', _ref: imageAssets['blog-1.webp'] }
      } : undefined,
      content: `<h2>The Shift to No-Code Precision</h2>
<p>Modern web design has entered a new era. The days of endless back-and-forth between static Figma files and front-end development handoffs are rapidly being replaced by direct canvas-to-production workflows.</p>

<p>With modern visual tools like Framer, designers gain direct control over responsive breakpoints, production-level layout physics, and fine-tuned micro-interactions without writing hundreds of lines of boilerplate code.</p>

<h2>1. Establish a Strong Typographic Hierarchy</h2>
<p>Typography is 90% of web design. By combining a clean, grotesque sans-serif for functional UI and contrasting it with an expressive serif italic for editorial emphasis, you instantly give your site a bespoke, high-fashion identity.</p>

<h2>2. Master Negative Space and Pacing</h2>
<p>Give your elements room to breathe. Cluttered layouts fatigue users. Generous margins and deliberate whitespace guide the reader's eye naturally toward primary calls to action.</p>

<h2>3. Purposeful Micro-Interactions</h2>
<p>Animations should never be gratuitous. Use subtle hover lifts, smooth spring transitions, and gentle fade-ins on scroll to give the interface tactile responsiveness.</p>`
    },
    {
      _id: 'post-10-website-elements-for-maximum-user-engagement',
      _type: 'post',
      title: '10 website elements for maximum user engagement',
      slug: { _type: 'slug', current: '10-website-elements-for-maximum-user-engagement' },
      publishedAt: '2024-07-25',
      category: 'Web Design',
      readTime: '5 min read',
      excerpt: 'From intuitive navigation to micro-interactions, learn the key UI/UX elements that keep visitors immersed and excited.',
      mainImage: imageAssets['blog-2.webp'] ? {
        _type: 'image',
        asset: { _type: 'reference', _ref: imageAssets['blog-2.webp'] }
      } : undefined,
      content: `<h2>Designing for High Retention</h2>
<p>Engaging a user within the first three seconds is paramount. Here are the core structural elements that dramatically increase time-on-site and visitor conversion.</p>

<h2>1. Floating Pill Navigation</h2>
<p>Compact, blur-backed navigation bars stay accessible without obstructing valuable viewport screen real estate.</p>

<h2>2. Interactive Process Timelines</h2>
<p>Instead of walls of text, displaying your methodology in numbered vertical milestones gives prospects clear expectations and builds immediate trust.</p>

<h2>3. Authentic Client Testimonials with Real Faces</h2>
<p>Social proof backed by genuine customer photos, company logos, and specific metrics bridges the credibility gap.</p>`
    },
    {
      _id: 'post-the-importance-of-content-in-driving-website-traffic',
      _type: 'post',
      title: 'The importance of content in driving website traffic',
      slug: { _type: 'slug', current: 'the-importance-of-content-in-driving-website-traffic' },
      publishedAt: '2024-07-13',
      category: 'Branding',
      readTime: '7 min read',
      excerpt: 'Quality content is king. Learn how to create valuable, SEO-optimized copy that resonates with your ideal audience.',
      mainImage: imageAssets['blog-3.webp'] ? {
        _type: 'image',
        asset: { _type: 'reference', _ref: imageAssets['blog-3.webp'] }
      } : undefined,
      content: `<h2>Copywriting as Design Architecture</h2>
<p>No matter how breathtaking your animations or color palettes are, users ultimately visit your website for answers. Copywriting is the intellectual backbone of web design.</p>

<p>To rank consistently on search engines while captivating discerning human readers, your articles must provide actionable, deeply researched insights rather than generic filler copy.</p>`
    },
    {
      _id: 'post-10-common-web-development-mistakes-to-avoid',
      _type: 'post',
      title: '10 common web development mistakes to avoid',
      slug: { _type: 'slug', current: '10-common-web-development-mistakes-to-avoid' },
      publishedAt: '2024-07-01',
      category: 'Web Design',
      readTime: '4 min read',
      excerpt: 'Avoid these critical traps in responsive design, asset loading, and typography to deliver a truly flawless user experience.',
      mainImage: imageAssets['blog-4.webp'] ? {
        _type: 'image',
        asset: { _type: 'reference', _ref: imageAssets['blog-4.webp'] }
      } : undefined,
      content: `<h2>The Performance Traps</h2>
<p>Slow page loads, cumulative layout shifts, and missing asset fallbacks can decimate user retention before your first frame even renders.</p>

<p>Always bundle fonts locally, serve modern WebP/AVIF formats with exact aspect ratios, and ensure every dynamic 3D or canvas element features an instant static placeholder.</p>`
    },
    {
      _id: 'post-why-responsive-web-design-is-critical-for-your-business',
      _type: 'post',
      title: 'Why responsive web design is critical for your business',
      slug: { _type: 'slug', current: 'why-responsive-web-design-is-critical-for-your-business' },
      publishedAt: '2024-06-11',
      category: 'Branding',
      readTime: '5 min read',
      excerpt: 'Over 60% of all web traffic comes from mobile devices. Here is how adaptive design boosts conversions and user trust.',
      mainImage: imageAssets['blog-5.webp'] ? {
        _type: 'image',
        asset: { _type: 'reference', _ref: imageAssets['blog-5.webp'] }
      } : undefined,
      content: `<h2>Mobile-First is No Longer Optional</h2>
<p>A desktop site squeezed onto a phone screen is an instant conversion killer. True responsive design means re-architecting navigation into thumb-friendly touch targets, restructuring complex grids, and optimizing asset weights.</p>`
    },
    {
      _id: 'post-how-to-write-content-that-ranks-on-google',
      _type: 'post',
      title: 'How to write content that ranks on Google',
      slug: { _type: 'slug', current: 'how-to-write-content-that-ranks-on-google' },
      publishedAt: '2024-06-20',
      category: 'Content & SEO',
      readTime: '8 min read',
      excerpt: 'A comprehensive guide to semantic keyword research, content architecture, and organic search optimization.',
      mainImage: imageAssets['blog-6.webp'] ? {
        _type: 'image',
        asset: { _type: 'reference', _ref: imageAssets['blog-6.webp'] }
      } : undefined,
      content: `<h2>Semantic SEO Mastery</h2>
<p>Modern search engines prioritize topical authority and user intent over legacy keyword stuffing. Discover how clean HTML markup, semantic heading structures, and schema.org data propel your articles to page one.</p>`
    }
  ];

  for (const post of posts) {
    try {
      await client.createOrReplace(post);
      console.log(`Created/updated post: ${post.title}`);
    } catch (err) {
      console.warn(`Failed post ${post.title}:`, err.message);
    }
  }

  console.log('Sanity CMS setup completed successfully!');
}

main().catch(err => {
  console.error('Fatal error in init-cms:', err);
  process.exit(1);
});

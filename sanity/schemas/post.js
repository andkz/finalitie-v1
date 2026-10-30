export default {
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Article Title',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: Rule => Rule.required(),
    },
    {
      name: 'publishedAt',
      title: 'Published Date',
      type: 'date',
      options: {
        dateFormat: 'YYYY-MM-DD',
      },
      initialValue: () => new Date().toISOString().split('T')[0],
      validation: Rule => Rule.required(),
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Branding', value: 'Branding'},
          {title: 'Web Design', value: 'Web Design'},
          {title: 'Content & SEO', value: 'Content & SEO'},
          {title: 'Development', value: 'Development'},
        ],
      },
      initialValue: 'Web Design',
    },
    {
      name: 'mainImage',
      title: 'Cover Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: Rule => Rule.required(),
    },
    {
      name: 'excerpt',
      title: 'Short Excerpt / Summary',
      type: 'text',
      rows: 3,
      validation: Rule => Rule.max(200),
    },
    {
      name: 'readTime',
      title: 'Read Time (e.g. 5 min read)',
      type: 'string',
      initialValue: '5 min read',
    },
    {
      name: 'content',
      title: 'Article Body (HTML / Markdown / Text)',
      type: 'text',
      rows: 12,
    },
  ],
}

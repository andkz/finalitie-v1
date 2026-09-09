/**
 * Sanity Schema Definition for Finalitie Blog Post
 * ------------------------------------------------
 * Możesz wkleić ten plik do swojego Sanity Studio w folderze:
 * schemaTypes/post.js (lub schemaTypes/post.ts)
 */

export default {
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'SEO', value: 'SEO' },
          { title: 'Web Design', value: 'Web Design' },
          { title: 'Business Growth', value: 'Business Growth' },
        ],
      },
      initialValue: 'SEO',
    },
    {
      name: 'author',
      title: 'Author',
      type: 'string',
      initialValue: 'Kamil',
    },
    {
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'excerpt',
      title: 'Excerpt (Short Description)',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.max(200),
    },
    {
      name: 'body',
      title: 'Body Content',
      type: 'array',
      of: [
        {
          type: 'block',
        },
        {
          type: 'image',
        },
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author',
      media: 'mainImage',
    },
  },
}

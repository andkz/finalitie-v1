export default {
  name: 'project',
  title: 'Selected Work',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Project Title',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug (URL path)',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: Rule => Rule.required(),
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      initialValue: 'Web Design',
    },
    {
      name: 'year',
      title: 'Year',
      type: 'string',
      initialValue: '2024',
    },
    {
      name: 'client',
      title: 'Client Name',
      type: 'string',
    },
    {
      name: 'role',
      title: 'Your Role',
      type: 'string',
      initialValue: 'Lead UI/UX & Development',
    },
    {
      name: 'duration',
      title: 'Project Duration',
      type: 'string',
      initialValue: '3 Weeks',
    },
    {
      name: 'mainImage',
      title: 'Main Showcase Image',
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
    },
    {
      name: 'overview',
      title: 'Overview & Goals',
      type: 'text',
      rows: 4,
    },
    {
      name: 'challenge',
      title: 'The Challenge',
      type: 'text',
      rows: 4,
    },
    {
      name: 'solution',
      title: 'The Solution',
      type: 'text',
      rows: 4,
    },
    {
      name: 'result',
      title: 'Measurable Impact & Results',
      type: 'text',
      rows: 4,
    },
    {
      name: 'gallery',
      title: 'Additional Showcase Gallery Images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    },
  ],
}

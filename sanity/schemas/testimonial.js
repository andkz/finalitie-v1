export default {
  name: 'testimonial',
  title: 'Client Testimonial',
  type: 'document',
  fields: [
    {
      name: 'clientName',
      title: 'Client Name (e.g. MATTHEW SMITH)',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'company',
      title: 'Company (e.g. Sonic)',
      type: 'string',
    },
    {
      name: 'quoteTitle',
      title: 'Headline / Title',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'quoteBody',
      title: 'Full Testimonial Text',
      type: 'text',
      rows: 4,
      validation: Rule => Rule.required(),
    },
    {
      name: 'avatar',
      title: 'Client Photo',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
  ],
}

export default {
  name: 'processStep',
  title: 'Process Step',
  type: 'document',
  fields: [
    {
      name: 'stepNumber',
      title: 'Step Number (e.g. 01, 02)',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'category',
      title: 'Category (e.g. DO WE MATCH?)',
      type: 'string',
    },
    {
      name: 'title',
      title: 'Step Title (e.g. DISCOVERY CALL)',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'duration',
      title: 'Duration (e.g. 2 HOURS, 2 WEEKS)',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
    },
    {
      name: 'checklist',
      title: 'Checklist Bullets',
      type: 'array',
      of: [{type: 'string'}],
    },
  ],
}

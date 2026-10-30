import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'ljymyve8',
    dataset: 'production'
  },
  project: {
    basePath: '/admin'
  }
})

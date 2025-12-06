'use client'

import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'   // ✅ Correct plugin import
import { apiVersion, dataset, projectId } from './sanity/env'
import { schema } from './sanity/schemaTypes'
import { structure } from './sanity/structure'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  schema,
  plugins: [
    deskTool({
      structure,     // your custom structure
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
})

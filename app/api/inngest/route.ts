import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { generatePlanFunction, generateExportFunction } from '@/lib/inngest/functions'

// Create an API that serves Inngest functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generatePlanFunction,
    generateExportFunction
  ],
  signingKey: process.env.INNGEST_SIGNING_KEY,
})

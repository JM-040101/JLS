// Export Generation API - Creates downloadable ZIP with all blueprint files

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import JSZip from 'jszip'
import { ProcessedPlan, ModuleStructure, ClaudePrompt } from '@/lib/ai/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { sessionId, format = 'zip' } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session ID' },
        { status: 400 }
      )
    }

    // Verify session ownership
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Get the processed plan
    const { data: output } = await supabase
      .from('outputs')
      .select('*')
      .eq('session_id', sessionId)
      .eq('output_type', 'claudeops_plan')
      .single()

    if (!output) {
      return NextResponse.json(
        { error: 'No processed plan found. Please generate the plan first.' },
        { status: 404 }
      )
    }

    const plan: ProcessedPlan = output.content

    // Generate the export based on format
    if (format === 'zip') {
      const zipBuffer = await generateZipExport(plan, session)
      
      // Store the export for download
      const { data: upload, error: uploadError } = await supabase.storage
        .from('exports')
        .upload(
          `${user.id}/${sessionId}/blueprint-${Date.now()}.zip`,
          zipBuffer,
          {
            contentType: 'application/zip',
            upsert: true
          }
        )

      if (uploadError) {
        console.error('Error uploading export:', uploadError)
        return NextResponse.json(
          { error: 'Failed to create export' },
          { status: 500 }
        )
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('exports')
        .getPublicUrl(upload.path)

      // Log the export
      await supabase
        .from('outputs')
        .insert({
          session_id: sessionId,
          output_type: 'export_zip',
          content: {
            path: upload.path,
            url: urlData.publicUrl,
            size: zipBuffer.length,
            createdAt: new Date().toISOString()
          },
          metadata: {
            format: 'zip',
            modules: plan.structure.length,
            prompts: plan.prompts.length
          },
          created_at: new Date().toISOString()
        })

      return NextResponse.json({
        success: true,
        downloadUrl: urlData.publicUrl,
        size: zipBuffer.length,
        expiresIn: 3600 // 1 hour
      })

    } else if (format === 'json') {
      // Return raw JSON for API consumers
      return NextResponse.json({
        session,
        plan,
        exportedAt: new Date().toISOString()
      })
    }

    return NextResponse.json(
      { error: 'Invalid export format' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Error generating export:', error)
    
    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    )
  }
}

async function generateZipExport(
  plan: ProcessedPlan,
  session: any
): Promise<Buffer> {
  const zip = new JSZip()

  // Add README.md
  zip.file('README.md', plan.readme)

  // Add CLAUDE.md
  zip.file('CLAUDE.md', plan.claudeMd)

  // Add package.json
  zip.file('package.json', generatePackageJson(session.name))

  // Add .env.example
  zip.file('.env.example', generateEnvExample())

  // Create modules folder
  const modulesFolder = zip.folder('modules')
  if (modulesFolder) {
    for (const module of plan.structure) {
      // Create module folder
      const moduleFolder = modulesFolder.folder(module.name)
      if (moduleFolder) {
        // Add module README
        moduleFolder.file('README.md', module.content)
        
        // Add module-specific files
        if (module.name === 'database') {
          moduleFolder.file('schema.sql', generateDatabaseSchema(session))
        }
        if (module.name === 'api') {
          moduleFolder.file('routes.ts', generateApiRoutes(session))
        }
        if (module.name === 'auth') {
          moduleFolder.file('config.ts', generateAuthConfig())
        }
      }
    }
  }

  // Create prompts folder
  const promptsFolder = zip.folder('prompts')
  if (promptsFolder) {
    for (const prompt of plan.prompts) {
      promptsFolder.file(
        `${prompt.id}.md`,
        formatPromptAsMarkdown(prompt)
      )
    }
  }

  // Create docs folder
  const docsFolder = zip.folder('docs')
  if (docsFolder) {
    docsFolder.file('SETUP.md', generateSetupGuide(plan))
    docsFolder.file('ARCHITECTURE.md', generateArchitectureDoc(plan))
    docsFolder.file('DEPLOYMENT.md', generateDeploymentGuide())
  }

  // Create config folder
  const configFolder = zip.folder('config')
  if (configFolder) {
    configFolder.file('supabase.json', generateSupabaseConfig())
    configFolder.file('tailwind.config.js', generateTailwindConfig())
    configFolder.file('tsconfig.json', generateTsConfig())
  }

  // Generate the zip buffer
  const buffer = await zip.generateAsync({ 
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  })

  return buffer
}

function generatePackageJson(projectName: string): string {
  return JSON.stringify({
    name: projectName.toLowerCase().replace(/\s+/g, '-'),
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
      'db:migrate': 'supabase migration up',
      'db:reset': 'supabase db reset'
    },
    dependencies: {
      'next': '^14.1.0',
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      '@supabase/supabase-js': '^2.39.0',
      '@supabase/ssr': '^0.1.0',
      'tailwindcss': '^3.4.0',
      'typescript': '^5.3.0',
      'zod': '^3.22.0',
      'react-hook-form': '^7.48.0',
      '@hookform/resolvers': '^3.3.0'
    },
    devDependencies: {
      '@types/node': '^20.10.0',
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      'autoprefixer': '^10.4.0',
      'postcss': '^8.4.0',
      'eslint': '^8.56.0',
      'eslint-config-next': '^14.1.0'
    }
  }, null, 2)
}

function generateEnvExample(): string {
  return `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Configuration
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Stripe Configuration (if using payments)
STRIPE_SECRET_KEY=your_stripe_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
`
}

function formatPromptAsMarkdown(prompt: ClaudePrompt): string {
  return `# ${prompt.title}

## Description
${prompt.description}

## MCP Servers Required
${prompt.mcpServers.map(s => `- ${s}`).join('\n')}

## Dependencies
${prompt.dependencies.map(d => `- ${d}`).join('\n')}

## Expected Output
${prompt.expectedOutput}

## Prompt
\`\`\`
${prompt.prompt}
\`\`\`
`
}

function generateSetupGuide(plan: ProcessedPlan): string {
  return `# Setup Guide

## Prerequisites
- Node.js 18+ and npm
- Supabase account
- Git

## Installation Steps

1. **Clone the repository**
   \`\`\`bash
   git clone <your-repo>
   cd <project-name>
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configure environment variables**
   - Copy \`.env.example\` to \`.env.local\`
   - Add your Supabase credentials
   - Add API keys for AI services

4. **Set up database**
   \`\`\`bash
   npx supabase init
   npx supabase migration up
   \`\`\`

5. **Run development server**
   \`\`\`bash
   npm run dev
   \`\`\`

## Module Setup Order
${plan.structure.map((m, i) => `${i + 1}. ${m.name} - ${m.dependencies.length > 0 ? `(depends on: ${m.dependencies.join(', ')})` : '(no dependencies)'}`).join('\n')}

## Using Claude Code Prompts
The \`prompts/\` folder contains ready-to-use prompts for Claude Code.
Execute them in order based on dependencies.
`
}

function generateArchitectureDoc(plan: ProcessedPlan): string {
  return `# Architecture Overview

## System Architecture
This SaaS application follows a modular architecture with clear separation of concerns.

## Modules
${plan.structure.map(m => `
### ${m.name}
- **Path**: ${m.path}
- **Dependencies**: ${m.dependencies.join(', ') || 'None'}
- **MCP Servers**: ${m.mcpServers?.join(', ') || 'None'}
- **Key Constraints**:
${m.constraints.map(c => `  - ${c}`).join('\n')}
`).join('\n')}

## Data Flow
1. User requests → Next.js frontend
2. Frontend → API routes
3. API routes → Supabase (database/auth)
4. Business logic processing
5. Response → User

## Security Considerations
- Row Level Security (RLS) on all tables
- JWT-based authentication
- Environment variable separation
- Input validation and sanitization
`
}

function generateDeploymentGuide(): string {
  return `# Deployment Guide

## Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

## Supabase Setup

1. Create new Supabase project
2. Run migrations
3. Configure auth providers
4. Set up RLS policies

## Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies enabled
- [ ] API rate limiting configured
- [ ] Error monitoring setup
- [ ] SSL certificates configured
- [ ] Backup strategy implemented
`
}

function generateDatabaseSchema(session: any): string {
  return `-- Database Schema for ${session.name}

-- Add your custom tables here
CREATE TABLE IF NOT EXISTS your_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
`
}

function generateApiRoutes(session: any): string {
  return `// API Routes for ${session.name}

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Implement GET logic
  return NextResponse.json({ message: 'GET endpoint' })
}

export async function POST(request: NextRequest) {
  // Implement POST logic
  return NextResponse.json({ message: 'POST endpoint' })
}
`
}

function generateAuthConfig(): string {
  return `// Authentication Configuration

export const authConfig = {
  providers: ['email', 'google'],
  redirectUrl: '/dashboard',
  sessionTimeout: 86400, // 24 hours
}
`
}

function generateSupabaseConfig(): string {
  return JSON.stringify({
    projectId: 'your-project-id',
    api: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }
  }, null, 2)
}

function generateTailwindConfig(): string {
  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {}
  },
  plugins: []
}
`
}

function generateTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'es5',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: {
        '@/*': ['./*']
      }
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules']
  }, null, 2)
}
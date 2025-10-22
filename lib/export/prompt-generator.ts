// Claude Prompt Generator

import { ClaudePrompt, ClaudeModule, ExportedFile } from './types'
import { PROMPT_TEMPLATE, processTemplate } from './templates'

export class PromptGenerator {
  private modules: ClaudeModule[]
  private businessIdea: string
  private businessName: string

  constructor(modules: ClaudeModule[], businessIdea: string, businessName: string) {
    this.modules = modules
    this.businessIdea = businessIdea
    this.businessName = businessName
  }

  // Generate all prompts organized by category
  generateAllPrompts(): ExportedFile[] {
    const prompts: ClaudePrompt[] = [
      ...this.generateSetupPrompts(),
      ...this.generateImplementationPrompts(),
      ...this.generateTestingPrompts(),
      ...this.generateDeploymentPrompts()
    ]

    return prompts.map(prompt => this.generatePromptFile(prompt))
  }

  // Generate prompt file from template
  private generatePromptFile(prompt: ClaudePrompt): ExportedFile {
    const templateVars = {
      title: prompt.title,
      description: prompt.description,
      context: prompt.context,
      mcpServers: prompt.mcpServers,
      model: prompt.model,
      dependencies: prompt.dependencies,
      prompt: prompt.prompt,
      expectedOutput: prompt.expectedOutput,
      successCriteria: this.generateSuccessCriteria(prompt),
      commonIssues: this.generateCommonIssues(prompt.category),
      category: prompt.category,
      timestamp: new Date().toISOString()
    }

    const content = processTemplate(PROMPT_TEMPLATE, templateVars)
    const path = `prompts/${prompt.category}/${prompt.id}.md`

    return {
      path,
      content,
      type: 'markdown',
      size: content.length
    }
  }

  // Generate setup prompts
  private generateSetupPrompts(): ClaudePrompt[] {
    const prompts: ClaudePrompt[] = []

    // Initial project setup
    prompts.push({
      id: 'initial-setup',
      title: 'Initial Project Setup',
      description: 'Set up the Next.js project with TypeScript and Tailwind CSS',
      context: `Setting up a new SaaS project: ${this.businessName} - ${this.businessIdea}`,
      mcpServers: [],
      model: 'claude-3-5-sonnet',
      prompt: `Create a new Next.js 14+ project with:
- TypeScript configuration with strict mode
- Tailwind CSS with custom theme
- App Router structure
- ESLint and Prettier configuration
- Basic folder structure for a SaaS application

Project details:
- Name: ${this.businessName}
- Description: ${this.businessIdea}

Include:
- /app directory structure
- /components folder organization
- /lib for utilities
- /types for TypeScript definitions
- /public for static assets

Create all necessary configuration files and initial boilerplate.`,
      expectedOutput: 'Complete Next.js project structure with all configuration files',
      dependencies: [],
      category: 'setup'
    })

    // Supabase setup
    prompts.push({
      id: 'supabase-setup',
      title: 'Supabase Configuration',
      description: 'Configure Supabase for database and authentication',
      context: 'Setting up Supabase integration with proper environment variables and client configuration',
      mcpServers: ['supabase'],
      model: 'claude-3-5-sonnet',
      prompt: `Using the Supabase MCP server, set up:

1. Initialize Supabase in the project
2. Create Supabase client utilities for:
   - Server-side usage (with cookies)
   - Client-side usage
   - Middleware integration
3. Configure environment variables
4. Set up authentication helpers

Create these files:
- /lib/supabase/client.ts
- /lib/supabase/server.ts
- /lib/supabase/middleware.ts
- /middleware.ts for auth protection

Use the Supabase MCP server to:
- Verify connection to the project
- Test authentication setup
- Ensure RLS is properly configured`,
      expectedOutput: 'Complete Supabase integration with auth and database clients',
      dependencies: ['initial-setup'],
      category: 'setup'
    })

    // Database schema setup
    if (this.modules.some(m => m.name === 'database')) {
      prompts.push({
        id: 'database-schema',
        title: 'Database Schema Creation',
        description: 'Create database tables and RLS policies',
        context: 'Setting up the complete database schema with proper relationships and security',
        mcpServers: ['supabase'],
        model: 'claude-3-5-sonnet',
        prompt: `Using the Supabase MCP server, create the database schema:

${this.generateDatabaseSchemaPrompt()}

For each table:
1. Create the table with proper data types
2. Add appropriate indexes
3. Implement RLS policies for multi-tenant isolation
4. Create necessary triggers (updated_at, etc.)

Use these Supabase MCP commands:
- apply_migration to create tables
- execute_sql for queries
- list_tables to verify creation`,
        expectedOutput: 'Complete database schema with all tables, relationships, and RLS policies',
        dependencies: ['supabase-setup'],
        category: 'setup'
      })
    }

    return prompts
  }

  // Generate implementation prompts
  private generateImplementationPrompts(): ClaudePrompt[] {
    const prompts: ClaudePrompt[] = []

    // Generate prompts for each module
    this.modules.forEach(module => {
      // Main module implementation
      prompts.push({
        id: `implement-${module.name}`,
        title: `Implement ${module.title} Module`,
        description: module.description,
        context: `Implementing the ${module.name} module with all required features and constraints`,
        mcpServers: module.mcpServers,
        model: 'claude-3-5-sonnet',
        prompt: this.generateModuleImplementationPrompt(module),
        expectedOutput: `Complete ${module.name} module implementation with all features`,
        dependencies: module.dependencies.map(d => `implement-${d}`),
        category: 'implementation'
      })

      // API endpoints for the module
      if (module.name === 'api' || module.features.some(f => f.includes('API'))) {
        prompts.push({
          id: `api-${module.name}`,
          title: `Create API Endpoints for ${module.title}`,
          description: `Implement RESTful API endpoints for ${module.name}`,
          context: 'Creating type-safe API routes with proper error handling',
          mcpServers: module.mcpServers,
          model: 'claude-3-5-sonnet',
          prompt: this.generateApiEndpointsPrompt(module),
          expectedOutput: 'Complete API implementation with all CRUD operations',
          dependencies: [`implement-${module.name}`],
          category: 'implementation'
        })
      }

      // UI components for the module
      if (module.name === 'ui' || module.features.some(f => f.includes('component'))) {
        prompts.push({
          id: `ui-${module.name}`,
          title: `Create UI Components for ${module.title}`,
          description: `Build React components for ${module.name}`,
          context: 'Creating responsive, accessible React components with Tailwind CSS',
          mcpServers: [],
          model: 'claude-3-5-sonnet',
          prompt: this.generateUiComponentsPrompt(module),
          expectedOutput: 'Complete set of React components with proper typing',
          dependencies: [`implement-${module.name}`],
          category: 'implementation'
        })
      }
    })

    return prompts
  }

  // Generate testing prompts
  private generateTestingPrompts(): ClaudePrompt[] {
    const prompts: ClaudePrompt[] = []

    // Unit tests
    prompts.push({
      id: 'unit-tests',
      title: 'Create Unit Tests',
      description: 'Write comprehensive unit tests for all modules',
      context: 'Setting up Jest and React Testing Library for unit testing',
      mcpServers: [],
      model: 'claude-3-5-sonnet',
      prompt: `Create unit tests for all modules:

${this.modules.map(m => `- ${m.name}: Test all exported functions and utilities`).join('\n')}

Set up:
1. Jest configuration
2. Testing utilities and helpers
3. Mock data factories
4. Test coverage reporting

Write tests for:
- Utility functions
- React hooks
- Data transformations
- Business logic

Aim for >80% code coverage.`,
      expectedOutput: 'Complete unit test suite with high coverage',
      dependencies: this.modules.map(m => `implement-${m.name}`),
      category: 'testing'
    })

    // E2E tests
    prompts.push({
      id: 'e2e-tests',
      title: 'Create E2E Tests',
      description: 'Write end-to-end tests for critical user flows',
      context: 'Setting up Playwright for E2E testing',
      mcpServers: ['playwright'],
      model: 'claude-3-5-sonnet',
      prompt: `Using the Playwright MCP server, create E2E tests for:

Critical User Flows:
1. User registration and login
2. Main feature workflow
3. Payment flow (if applicable)
4. Data export functionality

For each flow:
- Set up test data
- Navigate through the flow
- Verify expected outcomes
- Clean up test data

Use Playwright MCP commands:
- browser_navigate
- browser_click
- browser_type
- browser_snapshot
- browser_wait_for`,
      expectedOutput: 'Complete E2E test suite covering all critical paths',
      dependencies: ['unit-tests'],
      category: 'testing'
    })

    return prompts
  }

  // Generate deployment prompts
  private generateDeploymentPrompts(): ClaudePrompt[] {
    const prompts: ClaudePrompt[] = []

    // Production configuration
    prompts.push({
      id: 'production-config',
      title: 'Configure for Production',
      description: 'Prepare the application for production deployment',
      context: 'Optimizing and securing the application for production',
      mcpServers: ['supabase'],
      model: 'claude-3-5-sonnet',
      prompt: `Prepare the application for production:

1. Environment Configuration:
   - Set up production environment variables
   - Configure secrets management
   - Set up different configs for dev/staging/prod

2. Performance Optimization:
   - Enable Next.js production optimizations
   - Configure caching strategies
   - Optimize images and assets
   - Set up CDN configuration

3. Security Hardening:
   - Implement CSP headers
   - Configure CORS properly
   - Set up rate limiting
   - Enable security headers

4. Database Optimization:
   - Create production indexes
   - Optimize queries
   - Set up connection pooling

5. Monitoring Setup:
   - Configure error tracking
   - Set up performance monitoring
   - Add logging infrastructure`,
      expectedOutput: 'Production-ready configuration with all optimizations',
      dependencies: ['e2e-tests'],
      category: 'deployment'
    })

    // Deployment setup
    prompts.push({
      id: 'deployment-setup',
      title: 'Deploy to Vercel',
      description: 'Deploy the application to Vercel with proper configuration',
      context: 'Setting up CI/CD pipeline and deployment configuration',
      mcpServers: [],
      model: 'claude-3-5-sonnet',
      prompt: `Set up Vercel deployment:

1. Create vercel.json configuration
2. Configure build settings
3. Set up environment variables in Vercel
4. Configure custom domains
5. Set up preview deployments
6. Configure GitHub integration

Include:
- Build optimization settings
- Serverless function configuration
- Edge function setup (if needed)
- Redirect rules
- Headers configuration

Create deployment documentation with:
- Step-by-step deployment guide
- Environment variable checklist
- Post-deployment verification steps`,
      expectedOutput: 'Complete Vercel deployment configuration and documentation',
      dependencies: ['production-config'],
      category: 'deployment'
    })

    return prompts
  }

  // Helper methods
  private generateSuccessCriteria(prompt: ClaudePrompt): string[] {
    const baseCriteria = [
      'Code compiles without errors',
      'All tests pass',
      'No security vulnerabilities',
      'Follows project conventions'
    ]

    // Add category-specific criteria
    switch (prompt.category) {
      case 'setup':
        return [...baseCriteria, 'Environment variables configured', 'Dependencies installed']
      case 'implementation':
        return [...baseCriteria, 'Features work as expected', 'API endpoints respond correctly']
      case 'testing':
        return ['All tests pass', 'Coverage meets requirements', 'No flaky tests']
      case 'deployment':
        return ['Deployment successful', 'Application accessible', 'Performance metrics acceptable']
      default:
        return baseCriteria
    }
  }

  private generateCommonIssues(category: string): Array<{issue: string, solution: string}> {
    const commonIssues: Record<string, Array<{issue: string, solution: string}>> = {
      setup: [
        { 
          issue: 'Module not found errors',
          solution: 'Check package.json and run npm install'
        },
        {
          issue: 'Environment variables not loading',
          solution: 'Ensure .env.local exists and variables are prefixed with NEXT_PUBLIC_ for client-side'
        }
      ],
      implementation: [
        {
          issue: 'Type errors in TypeScript',
          solution: 'Define proper interfaces and use type assertions where necessary'
        },
        {
          issue: 'API endpoints returning 404',
          solution: 'Check file naming and folder structure in /app/api'
        }
      ],
      testing: [
        {
          issue: 'Tests timing out',
          solution: 'Increase timeout or mock external services'
        },
        {
          issue: 'Flaky E2E tests',
          solution: 'Add proper wait conditions and use data-testid attributes'
        }
      ],
      deployment: [
        {
          issue: 'Build failures on Vercel',
          solution: 'Check build logs and ensure all dependencies are in package.json'
        },
        {
          issue: 'Environment variables not working in production',
          solution: 'Add variables to Vercel dashboard and redeploy'
        }
      ]
    }

    return commonIssues[category] || []
  }

  private generateDatabaseSchemaPrompt(): string {
    // Extract database requirements from modules
    const tables = [
      'users (extends Supabase auth.users)',
      'profiles (user profile data)',
      'organizations (multi-tenant support)',
      'subscriptions (payment tiers)',
      'sessions (workflow sessions)',
      'answers (phase answers)',
      'outputs (generated exports)'
    ]

    return `Create these tables:
${tables.map(t => `- ${t}`).join('\n')}

With proper:
- Foreign key relationships
- Indexes on frequently queried columns
- RLS policies for user data isolation
- Audit columns (created_at, updated_at)`
  }

  private generateModuleImplementationPrompt(module: ClaudeModule): string {
    return `Implement the ${module.name} module with:

Features:
${module.features.map(f => `- ${f}`).join('\n')}

Constraints:
${module.constraints.map(c => `- ${c}`).join('\n')}

Dependencies:
${module.dependencies.map(d => `- ${d} module must be working`).join('\n') || '- None'}

Required files:
- /lib/${module.name}/index.ts - Main exports
- /lib/${module.name}/types.ts - TypeScript definitions
- /lib/${module.name}/constants.ts - Configuration constants
- /lib/${module.name}/utils.ts - Utility functions
${module.mcpServers.length > 0 ? `- /lib/${module.name}/client.ts - MCP client integration` : ''}

Implementation requirements:
${module.content}

Ensure:
- Proper error handling
- TypeScript strict mode compliance
- Comprehensive JSDoc comments
- Exported functions are tested`
  }

  private generateApiEndpointsPrompt(module: ClaudeModule): string {
    return `Create RESTful API endpoints for ${module.name}:

Required endpoints:
- GET /api/${module.name} - List all items
- GET /api/${module.name}/[id] - Get single item
- POST /api/${module.name} - Create new item
- PUT /api/${module.name}/[id] - Update item
- DELETE /api/${module.name}/[id] - Delete item

For each endpoint:
1. Validate request data with Zod
2. Check authentication and authorization
3. Implement proper error handling
4. Return consistent response format
5. Add rate limiting
6. Log operations for audit

Response format:
{
  success: boolean,
  data?: any,
  error?: { code: string, message: string },
  pagination?: { page: number, limit: number, total: number }
}`
  }

  private generateUiComponentsPrompt(module: ClaudeModule): string {
    return `Create React components for ${module.name}:

Required components:
${module.features.map(f => `- ${f}Component`).join('\n')}

For each component:
1. Use TypeScript with proper prop types
2. Implement responsive design with Tailwind CSS
3. Add loading and error states
4. Include accessibility attributes (ARIA)
5. Use React hooks for state management
6. Implement proper memoization where needed

Component structure:
- /components/${module.name}/ComponentName.tsx
- Export from /components/${module.name}/index.ts
- Include Storybook stories if applicable

Follow these patterns:
- Server components by default
- Client components only when needed ('use client')
- Proper hydration boundaries
- Optimistic updates for better UX`
  }
}
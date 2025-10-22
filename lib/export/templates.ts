// Export Templates for ClaudeOps Documentation

import { ClaudeModule, ClaudePrompt, TemplateVariables } from './types'

export const CLAUDE_MD_TEMPLATE = `# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

{{businessName}} - {{businessIdea}}

**Target Audience**: {{targetAudience}}
**Generated**: {{timestamp}}
**Version**: {{version}}

## Core Architecture

The system is organized into **{{moduleCount}} modular components**, each documented in separate .md files under 50KB:

### Module Structure
\`\`\`
{{moduleTree}}
\`\`\`

### Data Flow
\`\`\`
{{dataFlow}}
\`\`\`

## Critical Constraints

{{#constraints}}
- {{.}}
{{/constraints}}

## MCP Server Configuration

This project uses the following MCP servers:
{{#mcpServers}}
- **{{name}}**: {{purpose}}
{{/mcpServers}}

## Development Commands

\`\`\`bash
# Initial setup
npm install
npx supabase init
npx supabase migration up

# Development
npm run dev

# Testing
npm test

# Production build
npm run build
npm start
\`\`\`

## Module Dependencies

{{moduleDepGraph}}

## Implementation Order

Follow this order when implementing features:
{{#implementationOrder}}
{{order}}. {{name}} - {{reason}}
{{/implementationOrder}}

## Key Business Logic

{{#businessLogic}}
- **{{feature}}**: {{logic}}
{{/businessLogic}}

## Security Requirements

All modules must implement:
- Row Level Security (RLS) for data access
- Input validation and sanitization
- Secure environment variable handling
- Audit logging for sensitive operations

## Testing Strategy

Each module requires:
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Performance tests for data operations
`

export const README_TEMPLATE = `# {{businessName}}

> {{businessIdea}}

## 🎯 Target Audience

{{targetAudience}}

## ✨ Features

{{#features}}
- {{.}}
{{/features}}

## 🛠️ Tech Stack

{{#techStack}}
- **{{category}}**: {{technology}}
{{/techStack}}

## 📦 Project Structure

\`\`\`
{{projectStructure}}
\`\`\`

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd {{projectSlug}}
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   
   Edit \`.env.local\` and add your:
   - Supabase credentials
   - Stripe keys
   - AI API keys

4. **Initialize database**
   \`\`\`bash
   npx supabase init
   npx supabase migration up
   \`\`\`

5. **Run development server**
   \`\`\`bash
   npm run dev
   \`\`\`

   Open [http://localhost:3000](http://localhost:3000)

## 📚 Documentation

Detailed documentation for each module can be found in:
{{#modules}}
- [{{title}}]({{path}}) - {{description}}
{{/modules}}

## 🧩 Modules

{{moduleDescriptions}}

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
{{#envVars}}
| \`{{name}}\` | {{description}} | {{required}} |
{{/envVars}}

## 📝 Development Workflow

1. **Feature Development**
   - Create feature branch
   - Implement changes
   - Write tests
   - Submit PR

2. **Testing**
   \`\`\`bash
   npm test        # Run unit tests
   npm run test:e2e # Run E2E tests
   \`\`\`

3. **Deployment**
   \`\`\`bash
   npm run build
   npm run deploy
   \`\`\`

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and development process.

## 📄 License

This project is proprietary and confidential.

## 🙏 Acknowledgments

Generated with Claude Code and the SaaS Blueprint Generator

---

*Built with ❤️ using Claude Code*
`

export const MODULE_README_TEMPLATE = `# {{moduleName}} Module

## Purpose

{{description}}

## Features

{{#features}}
- {{.}}
{{/features}}

## Dependencies

{{#dependencies}}
- {{.}}
{{/dependencies}}

## MCP Servers

{{#mcpServers}}
- **{{.}}**
{{/mcpServers}}

## Constraints

{{#constraints}}
1. {{.}}
{{/constraints}}

## Implementation

### File Structure

\`\`\`
{{fileStructure}}
\`\`\`

### Key Components

{{#components}}
#### {{name}}
- **Purpose**: {{purpose}}
- **Location**: \`{{path}}\`
- **Dependencies**: {{dependencies}}
{{/components}}

## API Endpoints

{{#endpoints}}
### {{method}} {{path}}
- **Description**: {{description}}
- **Auth Required**: {{authRequired}}
- **Request Body**: \`{{requestSchema}}\`
- **Response**: \`{{responseSchema}}\`
{{/endpoints}}

## Database Schema

{{#tables}}
### {{tableName}}
\`\`\`sql
{{schema}}
\`\`\`
{{/tables}}

## Environment Variables

{{#envVars}}
- \`{{name}}\`: {{description}}
{{/envVars}}

## Testing

### Unit Tests
\`\`\`bash
npm test {{modulePath}}
\`\`\`

### Integration Tests
\`\`\`bash
npm run test:integration {{modulePath}}
\`\`\`

## Deployment Considerations

{{#deployment}}
- {{.}}
{{/deployment}}
`

export const PROMPT_TEMPLATE = `# {{title}}

## Description
{{description}}

## Context
{{context}}

## MCP Servers Required
{{#mcpServers}}
- {{.}}
{{/mcpServers}}

## Model Recommendation
Use **{{model}}** for optimal results

## Dependencies
Ensure these are completed first:
{{#dependencies}}
- {{.}}
{{/dependencies}}

---

## Prompt

\`\`\`
{{prompt}}
\`\`\`

---

## Expected Output
{{expectedOutput}}

## Success Criteria
{{#successCriteria}}
- [ ] {{.}}
{{/successCriteria}}

## Common Issues & Solutions

{{#commonIssues}}
### Issue: {{issue}}
**Solution**: {{solution}}
{{/commonIssues}}

---

*Category: {{category}}*
*Generated: {{timestamp}}*
`

export const SETUP_GUIDE_TEMPLATE = `# Setup Guide

## Overview
This guide will walk you through setting up {{businessName}} from scratch.

## Prerequisites

### Required Software
{{#prerequisites}}
- {{name}} ({{version}})
{{/prerequisites}}

### Required Accounts
{{#accounts}}
- {{service}}: {{purpose}}
{{/accounts}}

## Step-by-Step Setup

{{#setupSteps}}
### Step {{number}}: {{title}}

{{description}}

\`\`\`bash
{{#commands}}
{{.}}
{{/commands}}
\`\`\`

{{#notes}}
> **Note**: {{.}}
{{/notes}}

{{/setupSteps}}

## Configuration

### Environment Variables
Create a \`.env.local\` file with:

\`\`\`env
{{envTemplate}}
\`\`\`

### Database Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Copy project URL and anon key

2. **Run Migrations**
   \`\`\`bash
   npx supabase migration up
   \`\`\`

3. **Seed Data (Optional)**
   \`\`\`bash
   npx supabase seed
   \`\`\`

## Verification

Run these commands to verify setup:

{{#verificationSteps}}
\`\`\`bash
{{command}}
\`\`\`
Expected output: {{expectedOutput}}

{{/verificationSteps}}

## Troubleshooting

{{#troubleshooting}}
### {{problem}}
**Solution**: {{solution}}

{{/troubleshooting}}

## Next Steps

Once setup is complete:
1. Run \`npm run dev\` to start development server
2. Visit http://localhost:3000
3. Begin implementing features using the prompts in \`/prompts\`
`

export const ARCHITECTURE_DOC_TEMPLATE = `# Architecture Documentation

## System Overview

{{businessName}} is built using a modern, scalable architecture designed for:
{{#designGoals}}
- {{.}}
{{/designGoals}}

## High-Level Architecture

\`\`\`
{{architectureDiagram}}
\`\`\`

## Components

{{#components}}
### {{name}}

**Purpose**: {{purpose}}
**Technology**: {{technology}}
**Responsibilities**:
{{#responsibilities}}
- {{.}}
{{/responsibilities}}

{{/components}}

## Data Flow

### User Request Flow
\`\`\`
{{userFlowDiagram}}
\`\`\`

### Data Processing Pipeline
\`\`\`
{{dataPipelineDiagram}}
\`\`\`

## Database Design

### Entity Relationship Diagram
\`\`\`
{{erDiagram}}
\`\`\`

### Key Tables
{{#tables}}
- **{{name}}**: {{purpose}}
{{/tables}}

## API Design

### RESTful Endpoints
{{#apiGroups}}
#### {{group}}
{{#endpoints}}
- \`{{method}} {{path}}\`: {{description}}
{{/endpoints}}
{{/apiGroups}}

## Security Architecture

### Authentication Flow
{{authFlow}}

### Authorization Model
{{authzModel}}

### Data Protection
{{#dataProtection}}
- {{.}}
{{/dataProtection}}

## Scalability Considerations

{{#scalability}}
### {{area}}
{{strategy}}
{{/scalability}}

## Technology Decisions

{{#techDecisions}}
### {{decision}}
**Choice**: {{choice}}
**Rationale**: {{rationale}}
**Trade-offs**: {{tradeoffs}}
{{/techDecisions}}

## Deployment Architecture

### Infrastructure
\`\`\`
{{infrastructureDiagram}}
\`\`\`

### CI/CD Pipeline
{{cicdPipeline}}

## Monitoring & Observability

{{#monitoring}}
- **{{metric}}**: {{tool}}
{{/monitoring}}

## Disaster Recovery

### Backup Strategy
{{backupStrategy}}

### Recovery Procedures
{{recoveryProcedures}}
`

// Template processing function
export function processTemplate(template: string, variables: any): string {
  let result = template
  
  // Replace simple variables {{variable}}
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, variables[key] || '')
  })
  
  // Process arrays {{#array}}{{.}}{{/array}}
  const arrayRegex = /{{#(\w+)}}([\s\S]*?){{\/\1}}/g
  result = result.replace(arrayRegex, (match, arrayName, content) => {
    const array = variables[arrayName]
    if (!Array.isArray(array)) return ''
    
    return array.map(item => {
      if (typeof item === 'string') {
        return content.replace(/{{\.}}/g, item)
      } else {
        let itemContent = content
        Object.keys(item).forEach(key => {
          const itemRegex = new RegExp(`{{${key}}}`, 'g')
          itemContent = itemContent.replace(itemRegex, item[key] || '')
        })
        return itemContent
      }
    }).join('')
  })
  
  return result
}

// Generate module tree visualization
export function generateModuleTree(modules: ClaudeModule[]): string {
  const tree = [`project/
├── README.md
├── CLAUDE.md
├── package.json
├── .env.local
├── modules/`]
  
  modules.forEach((module, index) => {
    const isLast = index === modules.length - 1
    const prefix = isLast ? '└── ' : '├── '
    tree.push(`│   ${prefix}${module.name}/`)
    tree.push(`│   ${isLast ? '    ' : '│   '}├── README.md`)
    tree.push(`│   ${isLast ? '    ' : '│   '}├── index.ts`)
    tree.push(`│   ${isLast ? '    ' : '│   '}└── ...`)
  })
  
  tree.push(`├── prompts/`)
  tree.push(`│   ├── setup/`)
  tree.push(`│   ├── implementation/`)
  tree.push(`│   └── testing/`)
  tree.push(`└── docs/`)
  tree.push(`    ├── ARCHITECTURE.md`)
  tree.push(`    ├── SETUP.md`)
  tree.push(`    └── DEPLOYMENT.md`)
  
  return tree.join('\n')
}

// Generate data flow diagram
export function generateDataFlow(modules: ClaudeModule[]): string {
  const flow = [
    'User Request',
    '     ↓',
    'Next.js Frontend',
    '     ↓',
    'API Routes'
  ]
  
  const hasAuth = modules.some(m => m.name === 'auth')
  if (hasAuth) {
    flow.push('     ↓')
    flow.push('Authentication')
  }
  
  flow.push('     ↓')
  flow.push('Business Logic')
  flow.push('     ↓')
  flow.push('Database (Supabase)')
  flow.push('     ↓')
  flow.push('Response')
  
  return flow.join('\n')
}
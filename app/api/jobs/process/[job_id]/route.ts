import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { readFileSync } from 'fs'
import { join } from 'path'

// Allow up to 300 seconds for job processing (Vercel Pro plan)
export const maxDuration = 300

// POST /api/jobs/process/[job_id] - Process the job (called internally by frontend immediately after job creation)
export async function POST(
  req: Request,
  { params }: { params: { job_id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[JOB-PROCESS] Starting job processing:', params.job_id)

    // 1. Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, session_id, status, user_id')
      .eq('id', params.job_id)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      console.error('[JOB-PROCESS] Job not found:', jobError)
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.status !== 'pending') {
      console.log('[JOB-PROCESS] Job already processed:', job.status)
      return NextResponse.json({ message: 'Job already processed', status: job.status })
    }

    // 2. Update job status to processing
    await supabase
      .from('jobs')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.job_id)

    console.log('[JOB-PROCESS] Job status updated to processing')

    // 3. Fetch all phase answers
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('phase_number, answer_text, question_text')
      .eq('session_id', job.session_id)
      .order('phase_number', { ascending: true })

    if (answersError || !answers) {
      console.error('[JOB-PROCESS] Error fetching answers:', answersError)
      await updateJobStatus(supabase, params.job_id, 'failed', null, 'Failed to fetch workflow answers')
      return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 })
    }

    const uniquePhases = new Set(answers.map(a => a.phase_number)).size
    if (uniquePhases !== 12) {
      const errorMsg = `Incomplete workflow. Expected 12 phases, found ${uniquePhases}`
      console.error('[JOB-PROCESS]', errorMsg)
      await updateJobStatus(supabase, params.job_id, 'failed', null, errorMsg)
      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }

    console.log('[JOB-PROCESS] Found 12 complete phases, calling GPT-4...')

    // 4. Call GPT-4 to generate building plan
    let buildingPlan: string
    try {
      buildingPlan = await callGPT(answers)
      console.log('[JOB-PROCESS] GPT-4 response received, length:', buildingPlan.length)
    } catch (gptError) {
      console.error('[JOB-PROCESS] GPT-4 error:', gptError)
      const errorMsg = gptError instanceof Error ? gptError.message : 'Failed to generate plan'
      await updateJobStatus(supabase, params.job_id, 'failed', null, errorMsg)
      return NextResponse.json({ error: errorMsg }, { status: 500 })
    }

    if (!buildingPlan || buildingPlan.length === 0) {
      const errorMsg = 'GPT-4 returned empty plan'
      console.error('[JOB-PROCESS]', errorMsg)
      await updateJobStatus(supabase, params.job_id, 'failed', null, errorMsg)
      return NextResponse.json({ error: errorMsg }, { status: 500 })
    }

    // 5. Save plan to database
    const { data: existingPlan } = await supabase
      .from('plans')
      .select('id')
      .eq('session_id', job.session_id)
      .single()

    let planId: string
    if (existingPlan) {
      // Update existing plan
      const { data: updatedPlan, error: updateError } = await supabase
        .from('plans')
        .update({
          content: buildingPlan,
          edited_content: null,
          status: 'generated',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPlan.id)
        .select('id')
        .single()

      if (updateError || !updatedPlan) {
        console.error('[JOB-PROCESS] Error updating plan:', updateError)
        await updateJobStatus(supabase, params.job_id, 'failed', null, 'Failed to save plan')
        return NextResponse.json({ error: 'Failed to save plan' }, { status: 500 })
      }
      planId = updatedPlan.id
    } else {
      // Create new plan
      const { data: newPlan, error: insertError } = await supabase
        .from('plans')
        .insert({
          session_id: job.session_id,
          user_id: user.id,
          content: buildingPlan,
          status: 'generated'
        })
        .select('id')
        .single()

      if (insertError || !newPlan) {
        console.error('[JOB-PROCESS] Error inserting plan:', insertError)
        await updateJobStatus(supabase, params.job_id, 'failed', null, 'Failed to save plan')
        return NextResponse.json({ error: 'Failed to save plan' }, { status: 500 })
      }
      planId = newPlan.id
    }

    console.log('[JOB-PROCESS] Plan saved successfully:', planId)

    // 6. Update job status to completed
    await updateJobStatus(supabase, params.job_id, 'completed', {
      plan: buildingPlan,
      planId: planId,
      status: 'generated'
    }, null)

    console.log('[JOB-PROCESS] Job completed successfully')

    return NextResponse.json({
      message: 'Job completed successfully',
      planId: planId
    })

  } catch (error) {
    console.error('[JOB-PROCESS] Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Job processing failed' },
      { status: 500 }
    )
  }
}

async function updateJobStatus(
  supabase: any,
  jobId: string,
  status: string,
  result: any,
  errorMessage: string | null
) {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  }

  if (status === 'completed') {
    updateData.result = result
    updateData.completed_at = new Date().toISOString()
  }

  if (errorMessage) {
    updateData.error_message = errorMessage
  }

  await supabase
    .from('jobs')
    .update(updateData)
    .eq('id', jobId)
}

async function callGPT(answers: Array<{ phase_number: number; answer_text: string; question_text: string }>) {
  console.log('[CALL-GPT] Starting GPT-4 call with', answers.length, 'answers')

  try {
    // Verify API key exists
    if (!process.env.OPENAI_API_KEY) {
      console.error('[CALL-GPT] OpenAI API key not configured')
      throw new Error('OpenAI API key not configured. Please contact support.')
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    console.log('[CALL-GPT] OpenAI client created')

    // Load GPT knowledge bases
    console.log('[CALL-GPT] Loading knowledge bases...')
    const kb1 = readFileSync(
      join(process.cwd(), 'ai-workflow/knowledge-base-1.md'),
      'utf-8'
    )
    const kb2 = readFileSync(
      join(process.cwd(), 'ai-workflow/knowledge-base-2.md'),
      'utf-8'
    )
    console.log('[CALL-GPT] Knowledge bases loaded:', { kb1Length: kb1.length, kb2Length: kb2.length })

    // Format answers - group by phase with all questions
    const phaseGroups = answers.reduce((acc, answer) => {
      if (!acc[answer.phase_number]) {
        acc[answer.phase_number] = []
      }
      acc[answer.phase_number].push(`Q: ${answer.question_text}\nA: ${answer.answer_text}`)
      return acc
    }, {} as Record<number, string[]>)

    const formattedAnswers = Object.entries(phaseGroups)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([phase, qas]) => `**Phase ${phase}**:\n${qas.join('\n\n')}`)
      .join('\n\n---\n\n')

    console.log('[CALL-GPT] Formatted answers length:', formattedAnswers.length)

    console.log('[CALL-GPT] Calling OpenAI API...')
    const startTime = Date.now()

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert SaaS architect and technical planning consultant. Your role is to transform user's workflow answers into a comprehensive, Claude-ready SaaS building plan by deeply analyzing their requirements and applying the structured knowledge bases provided.

## YOUR CRITICAL TASK

**DO NOT** simply echo or restate the user's answers. That is unacceptable.

**YOU MUST** act as a senior SaaS architect who:
1. Analyzes the user's raw answers to extract the core business requirements
2. Applies proven patterns, rules, and examples from the knowledge bases
3. Makes specific technology and architecture recommendations with clear rationale
4. Synthesizes everything into a comprehensive, actionable building plan

Think of yourself as the bridge between:
- **Input**: User's raw 12-phase answers (their business idea and requirements)
- **Knowledge**: Two extensive playbooks with proven SaaS patterns and AI model guidance
- **Output**: A structured technical plan that Claude Code can use to generate actual implementation files

## KNOWLEDGE BASES PROVIDED

### Knowledge Base 1: SaaS Founders Playbook
Comprehensive JSON-structured guide covering:
- **App Architecture**: MVP vs V1.5, feature prioritization (RICE, MoSCoW, Kano)
- **Product Abstraction**: How to define primitives, relationships, state machines
- **Onboarding Best Practices**: SSO, guided tours, activation metrics
- **UI/UX Design**: Design systems, accessibility, responsive design, color theory
- **Tech Stack**: Frontend, backend, auth (Auth0/Clerk/Supabase), payments (Stripe/Paddle/Lemon Squeezy)
- **Infrastructure**: Hosting, CI/CD, observability, scaling strategies
- **Database Design**: Multi-tenancy patterns (shared DB, DB per tenant, sharded), indexing
- **User Roles & Permissions**: RBAC, least privilege, SSO integration
- **Pricing & Billing**: Subscription models, usage-based, tiered, freemium
- **AI Integration**: Model selection criteria, cost modeling, privacy considerations

### Knowledge Base 2: AI API Keys & Model Landscape
Detailed guide for AI model selection with:
- **Anthropic Claude**: Haiku, Sonnet, Opus (pricing, context windows, use cases)
- **OpenAI GPT**: GPT-4o, GPT-4.1, GPT-5 variants (multimodal, context, costs)
- **Perplexity Sonar**: Search-grounded answers with citations
- **Meta Llama**: Open-source models with long context (Llama 4 Scout: 10M tokens)
- **Google Gemini**: Multimodal across text/image/audio/video
- **Generative Media**: Veo, Sora, Pika, Imagen for video/image generation
- **Decision Framework**: Match model to task, budget, context window, modality needs

## SYNTHESIS METHODOLOGY

### Step 1: Extract Core Requirements
From the user's Phase 1-3 answers, identify:
- **The Problem**: What specific pain point are they solving?
- **Target Users**: Who exactly will use this? (B2B, B2C, developers, enterprises?)
- **Core Value Proposition**: What's the "aha moment" that makes users pay?
- **Key Features**: What are the must-have capabilities for MVP?

### Step 2: Apply Architectural Patterns (from KB1)
Based on their requirements, recommend:
- **Architecture Pattern**: Monolith (for MVP) or microservices (if scale needed from day 1)
  - Use KB1's app_architecture principles: "sequence_mvp_then_v1_5_then_roadmap"
- **Product Abstraction**: Define the core primitives (e.g., if it's a project management tool: projects, tasks, users)
  - Use KB1's product_abstraction_framework: "select_clear_product_metaphor"
- **Multi-tenancy Strategy**: Shared DB with org_id, DB per tenant, or hybrid
  - Use KB1's database_design_multi_tenancy rules based on customer profile

### Step 3: Design Tech Stack (from KB1 + KB2)
Make specific recommendations with rationale:

**Frontend**:
- If custom brand needed → "Next.js 14 with Tailwind CSS (KB1: bespoke_brand, rapid_customization)"
- If speed/accessibility priority → "Next.js 14 with Material-UI (KB1: speed, accessibility_defaults)"

**Backend**:
- Solo developer → "Next.js API Routes or Express (KB1: solo developer pattern)"
- Complex logic → "Node.js/TypeScript with Express or NestJS"

**Database**:
- Multi-tenant SaaS → "PostgreSQL with org_id on all tables (KB1: shared_db pattern, pros: simple + cost-effective)"
- Heavy analytics → "PostgreSQL with TimescaleDB extension"

**Auth**:
- B2B with SSO required → "Clerk or Auth0 with SAML/OIDC (KB1: b2b_requirements)"
- B2C simple → "Supabase Auth with JWT and RLS (KB1: cost-effective for B2C)"

**Payments**:
- Need MoR for EU VAT → "Paddle or Lemon Squeezy (KB1: is_mor: true, handles taxes)"
- Direct control → "Stripe (KB1: is_mor: false, lower fees: 2.9% + $0.30)"

**AI Models** (if Phase 12 indicates AI features):
- Long document analysis → "Claude Sonnet 4 or GPT-4.1 (KB2: 200k-1M context, $1.25-$3/M tokens input)"
- High-volume chat → "GPT-5 Mini or Llama 3.2 (KB2: $0.25/M or $0.05/M tokens)"
- Search-grounded answers → "Perplexity Sonar (KB2: citations + live data, $1/M tokens + $5/1k queries)"
- Image generation → "GPT Image 1 or Imagen 4 (KB2: $0.01-$0.17/image or $0.03-$0.06/image)"

### Step 4: Structure User Experience (from KB1)
Apply onboarding_best_practices and ui_ux_design:
- **Onboarding Flow**: SSO → minimal signup → guided aha checklist (KB1: delay friction until after value)
- **Activation Event**: Define the key action (e.g., "created_first_project", "sent_first_message")
- **Core User Journeys**: Map signup → activation → core loop → upgrade
- **UI Patterns**: 60-30-10 color rule, 44px touch targets, 14pt body text (KB1: accessibility)

### Step 5: Define Business Logic (from KB1)
- **User Roles**: Owner/Admin, Member, Guest/Viewer (KB1: user_roles_permissions)
- **Permissions**: RBAC with least privilege (KB1: centralized_identity)
- **Pricing Model**: Choose from subscription, usage-based, tiered, freemium, per-user (KB1: pricing_billing)
  - Example: "Per-user tiered pricing: Free (1 user), Pro ($15/user/mo), Business ($30/user/mo) with annual discount"
- **Billing Integration**: Stripe/Paddle setup with webhooks for subscription events

### Step 6: Plan MVP → Growth → Enterprise Roadmap
Use KB1's prioritization framework:
- **MVP (Weeks 1-4)**: Core features that deliver activation event
  - Apply RICE scoring to prioritize
  - Reference KB1 pitfalls: "building_features_without_user_validation"
- **Growth (Weeks 5-8)**: Features that improve retention and enable scaling
- **Enterprise (Weeks 9-12)**: Advanced features like SSO, RBAC, custom integrations

## OUTPUT FORMAT

Generate a structured Markdown document following this template:

---

# [Product Name] - Comprehensive SaaS Building Plan

## 1. Product Overview

**Problem Being Solved**:
[Extract from user's Phase 1-3 answers - what specific pain point?]

**Solution Approach**:
[How does this SaaS solve the problem? What's the core mechanism?]

**Target Users**:
[Who exactly? B2B/B2C? Industry? Company size?]

**Value Proposition**:
[Why will users pay? What's the ROI or time saved?]

**Activation Event**:
[The "aha moment" - what action indicates a user got value? From KB1 onboarding principles]

---

## 2. Core Architecture

### Architecture Pattern
**Recommendation**: [Monolith or Microservices]

**Rationale**: [Reference KB1 app_architecture principles - e.g., "Start with monolith for MVP speed (KB1: sequence_mvp_then_v1_5), plan to extract microservices if/when specific services need independent scaling"]

### Product Abstraction Framework
**Core Primitives**: [List 3-5 key entities from KB1 product_abstraction_framework]
- [Primitive 1]: [Purpose, key attributes]
- [Primitive 2]: [Purpose, key attributes]
- [Primitive 3]: [Purpose, key attributes]

**Relationships**: [How primitives relate - one-to-many, many-to-many]

**State Machine**: [Draft → Active → Archived, etc., from KB1 patterns]

### Tech Stack Recommendations

**Frontend**:
- [Specific tech + version]
- **Rationale**: [Quote KB1 rule - e.g., "Next.js 14 with Tailwind (KB1: bespoke_brand, rapid_customization)"]

**Backend**:
- [Specific tech + version]
- **Rationale**: [Quote KB1 rule]

**Database**:
- [Specific tech]
- **Rationale**: [Quote KB1 database_design rule]

**Authentication**:
- [Specific provider]
- **Rationale**: [Quote KB1 auth rule with B2B/B2C context]

**Payments**:
- [Specific provider]
- **Rationale**: [Quote KB1 pricing rule with MoR/fees context]
- **Estimated Fees**: [Calculate from KB1 fee data]

**AI Models** (if applicable):
- [Specific models from KB2]
- **Rationale**: [Quote KB2 with pricing and context window]
- **Estimated Costs**: [Calculate from KB2 pricing data based on expected volume]

**Hosting & Infrastructure**:
- [Provider - e.g., Vercel, Railway, Fly.io]
- **Rationale**: [Quote KB1 infrastructure rule]

**Observability**:
- [Tools - e.g., Sentry, LogSnag, Datadog]
- **Rationale**: [Quote KB1 observability principle]

---

## 3. Database Design

### Multi-tenancy Strategy
**Pattern**: [Shared DB with org_id / DB per tenant / Sharded multi-tenant]

**Rationale**: [Quote KB1 database_design_multi_tenancy rule with pros/cons]

### Core Tables & Schema
[List main tables with relationships, from user's requirements + KB1 templates]

**Example Schema**:
- Users table: id, email, organisation_id, role, created_at
- Organisations table: id, name, plan, created_at
- Core resource table: id, organisation_id, created_by, [key_attributes], created_at, updated_at

**Important**: Add BTREE indexes on organisation_id columns (KB1: missing_org_index pitfall)

**Indexes**: [List required indexes, reference KB1 pitfall: "missing_org_index"]

### Data Flow
[Describe how data moves through the system for key user journeys]

---

## 4. User Experience Design

### Onboarding Flow (KB1 onboarding_best_practices)
1. **Landing Page**: Explain core value proposition
2. **Signup**: [Email + password or SSO, minimized fields per KB1]
3. **Email Verification**: [Delayed until after value per KB1: "delay_heavy_friction_until_after_value"]
4. **Guided Setup**: [Interactive tour or checklist to reach activation event]
5. **Aha Moment**: [User completes activation event - e.g., creates first project]

### Core User Journeys
**Journey 1: [Name]**
- Steps: [List user actions]
- UI Components: [Screens involved]
- Success Criteria: [What indicates completion]

**Journey 2: [Name]**
- [Similar structure]

### Key UI Components (KB1 ui_ux_design)
- **Dashboard**: Succinct summary, alerts, next steps (KB1: must_have)
- **[Feature Screen]**: [Description + KB1 pattern applied]
- **Settings**: Profile, org/team management, billing (KB1: must_have)

### UX Patterns Applied
- **Color Scheme**: 60-30-10 rule (KB1: color_rule)
- **Accessibility**: 44px touch targets, 14pt body text, contrast checked (KB1: accessibility)
- **Responsive**: Mobile-first design (KB1: responsive design)
- **Progressive Disclosure**: Show complexity gradually (KB1: minimize_cognitive_load)

---

## 5. Feature Breakdown

### MVP Features (Weeks 1-4)
Priority: Deliver activation event and core value loop

1. **[Feature 1]**: [Description]
   - **Implementation**: [Tech approach from KB1]
   - **Why MVP**: [RICE score or MoSCoW: Must]
   - **Success Metric**: [How to measure]

2. **[Feature 2]**: [Description]
   - [Similar structure]

[Continue for all MVP features]

### Growth Features (Weeks 5-8)
Priority: Improve retention, enable team collaboration, add integrations

1. **[Feature]**: [Description + scaling approach from KB1]

[List growth features]

### Enterprise Features (Weeks 9-12)
Priority: SSO, advanced RBAC, compliance, custom integrations

1. **[Feature]**: [Description + advanced pattern from KB1]

[List enterprise features]

---

## 6. Business Logic

### User Roles & Permissions (KB1 user_roles_permissions)
**Role Hierarchy**:
- **Owner/Admin**: Full access, billing, team management
- **Member**: Create/edit own content, view org content
- **Guest/Viewer**: Read-only access to specific resources

**RBAC Matrix**:
[Create table showing what each role can do per resource, using KB1 template]

### Pricing Model (KB1 pricing_billing)
**Model**: [Subscription / Usage-based / Tiered / Hybrid]

**Rationale**: [Why this model fits the value metric and KB1 principles]

**Tiers**:
- **Free**: [Limits, features]
- **Pro**: [$X/mo or per-user, features]
- **Business**: [$Y/mo or per-user, features]
- **Enterprise**: [Custom, features]

**Billing Integration**:
- **Provider**: [Stripe/Paddle/Lemon Squeezy from KB1]
- **Webhook Events**: subscription.created, subscription.updated, invoice.paid
- **Grace Period**: 3 days for failed payments (industry standard)

### Integration Requirements
**Third-party APIs**:
- [List APIs needed - e.g., email (SendGrid), SMS (Twilio), analytics (PostHog)]
- **Rationale**: [Why each is needed]

---

## 7. AI Integration (if applicable)

### Use Cases
[Where AI is used in the product - extract from user's Phase 12 answers]

### Model Selection (KB2)
**Primary Model**: [Model name from KB2]
- **Use Case**: [What it's used for]
- **Context Window**: [Tokens from KB2]
- **Pricing**: [$/M tokens from KB2]
- **Rationale**: [Why this model - e.g., "Long context needed for document analysis, Claude Sonnet 4 offers 200k tokens at $3/M input"]

**Secondary Model** (if needed): [Model for different use case]
- [Similar details]

### Cost Estimation
**Assumptions**:
- [Users per day]
- [API calls per user]
- [Average tokens per request]

**Monthly Cost**: [Calculate from KB2 pricing]

**Example**: "1000 users × 10 calls/day × 1000 tokens/call × 30 days = 300M tokens/mo × $3/M = $900/mo for Claude Sonnet 4"

### Integration Architecture
- **API Layer**: [How API is called - server-side vs client-side]
- **Caching**: [Strategy to reduce costs]
- **Rate Limiting**: [User quotas per tier]
- **Fallback**: [What happens if API fails]

### Safety & Moderation (KB2 decision_tips)
- **Content Filtering**: [Use Llama Guard or provider safety layers per KB2]
- **User Content Review**: [Human review for sensitive outputs]

---

## 8. Security & Compliance

### Authentication (KB1 tech_stack_infrastructure)
**Strategy**: [JWT + RLS or OAuth or SSO]

**Implementation**:
- [Provider]: [Specific setup]
- **Session Management**: [JWT expiry, refresh tokens]
- **MFA**: [Required for what roles/plans?]

### Authorization (KB1 user_roles_permissions)
**Approach**: [RLS at database level + RBAC at app level]

**Row Level Security**:
- [PostgreSQL RLS policies per table, filtering by org_id]

**API Authorization**:
- [Middleware to check user permissions before mutations]

### Data Protection
- **Encryption at Rest**: [Database encryption enabled]
- **Encryption in Transit**: [TLS 1.3 for all connections]
- **PII Handling**: [How user data is protected]

### Compliance (KB1 core_product_assumptions)
- **GDPR**: [Data export, right to deletion, consent]
- **CCPA**: [California privacy requirements]
- **SOC 2** (if enterprise): [Compliance roadmap]

---

## 9. Infrastructure & Scaling

### Deployment Strategy (KB1 infrastructure_scaling_best_practices)
**Hosting**: [Provider - e.g., Vercel for Next.js]

**CI/CD**:
- **Pipeline**: [GitHub Actions / GitLab CI]
- **Stages**: Lint → Test → Build → Deploy to staging → Deploy to production
- **Rollback**: [Instant rollback on Vercel/Railway]

### Scaling Plan
**Horizontal Scaling**:
- [Auto-scaling based on CPU/memory thresholds per KB1]
- [Load balancing across multiple instances]

**Database Scaling**:
- [Read replicas for heavy read workloads]
- [Connection pooling (PgBouncer)]
- [Sharding strategy if needed per KB1]

**Caching**:
- [Redis for session data, API responses]
- [CDN for static assets]

### Performance Targets
- **Page Load**: < 2 seconds (KB1 best practice)
- **API Response**: < 500ms for 95th percentile
- **Uptime**: 99.9% SLA

### Monitoring & Observability (KB1 tech_stack_infrastructure)
**Error Tracking**: [Sentry]
**Analytics**: [PostHog / Mixpanel]
**Infrastructure Monitoring**: [Datadog / Grafana]
**Alerts**: [On-call rotation for critical errors]

---

## 10. Implementation Roadmap

### Phase 1: MVP (Weeks 1-4)

**Week 1: Foundation**
- Set up Next.js project with TypeScript
- Configure Supabase (database + auth)
- Implement authentication (sign up, login, logout)
- Set up CI/CD pipeline
- Deploy to staging

**Week 2: Core Features**
- Build [Feature 1] (from MVP feature list)
- Build [Feature 2]
- Implement RLS policies
- Add error tracking (Sentry)

**Week 3: User Experience**
- Implement onboarding flow
- Build dashboard
- Add activation event tracking
- Responsive design polish

**Week 4: Payment & Launch Prep**
- Integrate Stripe/Paddle
- Implement subscription logic
- Set up email notifications
- Load testing
- Beta launch to 10 users

**Success Criteria**: 5 activated users, 0 critical bugs, < 2s page load

### Phase 2: Growth (Weeks 5-8)

**Goals**: Improve retention, add collaboration features, scale infrastructure

**Week 5**: [Growth Feature 1]
**Week 6**: [Growth Feature 2]
**Week 7**: Team collaboration features
**Week 8**: Analytics dashboard, scaling improvements

**Success Criteria**: 100 users, 60% activation rate, 99.5% uptime

### Phase 3: Enterprise (Weeks 9-12)

**Goals**: Enterprise readiness, advanced features, SOC 2 prep

**Week 9**: SSO integration (SAML/OIDC)
**Week 10**: Advanced RBAC, audit logs
**Week 11**: Custom integrations, API for developers
**Week 12**: SOC 2 compliance audit prep

**Success Criteria**: 2 enterprise customers, API documented, security audit passed

---

## 11. Integration Requirements

### Third-party APIs
- **Email**: SendGrid ($0.50/1k emails) for transactional emails
- **Analytics**: PostHog (self-hosted or cloud) for product analytics
- **Payments**: [Stripe/Paddle from earlier section]
- **[Other APIs from user requirements]**

### Webhooks to Implement
- Stripe/Paddle: subscription events
- [Auth provider]: user events
- [Any external services that need to push data]

---

## 12. Risk Mitigation

### Technical Risks (from KB1 pitfalls)
**Risk 1: Over-customizing on platform**
- **Mitigation**: Start with standard Supabase patterns, customize only when validated (KB1: validate_mvp_then_migrate_if_needed)

**Risk 2: Database performance at scale**
- **Mitigation**: Index org_id on all multi-tenant tables (KB1: missing_org_index pitfall), plan for read replicas

**Risk 3: API cost spiraling**
- **Mitigation**: Implement caching, rate limiting per user tier, monitor usage with alerts (KB2: cost modeling)

**Risk 4: Vendor lock-in**
- **Mitigation**: Use open standards where possible (Postgres, OAuth), maintain data export capability (KB1: prefer_open_standards)

### Business Risks
**Risk 1: No product-market fit**
- **Mitigation**: Ship MVP in 4 weeks, get 10 beta users, iterate based on feedback (KB1: ship_early_iterate_relentlessly)

**Risk 2: Competition from larger players**
- **Mitigation**: Focus on niche [specific niche from user answers], move faster than incumbents

### Mitigation Strategies (KB1 conclusion)
- **Feedback Loops**: Implement in-app feedback, weekly user interviews (KB1: feedback_injection_loops)
- **Metrics Tracking**: Track activation, retention, churn from day 1 (KB1: measure_and_iterate)
- **Simplicity**: Cut features ruthlessly to core loop (KB1: simplicity_wins)

---

## NEXT STEPS FOR CLAUDE CODE

This plan is now ready to be transformed into executable documentation:
1. **README.md**: Product overview, getting started, architecture diagram
2. **CLAUDE.md**: Instructions for Claude Code to build this SaaS
3. **Modules**: Separate .md files for auth, api, database, ui, payments
4. **Prompts**: Executable prompts for each major feature implementation

The plan references specific knowledge base principles, applies proven patterns, and provides Claude Code with all the context needed to generate working code.

---

**Total Estimated Timeline**: 12 weeks to enterprise-ready product
**Total Estimated Initial Costs**: [Calculate from infra + AI + tools mentioned]
**Key Success Metrics**: Activation rate, retention, revenue per user

---

END OF BUILDING PLAN

## KNOWLEDGE BASE CONTENT

${kb1}

---

${kb2}`
        },
        {
          role: "user",
          content: `Create a comprehensive SaaS building plan by analyzing these 12-phase workflow answers and synthesizing them with the knowledge base principles, patterns, and best practices.

## CRITICAL INSTRUCTIONS

You are acting as a senior SaaS architect. Your job is to:
1. **Analyze** the user's raw answers to extract their business requirements
2. **Apply** the knowledge base patterns, rules, and examples to their specific use case
3. **Recommend** specific technologies and approaches with clear rationale
4. **Synthesize** everything into a structured, actionable building plan

**DO NOT** simply echo their answers back to them.
**DO** provide deep architectural guidance by referencing specific knowledge base sections.

For example:
- ❌ BAD: "User wants authentication"
- ✅ GOOD: "Implement Supabase Auth with JWT tokens and Row Level Security (KB1: auth section recommends this for B2C products due to cost-effectiveness at $0.00325/MAU and built-in RLS support)"

- ❌ BAD: "User mentioned AI features"
- ✅ GOOD: "For workout plan generation with medium budget, recommend Claude 3.5 Haiku at $0.80/M input tokens (KB2: ideal for richer summaries and moderate analysis, balances quality vs cost compared to GPT-5 Mini at $0.25/M)"

## USER'S 12-PHASE WORKFLOW ANSWERS

${formattedAnswers}

---

Now generate the complete building plan using the structured format provided in the system instructions. Reference specific knowledge base sections throughout to justify every architectural decision.`
        }
      ],
      max_tokens: 4000,
      temperature: 0.7
    })

    const endTime = Date.now()
    const durationSeconds = ((endTime - startTime) / 1000).toFixed(2)

    console.log('[CALL-GPT] GPT-4 response received:', {
      model: completion.model,
      finishReason: completion.choices[0].finish_reason,
      tokensUsed: completion.usage,
      durationSeconds
    })

    const content = completion.choices[0].message.content

    if (!content) {
      console.error('[CALL-GPT] GPT-4 returned empty content')
      throw new Error('GPT-4 returned empty response. Please try again.')
    }

    console.log('[CALL-GPT] GPT-4 response content length:', content.length)

    return content
  } catch (error) {
    console.error('[CALL-GPT] Error calling GPT-4:', error)

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error('GPT-4 request timed out. This plan may be too complex. Please try again.')
      } else if (error.message.includes('rate_limit')) {
        throw new Error('API rate limit reached. Please wait a moment and try again.')
      } else if (error.message.includes('insufficient_quota')) {
        throw new Error('API quota exceeded. Please contact support.')
      } else if (error.message.includes('API key')) {
        throw new Error('API configuration error. Please contact support.')
      }
    }

    throw error
  }
}

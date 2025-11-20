# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **SaaS Blueprint Generator** - a guided workflow platform that transforms SaaS ideas into comprehensive 12-phase blueprints with exportable documentation and Claude Code prompts.

**Stack**: Next.js App Router + Supabase + Claude Code
**AI Models**: GPT-5 (workflow Q&A), Claude Sonnet 4 (plan processing, prompt generation)
**MCP Servers**: supabase, playwright

## Core Architecture

The system is organized into **6 modular components**, each documented in separate .md files under 50KB:

### Module Structure
```
├── Auth Module (Claude-auth.md) - Supabase Auth + subscription validation
├── UI Module (Claude-ui.md) - 12-phase workflow interface with Tailwind
├── API Module (Claude-api.md) - GPT-5 integration + file generation
├── Database Module (Claude-database.md) - Supabase PostgreSQL with RLS
├── AI Integration (Claude-ai.md) - Model orchestration
└── Payments Module (Claude-payments.md) - Stripe subscriptions + EU VAT
```

### Data Flow
```
User Input → 12-Phase Workflow → GPT-5 Processing → Claude Plan Transformation → File Generation → ZIP Export
```

## Critical Constraints

1. **Security First**: All modules must use Supabase RLS for data access
2. **Modular Design**: Split logic across .md modules under 50KB each
3. **No Hardcoded Secrets**: Use environment variables only
4. **Sequential Workflow**: Users cannot skip phases (must complete 1-12 in order)
5. **Subscription Gating**: All blueprint creation requires active subscription

## Development Commands

Since this is a documentation-driven project without traditional build files, development focuses on:

```bash
# Module validation (check .md file sizes)
find .claude/ -name "*.md" -exec wc -c {} \; | awk '{if($1>51200) print "OVERSIZED: " $2 " (" $1 " bytes)"}'

# Content structure validation
grep -r "#### Constraints" .claude/ --count

# Check module references
grep -r "Claude-.*\.md" README.md .claude/
```

## Database Schema

Core tables with UUID primary keys and RLS:
- `profiles` - User data linked to Supabase Auth, subscription tier tracking
  - New columns: `subscription_tier`, `active_projects_limit`, `monthly_exports_count`, `features_enabled` (JSONB)
- `sessions` - Workflow state tracking
- `answers` - Phase response storage
- `outputs` - Generated file content
- `subscription_tier_mapping` - Maps Stripe Price IDs to subscription tiers
- `exports` - Export history for tracking monthly limits

### Database Functions & Triggers

- `set_tier_limits()` - Automatically sets project/export limits based on subscription tier
- `check_project_limit_before_session()` - Validates project limit before session creation
- `user_has_feature()` - Checks if user has access to specific features
- Triggers enforce limits on tier changes and session creation

All tables require RLS policies restricting access to user's own data.

## AI Integration Patterns

### GPT-5 Workflow Engine
- Maintains conversation context across all 12 phases
- Uses system instructions from uploaded playbooks
- Validates answers before phase progression

### Claude Plan Processing  
- Transforms GPT-5 output into modular .md files
- Follows ClaudeOps methodology
- Generates executable Claude Code prompts with MCP references

## File Generation System

**Output Structure**:
```
export.zip/
├── README.md (main project overview)
├── CLAUDE.md (Claude Code instructions)
├── modules/
│   ├── auth/README.md
│   ├── api/README.md
│   └── [other module READMEs]
└── prompts/
    ├── setup-auth.md
    ├── create-api.md
    └── [feature-specific prompts]
```

## Subscription & Access Control

### Multi-Tier Pricing System (GBP)

- **Free**: £0/mo - 1 active project, 3 exports/month
- **Essentials**: £7.99/mo, £79.99/yr - 5 projects, 25 exports/month, advanced prompts
- **Premium**: £14.99/mo, £149.99/yr - 15 projects, unlimited exports, priority support (highlighted tier with ElectricBorder animation)
- **Pro Studio**: £39.99/mo, £399.99/yr - Unlimited projects, API access, team collaboration, white-label
- **Enterprise**: Custom pricing - Unlimited everything, dedicated support, SLA

### Pricing Configuration

- **Location**: `/lib/pricing.config.ts` - Centralized tier definitions, features, and limits
- **Feature Flags**: `/lib/features.ts` - Tier-based access control system
- **Database Schema**: `profiles.subscription_tier`, `subscription_tier_mapping` table
- **Limits Enforcement**: Database triggers automatically set project/export limits based on tier

### Access Control

- **EU VAT Compliance**: Handled via Stripe Tax
- **Grace Period**: 3 days for failed payments
- **Webhook Processing**: Real-time subscription status updates with tier-based limit updates
- **RLS Policies**: Row-level security enforces tier-based access

## UI Components

### Landing Page (`/components/landing/landing-page.tsx`)

- **Auto-hiding Navigation**: Scroll-aware nav bar that hides on scroll down, shows on scroll up
- **Glass Morphism**: Backdrop blur effects with transparent cards throughout
- **Branding**: Uses centralized color scheme from `/branding.config.ts`
- **DotGrid Background**: Interactive dot grid with proximity effects
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

### Pricing Section (`/components/pricing/multi-tier-pricing-section.tsx`)

- **Layout**: 2x2 grid for first 4 tiers + full-width horizontal Enterprise card
- **ElectricBorder Component**: Animated rotating conic gradient border on Premium tier (`/components/ui/ElectricBorder.tsx`)
- **Dynamic Pricing**: Monthly/Annual toggle with 17% annual savings badge
- **Tier Detection**: Shows "Current Plan" badge for user's active tier
- **Readability**: White text with text-shadow on Premium tier for contrast against cyan gradient
- **Features Display**: Checkmarks with tier-specific feature lists

### Design System

- **Colors**: Defined in `/branding.config.ts` - Dark navy (#12141C) with cyan/teal accents (#06b6d4, #14b8a6)
- **Typography**: Inter for body, Space Grotesk for headings, JetBrains Mono for code
- **Animations**: CSS @property for smooth gradient rotations, 200ms transitions
- **Glass Cards**: `backdrop-filter: blur(60px) saturate(200%)` with subtle borders

## Key Business Logic

1. **Phase Progression**: Enforce sequential completion (phases 1-12)
2. **Auto-save**: Save user answers as they type
3. **Export Validation**: All phases must be complete before export
4. **Rate Limiting**: 10 API requests/minute per user
5. **File Bundling**: Use JSZip for export packaging
6. **Tier Limits**: Database-enforced project and export limits per tier
7. **Feature Gating**: Server-side feature access validation via `hasFeature()` function

## MCP Server Usage

- **Supabase MCP**: Database operations, auth management, storage
- **Playwright MCP**: UI testing and automation (if applicable)

When implementing features, always reference the corresponding module .md file for detailed constraints, state flows, and business rules.
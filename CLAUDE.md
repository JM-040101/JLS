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
- `profiles` - User data linked to Supabase Auth
- `sessions` - Workflow state tracking  
- `answers` - Phase response storage
- `outputs` - Generated file content

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

- **Single Tier**: Pro £14.99/mo (annual discount available)
- **EU VAT Compliance**: Handled via Stripe Tax
- **Grace Period**: 3 days for failed payments
- **Webhook Processing**: Real-time subscription status updates

## Key Business Logic

1. **Phase Progression**: Enforce sequential completion (phases 1-12)
2. **Auto-save**: Save user answers as they type
3. **Export Validation**: All phases must be complete before export
4. **Rate Limiting**: 10 API requests/minute per user
5. **File Bundling**: Use JSZip for export packaging

## MCP Server Usage

- **Supabase MCP**: Database operations, auth management, storage
- **Playwright MCP**: UI testing and automation (if applicable)

When implementing features, always reference the corresponding module .md file for detailed constraints, state flows, and business rules.
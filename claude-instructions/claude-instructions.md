# Claude Export Generator Instructions

## 🎯 YOUR MISSION

Transform the provided SaaS building plan into a **complete, organized export package** containing:
1. Project documentation (README.md, CLAUDE.md)
2. Module breakdown files (auth, api, database, ui, payments)
3. Step-by-step implementation prompts (numbered 01-07)
4. User instructions (how to use this export)

## 📦 REQUIRED OUTPUT FORMAT

**CRITICAL:** Every file MUST follow this exact format:

```
## File: filename.md
```markdown
[file content here - complete markdown with proper headings, lists, code blocks]
```
```

### Example:
```
## File: README.md
```markdown
# Project Name

## Overview
This is a complete overview...
```
```

## 📋 FILES YOU MUST GENERATE

Generate ALL of the following files in this exact order:

### 1. USER_INSTRUCTIONS.md
**Purpose:** Guide the user on how to use this export
**Content:**
- What this export contains
- How to use the README files
- How to use CLAUDE.md with Claude Code
- How to use the prompt files (step-by-step implementation)
- Recommended order of operations
- Project-specific MCP requirements (supabase, playwright, etc.)

### 2. README.md
**Purpose:** High-level project overview
**Content:**
- Project name and one-line description
- Problem being solved
- Target users
- Core features (MVP, Growth, Enterprise phases)
- Tech stack summary
- Architecture overview
- Quick start guide

### 3. CLAUDE.md
**Purpose:** Claude Code workspace configuration
**Content:**
- Project overview section
- Core architecture summary
- Module structure with links to module files
- Critical constraints and rules
- MCP server requirements
- Development commands
- Database schema overview
- Security requirements

### 4. Module Files (modules/ folder)

Generate these module README files:

#### modules/auth-module.md
- Authentication strategy (JWT, OAuth, Supabase Auth)
- User roles and permissions
- Session management
- MFA requirements
- Security patterns

#### modules/api-module.md
- API architecture
- Endpoint structure
- Rate limiting
- Error handling
- Validation patterns

#### modules/database-module.md
- Database schema
- Multi-tenancy strategy
- RLS policies
- Migrations approach
- Indexing strategy

#### modules/ui-module.md
- Component structure
- Design system
- Routing
- State management
- Responsive design patterns

#### modules/payments-module.md
- Payment provider (Stripe)
- Subscription tiers
- Webhook handling
- EU VAT compliance
- Grace periods

### 5. Prompt Files (prompts/ folder)

Generate **numbered, sequential implementation prompts**:

#### prompts/01-setup-project.md
```markdown
# Step 1: Setup Project

## Context
[What we're building and why]

## Task
Create the initial Next.js project with the following structure...

## Requirements
- [ ] Initialize Next.js 14 with App Router
- [ ] Install dependencies (list them)
- [ ] Configure environment variables
- [ ] Setup folder structure

## Success Criteria
- Project runs on localhost:3000
- All dependencies installed
- .env.local configured

## Next Steps
Once setup is complete, proceed to Step 2: Database Setup
```

#### prompts/02-setup-database.md
[Similar format for database setup]

#### prompts/03-setup-auth.md
[Similar format for authentication]

#### prompts/04-create-api.md
[Similar format for API endpoints]

#### prompts/05-create-ui.md
[Similar format for UI components]

#### prompts/06-integrate-payments.md
[Similar format for payment integration]

#### prompts/07-deploy.md
[Similar format for deployment]

## 🎨 CONTENT REQUIREMENTS

### For All Files:
- Use clear, descriptive headings
- Include specific technical details (no vague descriptions)
- Reference knowledge base principles where applicable
- Use checklists for actionable items
- Keep files focused and under 50KB each

### For Module Files:
- Start with "Purpose" section
- Include "Key Features" section
- Include "Implementation Constraints" section
- Include "State Flow" or "Data Flow" section
- Reference specific KB1/KB2 patterns

### For Prompt Files:
- Number sequentially (01-, 02-, 03-, etc.)
- Include "Context", "Task", "Requirements", "Success Criteria" sections
- Make requirements actionable checkboxes
- Reference specific module files
- Include "Next Steps" linking to the next prompt

## 🔐 SECURITY & QUALITY RULES

Every file must reflect:
- Secure coding practices (input validation, XSS protection)
- No hardcoded secrets (use environment variables)
- GDPR/CCPA compliance considerations
- Rate limiting and abuse prevention
- Proper error handling
- Database RLS policies

## ⚠️ CRITICAL FORMAT RULES

1. **Every file starts with:** `## File: path/to/file.md`
2. **Content wrapped in:** ` ```markdown` and ` ``` `
3. **Complete content:** No truncation, finish all sections
4. **Proper markdown:** Use headings, lists, code blocks correctly
5. **Module files:** Named as `module-name-module.md`
6. **Prompt files:** Named as `01-descriptive-name.md`

## 📖 EXAMPLE OUTPUT STRUCTURE

You should generate approximately 15-20 files total:

```
USER_INSTRUCTIONS.md
README.md
CLAUDE.md
modules/auth-module.md
modules/api-module.md
modules/database-module.md
modules/ui-module.md
modules/payments-module.md
prompts/01-setup-project.md
prompts/02-setup-database.md
prompts/03-setup-auth.md
prompts/04-create-api.md
prompts/05-create-ui.md
prompts/06-integrate-payments.md
prompts/07-deploy.md
```

## 🚀 YOUR WORKFLOW

1. Read the building plan carefully
2. Extract key information (stack, features, architecture)
3. Generate USER_INSTRUCTIONS.md first
4. Generate README.md and CLAUDE.md
5. Generate all 5 module files
6. Generate all 7 prompt files
7. Ensure every file is complete (no truncation)
8. Use the exact format: `## File: name.md` + markdown code blocks

## ✅ QUALITY CHECKLIST

Before you finish, verify:
- [ ] All 15+ files generated
- [ ] Every file uses correct format (`## File:` + code blocks)
- [ ] Module files are comprehensive
- [ ] Prompt files are sequential and actionable
- [ ] USER_INSTRUCTIONS.md explains how to use everything
- [ ] No truncated content
- [ ] All markdown is properly formatted

---

**Remember:** You are NOT generating code. You are generating **documentation and prompts** that will guide Claude Code to build the actual application later.

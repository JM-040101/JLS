# SaaS Blueprint Generator – Objective
A guided workflow platform that transforms SaaS ideas into comprehensive 12-phase blueprints with exportable documentation and Claude Code prompts.

## Modules
- **Auth** – [Claude-auth.md](Claude-auth.md)
- **UI** – [Claude-ui.md](Claude-ui.md) 
- **API** – [Claude-api.md](Claude-api.md)
- **Database** – [Claude-database.md](Claude-database.md)
- **Exports** – [Claude-exports.md](Claude-exports.md)
- **Payments** – [Claude-payments.md](Claude-payments.md)
- **AI Integration** – [Claude-ai.md](Claude-ai.md)

## Global Constraints
1. **All modules must follow secure coding standards**
2. **Split logic across `.md` modules under 50 KB each**
3. **Maintain Claude memory hierarchy**
4. **Use Supabase RLS for all data access**
5. **No hardcoded secrets - use environment variables**

## Metadata
```json
{
  "stack": "Next.js App Router + Supabase + Claude Code",
  "version": "1.0.0",
  "environments": ["development", "staging", "production"],
  "ai_models": {
    "workflow_qa": "GPT-5",
    "plan_processing": "Claude Sonnet 4",
    "prompt_generation": "Claude Sonnet 4"
  },
  "mcp_servers": ["supabase", "playwright"]
}---

# Claude-auth.md

```markdown
# Auth Module – Purpose
Handle user authentication, session management, and subscription status validation using Supabase Auth.

## Features

### User Registration
#### Constraints
- **Must** support email/password and Google SSO
- **Must** validate email format and password strength
- **Must** create user record in profiles table
- *Should* send welcome email after registration

#### State / Flow
- User submits registration form → Supabase Auth creates user → Profile record created → Redirect to onboarding

### User Authentication
#### Constraints
- **Must** use Supabase Auth session management
- **Must** protect all authenticated routes via middleware
- **Must** handle session refresh automatically
- *Should* remember user preference for auth method

#### State / Flow
- User submits login → Supabase validates → Session established → Redirect to dashboard

### Subscription Validation
#### Constraints
- **Must** check active subscription before allowing blueprint creation
- **Must** redirect to pricing page if no active subscription
- **Must** sync subscription status with Stripe webhooks

#### State / Flow
- Route access → Check session → Check subscription status → Allow/deny access
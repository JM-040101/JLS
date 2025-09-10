# API Module – Purpose
Handle GPT-5 integration for workflow Q&A, Claude integration for plan processing, and file generation.

## Features

### Workflow API Endpoints
#### Constraints
- **Must** integrate with GPT-5 for phase questions and answers
- **Must** validate user subscription before API access
- **Must** implement rate limiting (10 requests/minute per user)
- **Must** log all API calls for monitoring

#### State / Flow
- `/api/phases/{phase_id}/questions` → Return structured questions
- `/api/phases/{phase_id}/answers` → Save user responses
- `/api/workflow/generate-plan` → Process all answers via GPT-5

### Claude Integration Endpoints
#### Constraints
- **Must** use Claude Sonnet 4 for plan transformation
- **Must** follow ClaudeOps methodology from uploaded playbooks
- **Must** generate modular .md files under 50KB each
- **Must** create executable prompts for Claude Code

#### State / Flow
- Receive GPT-5 plan → Parse into modules → Generate Claude.md + module files → Create system prompts

### File Generation API
#### Constraints
- **Must** generate README.md and sub-README files
- **Must** create Claude Code prompts with MCP server references
- **Must** bundle all files with JSZip
- **Must** store exports in Supabase Storage

#### State / Flow
- Plan processed → Generate file structure → Create ZIP → Upload to storage → Return download link
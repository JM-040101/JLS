# AI Integration Module – Purpose
Orchestrate GPT-5 for workflow Q&A and Claude Sonnet 4 for plan transformation.

## Features

### GPT-5 Workflow Engine
#### Constraints
- **Must** use system instructions from uploaded playbook
- **Must** reference Expanded SaaS Playbook knowledge
- **Must** maintain conversation context across phases
- **Must** validate answers before proceeding to next phase

#### State / Flow
- Phase start → Load questions → Present to user → Validate answers → Progress to next

### Claude Plan Processing
#### Constraints
- **Must** use Claude Sonnet 4 for document generation
- **Must** follow ClaudeOps and DevBook methodologies
- **Must** generate modular .md files with proper hierarchy
- **Must** create executable prompts with MCP server references

#### State / Flow
- Receive 12-phase plan → Parse structure → Apply templates → Generate Claude-native files

### Model Configuration
#### Constraints
- **Must** implement proper error handling and retries
- **Must** log all API calls and costs
- **Must** implement rate limiting per user tier
- *Should* cache common responses to reduce costs

#### State / Flow
- API call → Check rate limits → Call model → Process response → Log metrics
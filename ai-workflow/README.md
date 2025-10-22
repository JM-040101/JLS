# AI Workflow Configuration Guide

This directory contains the configuration files that guide the AI through the 12-phase SaaS blueprint creation workflow.

## Directory Structure

```
ai-workflow/
├── 12-phase-workflow-instructions.md  # Main workflow instructions for all 12 phases
├── knowledge-base-1.md                # First knowledge base reference file
├── knowledge-base-2.md                # Second knowledge base reference file
└── README.md                          # This file
```

## Setup Instructions

### 1. Add Your Workflow Instructions

Open `12-phase-workflow-instructions.md` and paste your complete 12-phase workflow instructions below the template section.

**What to include:**
- Detailed instructions for each of the 12 phases
- Questions the AI should ask at each phase
- Validation criteria for each phase
- Conversation flow and guidance
- Tone and style guidelines

### 2. Add Knowledge Base Files

#### Knowledge Base 1 (`knowledge-base-1.md`)
Add your primary reference materials:
- Frameworks and methodologies
- Best practices
- Templates
- Industry insights
- Success patterns

#### Knowledge Base 2 (`knowledge-base-2.md`)
Add supplementary reference materials:
- Additional frameworks
- Advanced techniques
- Case studies
- Domain expertise
- Supporting documentation

### 3. Validate Configuration

Once you've added your content, validate the configuration:

```bash
# Test the API endpoint
curl http://localhost:3001/api/ai/instructions/validate -X POST

# Get instructions for a specific phase
curl http://localhost:3001/api/ai/instructions?phase=1
```

You should see a response indicating all files are properly configured.

### 4. Integration with AI Models

The system is designed to work with either:
- **GPT-5** (OpenAI) - for workflow Q&A
- **Claude Sonnet 4** (Anthropic) - for plan processing

To integrate:

1. Add your API keys to `.env.local`:
```env
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

2. The AI instructions will be automatically loaded and used as system prompts

3. The workflow page will use these instructions to guide users through all 12 phases

## How It Works

### System Prompt Generation

When a user is in a specific phase (e.g., Phase 3), the system:

1. Loads `12-phase-workflow-instructions.md`
2. Loads `knowledge-base-1.md` and `knowledge-base-2.md`
3. Combines them into a comprehensive system prompt
4. Adds user's project context (app name, description, current phase)
5. Sends this as the system prompt to the AI model

### API Endpoints

#### `GET /api/ai/instructions`
- Returns all loaded instructions
- Query param: `?phase=N` - Get phase-specific system prompt
- Used by the AI integration

#### `POST /api/ai/instructions/validate`
- Validates that all instruction files are properly configured
- Returns missing or empty files
- Used for health checks

#### `POST /api/ai/chat`
- Main endpoint for AI conversations during workflow
- Receives: sessionId, phase, message, conversationHistory
- Returns: AI response using the configured instructions
- Validates user permissions and session ownership

## File Requirements

### Minimum Content Length
Each file should contain at least 100 characters of actual content (not just template placeholders).

### Content Guidelines

**Workflow Instructions:**
- Be specific about each phase's objectives
- Include example questions
- Define clear completion criteria
- Specify validation requirements

**Knowledge Base:**
- Include real examples and case studies
- Provide actionable frameworks
- Use clear, structured formatting
- Reference credible sources

## Validation Status

The system checks for:
- ✅ File exists
- ✅ File is not empty (>100 characters)
- ✅ File doesn't contain template placeholders like "PASTE YOUR"

If validation fails:
- The `/api/ai/chat` endpoint will return 503 Service Unavailable
- The error response will list missing or incomplete files
- Users will see a message to configure AI instructions

## Testing

After adding your content:

1. **Validate Configuration:**
   ```bash
   curl -X POST http://localhost:3001/api/ai/instructions/validate
   ```

2. **Check Phase Instructions:**
   ```bash
   curl http://localhost:3001/api/ai/instructions?phase=1
   ```

3. **Test AI Chat (requires active session):**
   ```bash
   curl -X POST http://localhost:3001/api/ai/chat \
     -H "Content-Type: application/json" \
     -d '{
       "sessionId": "your-session-id",
       "phase": 1,
       "message": "What should I focus on in this phase?"
     }'
   ```

## Troubleshooting

### "AI instructions not configured" Error
- Check that all 3 files have content
- Ensure content is more than 100 characters
- Remove any "PASTE YOUR" template text

### Instructions Not Loading
- Check file permissions
- Verify file paths are correct
- Check server logs for file read errors

### AI Responses Don't Follow Instructions
- Verify the system prompt includes your instructions
- Check that instructions are clear and specific
- Test with the `/api/ai/instructions?phase=N` endpoint

## Next Steps

1. ✅ Add your workflow instructions to `12-phase-workflow-instructions.md`
2. ✅ Add knowledge base content to `knowledge-base-1.md` and `knowledge-base-2.md`
3. ✅ Run validation endpoint to confirm setup
4. ✅ Integrate AI API (GPT-5 or Claude Sonnet 4) in `/app/api/ai/chat/route.ts`
5. ✅ Test the complete workflow with a real session

---

**Questions or issues?** The validation endpoint will provide detailed feedback on what's missing or misconfigured.

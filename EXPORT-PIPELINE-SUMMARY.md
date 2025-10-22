# Export Pipeline - Quick Reference

## Overview

This export feature transforms 12-phase workflow answers into a complete SaaS development blueprint using a two-AI pipeline:

1. **GPT-5** processes answers → creates building plan
2. **Claude Sonnet 4** processes plan → generates export files

## File Structure

```
/workspaces/JLS/
│
├── 📚 ai-workflow/                  # FOR GPT-5 (add your instructions)
│   ├── knowledge-base-1.md          # ✅ Exists - fill in your plan format
│   └── knowledge-base-2.md          # ✅ Exists - fill in ClaudeOps rules
│
├── 🤖 claude-instructions/          # FOR CLAUDE SONNET 4 (add your content)
│   ├── claude-instructions.md       # ✏️ Add your Claude instructions
│   ├── claude-knowledge-base-1.md   # ✏️ Add your knowledge base 1
│   └── claude-knowledge-base-2.md   # ✏️ Add your knowledge base 2
│
└── 📖 README-EXPORT-PIPELINE.md     # Full implementation guide
```

## Pipeline Flow

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: User Completes 12 Phases                           │
│ ↓ Answers stored in Supabase                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: User Clicks "Export"                               │
│ ↓ Triggers /api/export endpoint                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: GPT-5 Processing                                   │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Input:  12 phase answers                            │   │
│ │ Uses:   gpt5-knowledge-base-1.md                    │   │
│ │         gpt5-knowledge-base-2.md                    │   │
│ │ Output: Structured SaaS building plan               │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Claude Sonnet 4 Processing                         │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Input:  Building plan from GPT-5                    │   │
│ │ Uses:   system-prompt.md                            │   │
│ │         file-templates.md                           │   │
│ │         example-transformation.md                   │   │
│ │ Output: Complete file set:                          │   │
│ │         • README.md                                 │   │
│ │         • CLAUDE.md                                 │   │
│ │         • modules/*.md                              │   │
│ │         • prompts/*.md                              │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Bundle with JSZip                                  │
│ ↓ All files packaged into saas-blueprint.zip              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: User Downloads ZIP                                 │
│ ↓ Complete project blueprint ready to use                  │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start Checklist

### Phase 1: Prepare Knowledge Bases
- [ ] Fill in `ai-workflow/knowledge-base-1.md` with your plan format
- [ ] Fill in `ai-workflow/knowledge-base-2.md` with ClaudeOps rules
- [ ] Upload both files to OpenAI GPT-5 project as knowledge bases

### Phase 2: Prepare Claude Instructions
- [ ] Fill in `claude-instructions/claude-instructions.md` with your transformation instructions
- [ ] Fill in `claude-instructions/claude-knowledge-base-1.md` with your knowledge base content
- [ ] Fill in `claude-instructions/claude-knowledge-base-2.md` with your knowledge base content

### Phase 3: Set Up Environment
- [ ] Add `OPENAI_API_KEY` to `.env`
- [ ] Add `ANTHROPIC_API_KEY` to `.env`
- [ ] Verify both API keys work

### Phase 4: Implement API Route
- [ ] Create `app/api/export/route.ts`
- [ ] Implement Step 1: Fetch phase answers from Supabase
- [ ] Implement Step 2: Call GPT-5 with answers + knowledge bases
- [ ] Implement Step 3: Call Claude with plan + instructions
- [ ] Implement Step 4: Parse Claude output into files
- [ ] Implement Step 5: Bundle files with JSZip
- [ ] Implement Step 6: Return ZIP to user

### Phase 5: Test
- [ ] Create test session with sample 12-phase answers
- [ ] Call `/api/export` endpoint
- [ ] Verify ZIP downloads successfully
- [ ] Extract and review generated files
- [ ] Check file structure matches expected format
- [ ] Validate links between files work

### Phase 6: Add Production Features
- [ ] Add rate limiting (5 exports/day per user)
- [ ] Add export history tracking in Supabase
- [ ] Add error handling for API failures
- [ ] Add loading states in UI
- [ ] Add success/error notifications

## API Implementation Code Snippets

### Basic Route Structure

```typescript
// app/api/export/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import JSZip from 'jszip';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function POST(req: Request) {
  try {
    // 1. Authenticate
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get session ID from request
    const { sessionId } = await req.json();

    // 3. Fetch phase answers
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('phase, content')
      .eq('session_id', sessionId)
      .order('phase', { ascending: true });

    if (answersError || !answers || answers.length !== 12) {
      return NextResponse.json(
        { error: 'Incomplete workflow. Complete all 12 phases first.' },
        { status: 400 }
      );
    }

    // 4. Call GPT-5
    const buildingPlan = await callGPT5(answers);

    // 5. Call Claude
    const files = await callClaude(buildingPlan);

    // 6. Create ZIP
    const zipBuffer = await createZip(files);

    // 7. Track export
    await supabase.from('exports').insert({
      user_id: user.id,
      session_id: sessionId
    });

    // 8. Return ZIP
    return new Response(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="saas-blueprint.zip"'
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Export failed. Please try again.' },
      { status: 500 }
    );
  }
}
```

### Helper Functions

See `README-EXPORT-PIPELINE.md` for complete implementations of:
- `callGPT5(answers)` - Format answers and call OpenAI API
- `callClaude(plan)` - Load instructions and call Anthropic API
- `createZip(files)` - Bundle files with JSZip
- `parseClaudeOutput(content)` - Extract files from Claude response

## Environment Variables

```bash
# OpenAI (for GPT-5)
OPENAI_API_KEY=sk-...

# Anthropic (for Claude Sonnet 4)
ANTHROPIC_API_KEY=sk-ant-...

# Supabase (for data)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Expected Export Structure

When a user exports their blueprint, they receive:

```
saas-blueprint.zip
├── README.md                    # Project overview, setup, roadmap
├── CLAUDE.md                    # Claude Code instructions
├── modules/                     # Module documentation
│   ├── auth/README.md
│   ├── database/README.md
│   ├── api/README.md
│   ├── ui/README.md
│   ├── payments/README.md
│   └── [other-modules]/README.md
└── prompts/                     # Claude Code prompts
    ├── 01-setup-project.md
    ├── 02-setup-database.md
    ├── 03-implement-auth.md
    ├── 04-[feature].md
    └── ...
```

## Troubleshooting

### GPT-5 Issues
- **Problem**: Inconsistent output format
- **Solution**: Add more examples to knowledge bases, use structured output

### Claude Issues
- **Problem**: Incomplete file generation
- **Solution**: Increase max_tokens, add explicit file boundaries

### ZIP Issues
- **Problem**: Download fails
- **Solution**: Check file size limits, ensure proper buffer handling

### Rate Limiting Issues
- **Problem**: Users hitting limits
- **Solution**: Check exports table, implement 24-hour rolling window

## Testing Tips

1. **Start Small**: Test with minimal 12-phase answers first
2. **Check Each Step**: Test GPT-5 and Claude separately before combining
3. **Validate Structure**: Use a test harness to verify file structure
4. **Review Quality**: Manually review generated files for quality
5. **Test Edge Cases**: Long answers, special characters, missing phases

## Resources

- **Full Documentation**: `README-EXPORT-PIPELINE.md`
- **GPT-5 Knowledge Bases**: `knowledge-bases/`
- **Claude Instructions**: `claude-instructions/`
- **OpenAI Docs**: https://platform.openai.com/docs
- **Anthropic Docs**: https://docs.anthropic.com
- **JSZip Docs**: https://stuk.github.io/jszip/

---

**Status**: ✅ All instruction files created and ready to use
**Next**: Fill in knowledge bases and implement `/api/export`

# Export Pipeline Documentation

## Overview
This document explains how the 12-phase workflow answers are transformed into a complete project export ZIP.

## Pipeline Flow

```
User Completes 12 Phases
         ↓
    [Phase Answers Stored in Supabase]
         ↓
    User Clicks "Export"
         ↓
    [API Route: /api/export]
         ↓
GPT-5 Processes Answers → Building Plan
         ↓
Claude Sonnet 4 Transforms Plan
         ↓
    [Generates Files]
    ├── README.md
    ├── CLAUDE.md
    ├── modules/*.md
    └── prompts/*.md
         ↓
    [JSZip Bundles Files]
         ↓
    [ZIP Downloaded to User]
```

## Knowledge Base Files

### For GPT-5 (Creates Building Plan)

These files teach GPT-5 how to transform 12-phase answers into a structured building plan:

1. **`ai-workflow/knowledge-base-1.md`**
   - **Purpose**: Teaches GPT-5 how to structure the SaaS building plan
   - **Upload to**: OpenAI GPT-5 project/assistant (knowledge base)
   - **Used for**: Defining output format for building plans
   - **Status**: ✅ Already exists - add your instructions here

2. **`ai-workflow/knowledge-base-2.md`**
   - **Purpose**: Teaches GPT-5 the ClaudeOps methodology
   - **Upload to**: OpenAI GPT-5 project/assistant (knowledge base)
   - **Used for**: Ensuring plan follows Claude-friendly patterns
   - **Status**: ✅ Already exists - add your instructions here

### For Claude Sonnet 4 (Generates Export Files)

These files instruct Claude how to transform the building plan into exportable files:

3. **`claude-instructions/claude-instructions.md`**
   - **Purpose**: Main system instructions for Claude
   - **Upload to**: Use in API route that calls Anthropic API (system message)
   - **Status**: ✏️ Add your instructions here

4. **`claude-instructions/claude-knowledge-base-1.md`**
   - **Purpose**: First knowledge base for Claude file generation
   - **Upload to**: Use in API route or upload to Claude project
   - **Status**: ✏️ Add your knowledge base content here

5. **`claude-instructions/claude-knowledge-base-2.md`**
   - **Purpose**: Second knowledge base for Claude file generation
   - **Upload to**: Use in API route or upload to Claude project
   - **Status**: ✏️ Add your knowledge base content here

## API Implementation

### Endpoint: `/api/export`

```typescript
// High-level flow
export async function POST(req: Request) {
  // 1. Authenticate user
  // 2. Fetch all 12 phase answers from Supabase
  // 3. Call GPT-5 with answers + knowledge bases
  // 4. Get building plan from GPT-5
  // 5. Call Claude Sonnet 4 with plan + transformation instructions
  // 6. Parse Claude's output into files
  // 7. Bundle files with JSZip
  // 8. Return ZIP file
}
```

### Step 1: Fetch Phase Answers
```typescript
const { data: answers } = await supabase
  .from('answers')
  .select('phase, content')
  .eq('session_id', sessionId)
  .order('phase', { ascending: true });
```

### Step 2: Call GPT-5
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const completion = await openai.chat.completions.create({
  model: "gpt-5", // or appropriate model name
  messages: [
    {
      role: "system",
      content: knowledgeBase1 + "\n\n" + knowledgeBase2
    },
    {
      role: "user",
      content: formatAnswersForGPT(answers)
    }
  ]
});

const buildingPlan = completion.choices[0].message.content;
```

### Step 3: Call Claude Sonnet 4
```typescript
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Load Claude instruction files
const claudeInstructions = readFileSync(
  join(process.cwd(), 'claude-instructions/claude-instructions.md'),
  'utf-8'
);

const claudeKnowledgeBase1 = readFileSync(
  join(process.cwd(), 'claude-instructions/claude-knowledge-base-1.md'),
  'utf-8'
);

const claudeKnowledgeBase2 = readFileSync(
  join(process.cwd(), 'claude-instructions/claude-knowledge-base-2.md'),
  'utf-8'
);

// Combine instructions for Claude
const fullInstructions = `${claudeInstructions}

---

# Knowledge Base 1

${claudeKnowledgeBase1}

---

# Knowledge Base 2

${claudeKnowledgeBase2}`;

const message = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 8000, // Increased for generating multiple files
  system: fullInstructions,
  messages: [
    {
      role: "user",
      content: `Please transform this building plan into a complete project export.

# Building Plan

${buildingPlan}

Generate all required files following your instructions and knowledge bases.`
    }
  ]
});

const generatedFiles = parseClaudeOutput(message.content);
```

### Step 4: Bundle with JSZip
```typescript
import JSZip from 'jszip';

const zip = new JSZip();

// Add files to ZIP
zip.file("README.md", generatedFiles.readme);
zip.file("CLAUDE.md", generatedFiles.claude);

// Add module READMEs
for (const [moduleName, content] of Object.entries(generatedFiles.modules)) {
  zip.file(`modules/${moduleName}/README.md`, content);
}

// Add prompts
for (const [promptName, content] of Object.entries(generatedFiles.prompts)) {
  zip.file(`prompts/${promptName}.md`, content);
}

// Generate ZIP buffer
const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

return new Response(zipBuffer, {
  headers: {
    'Content-Type': 'application/zip',
    'Content-Disposition': 'attachment; filename="saas-blueprint.zip"'
  }
});
```

## File Parsing Strategy

Claude's output needs to be parsed into individual files. Expected format:

```markdown
## File: README.md
```markdown
[content here]
```

## File: CLAUDE.md
```markdown
[content here]
```

## File: modules/auth/README.md
```markdown
[content here]
```
```

### Parser Function
```typescript
function parseClaudeOutput(content: string) {
  const files = {
    readme: '',
    claude: '',
    modules: {},
    prompts: {}
  };

  const fileMatches = content.matchAll(/## File: (.+?)\n```(?:markdown)?\n([\s\S]+?)\n```/g);

  for (const match of fileMatches) {
    const filePath = match[1];
    const fileContent = match[2];

    if (filePath === 'README.md') {
      files.readme = fileContent;
    } else if (filePath === 'CLAUDE.md') {
      files.claude = fileContent;
    } else if (filePath.startsWith('modules/')) {
      const moduleName = filePath.split('/')[1];
      files.modules[moduleName] = fileContent;
    } else if (filePath.startsWith('prompts/')) {
      const promptName = filePath.split('/')[1].replace('.md', '');
      files.prompts[promptName] = fileContent;
    }
  }

  return files;
}
```

## Testing Strategy

### Unit Tests
- Test answer formatting for GPT-5
- Test Claude output parsing
- Test ZIP generation

### Integration Tests
- Test full pipeline with sample answers
- Verify ZIP structure
- Validate file contents

### Manual Testing
1. Complete all 12 phases
2. Click export
3. Download ZIP
4. Extract and verify:
   - README.md is present and formatted
   - CLAUDE.md has project instructions
   - All modules have READMEs
   - Prompts are numbered and complete
   - No broken links between files

## Environment Variables Required

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## Error Handling

```typescript
try {
  // Pipeline steps
} catch (error) {
  if (error.code === 'rate_limit_exceeded') {
    return NextResponse.json(
      { error: 'Too many exports. Please try again in a minute.' },
      { status: 429 }
    );
  }

  if (error.code === 'insufficient_tokens') {
    return NextResponse.json(
      { error: 'Your answers are too long. Please shorten them.' },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { error: 'Export failed. Please try again.' },
    { status: 500 }
  );
}
```

## Rate Limiting

Implement rate limiting on `/api/export`:
- 5 exports per day per user
- Store in Supabase `exports` table

```sql
CREATE TABLE exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  session_id UUID REFERENCES sessions(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS policies
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exports"
  ON exports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create exports"
  ON exports FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## File Organization Summary

```
/workspaces/JLS/
├── knowledge-bases/              # For GPT-5 (upload to OpenAI)
│   ├── gpt5-knowledge-base-1.md  # Building plan structure
│   └── gpt5-knowledge-base-2.md  # ClaudeOps methodology
│
├── claude-instructions/          # For Claude Sonnet 4 (use in API)
│   ├── system-prompt.md          # Main system prompt
│   ├── file-templates.md         # Templates for all file types
│   └── example-transformation.md # Complete example
│
├── prompts-config/               # Legacy (can be removed)
│   └── claude-transformation-instructions.md
│
└── README-EXPORT-PIPELINE.md     # This file
```

## Next Steps

### 1. Fill in Knowledge Bases for GPT-5

Edit these files with your specific instructions:
- `knowledge-bases/gpt5-knowledge-base-1.md` - Add your building plan format
- `knowledge-bases/gpt5-knowledge-base-2.md` - Add your ClaudeOps rules

Then upload both to your OpenAI GPT-5 project as knowledge base files.

### 2. Customize Claude Instructions (Optional)

The Claude instruction files are ready to use, but you can customize:
- `claude-instructions/system-prompt.md` - Adjust rules and quality standards
- `claude-instructions/file-templates.md` - Modify templates to match your style
- `claude-instructions/example-transformation.md` - Replace with your own example

### 3. Implement API Route

Create `/api/export` with the pipeline logic:
```bash
# Create the file
mkdir -p app/api/export
touch app/api/export/route.ts
```

Use the code examples from the "API Implementation" section above.

### 4. Test the Pipeline

Test with sample data:
```bash
# 1. Create a test session with 12 phase answers
# 2. Call /api/export endpoint
# 3. Verify ZIP structure and content
# 4. Extract and review generated files
```

### 5. Add Rate Limiting

Implement export limits per user (5 exports per day recommended).

### 6. Deploy

Test in production with real workflow data.

## Troubleshooting

### Issue: GPT-5 output is inconsistent
**Solution**: Add more examples to knowledge bases, use structured output format

### Issue: Claude generates incomplete files
**Solution**: Increase max_tokens, add explicit file boundaries in transformation instructions

### Issue: ZIP download fails
**Solution**: Check file size limits, ensure proper buffer handling

### Issue: Links between files are broken
**Solution**: Validate relative paths in parser, ensure consistent directory structure

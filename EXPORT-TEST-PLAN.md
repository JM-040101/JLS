# Export Pipeline Test Plan

## Current Status

✅ **Dev server running**: http://localhost:3000
✅ **Landing page accessible**: Homepage loads correctly
✅ **Workflow pages exist**: `/workflow/[id]` and `/workflow/new`
✅ **Export page exists**: `/export/[id]`

## Blockers Identified

### 1. Authentication Required
- Workflow requires `requireSubscription()` check
- Need to create test account or use existing credentials
- Supabase authentication must be configured

### 2. Export API Not Implemented
- Need to create `/api/export/route.ts`
- This is the core missing piece for the pipeline

### 3. Database Setup
- Need to verify tables exist:
  - `sessions` - Workflow sessions
  - `answers` - Phase answers (need 12 phases)
  - `phase_templates` - Question templates
  - `profiles` - User data
  - `exports` - Export tracking (may need to create)

## Test Workflow Steps

### Phase 1: Setup (Manual - User Action Required)

```bash
# 1. Verify environment variables
cat .env | grep -E "(SUPABASE|OPENAI|ANTHROPIC)"

# 2. Check if test user exists in Supabase
# Visit Supabase dashboard → Authentication → Users

# 3. Create test user OR use existing credentials
```

### Phase 2: Database Verification

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Check phase templates (should have 12)
SELECT COUNT(*) FROM phase_templates;

-- Create exports table if missing
CREATE TABLE IF NOT EXISTS exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  session_id UUID REFERENCES sessions(id),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exports"
  ON exports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create exports"
  ON exports FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Phase 3: Create Test Session

Using Playwright (once authenticated):

```javascript
// 1. Navigate to /workflow/new
await page.goto('http://localhost:3000/workflow/new');

// 2. Fill in 12 phases with simple test answers
const testAnswers = [
  { phase: 1, answer: "Task management app for remote teams" },
  { phase: 2, answer: "Remote teams of 5-50 people" },
  { phase: 3, answer: "Projects, tasks, assignments, real-time updates" },
  { phase: 4, answer: "Next.js 14, Supabase, Tailwind CSS" },
  { phase: 5, answer: "Users, teams, projects, tasks, comments" },
  { phase: 6, answer: "REST API with CRUD for all entities" },
  { phase: 7, answer: "Supabase Auth with email/password and Google OAuth" },
  { phase: 8, answer: "Stripe subscription £15/month" },
  { phase: 9, answer: "Clean dashboard with project boards" },
  { phase: 10, answer: "Unit tests with Jest, E2E with Playwright" },
  { phase: 11, answer: "Vercel deployment with CI/CD" },
  { phase: 12, answer: "Email notifications, analytics, mobile app" }
];

// 3. Complete all phases
for (const answer of testAnswers) {
  // Fill phase
  // Click next
}
```

### Phase 4: Implement Export API

**File**: `app/api/export/route.ts`

```typescript
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

    // 2. Get session ID
    const { sessionId } = await req.json();

    // 3. Fetch answers
    const { data: answers, error } = await supabase
      .from('answers')
      .select('phase_number, content')
      .eq('session_id', sessionId)
      .order('phase_number', { ascending: true });

    if (error || !answers || answers.length !== 12) {
      return NextResponse.json(
        { error: 'Complete all 12 phases first' },
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
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}

async function callGPT5(answers: any[]) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  // Load GPT knowledge bases
  const kb1 = readFileSync(
    join(process.cwd(), 'ai-workflow/knowledge-base-1.md'),
    'utf-8'
  );
  const kb2 = readFileSync(
    join(process.cwd(), 'ai-workflow/knowledge-base-2.md'),
    'utf-8'
  );

  // Format answers
  const formattedAnswers = answers
    .map(a => `**Phase ${a.phase_number}**: ${a.content}`)
    .join('\n\n');

  const completion = await openai.chat.completions.create({
    model: "gpt-4", // Update to gpt-5 when available
    messages: [
      {
        role: "system",
        content: `${kb1}\n\n---\n\n${kb2}`
      },
      {
        role: "user",
        content: `Transform these 12-phase answers into a SaaS building plan:\n\n${formattedAnswers}`
      }
    ],
    max_tokens: 4000
  });

  return completion.choices[0].message.content;
}

async function callClaude(buildingPlan: string) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  // Load Claude instructions
  const instructions = readFileSync(
    join(process.cwd(), 'claude-instructions/claude-instructions.md'),
    'utf-8'
  );
  const kb1 = readFileSync(
    join(process.cwd(), 'claude-instructions/claude-knowledge-base-1.md'),
    'utf-8'
  );
  const kb2 = readFileSync(
    join(process.cwd(), 'claude-instructions/claude-knowledge-base-2.md'),
    'utf-8'
  );

  const fullInstructions = `${instructions}\n\n---\n\n${kb1}\n\n---\n\n${kb2}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    system: fullInstructions,
    messages: [
      {
        role: "user",
        content: `Transform this building plan into export files:\n\n${buildingPlan}`
      }
    ]
  });

  return parseClaudeOutput(message.content);
}

function parseClaudeOutput(content: any) {
  // Extract text from Claude response
  const text = typeof content === 'string' ? content : content[0].text;

  const files = {
    readme: '',
    claude: '',
    modules: {} as Record<string, string>,
    prompts: {} as Record<string, string>
  };

  // Parse files from Claude output
  // Format: ## File: path/to/file.md
  const fileMatches = text.matchAll(/## File: (.+?)\n```(?:markdown)?\n([\s\S]+?)\n```/g);

  for (const match of fileMatches) {
    const filePath = match[1].trim();
    const fileContent = match[2];

    if (filePath === 'README.md') {
      files.readme = fileContent;
    } else if (filePath === 'CLAUDE.md') {
      files.claude = fileContent;
    } else if (filePath.startsWith('modules/')) {
      const moduleName = filePath.split('/')[1].replace('.md', '');
      files.modules[moduleName] = fileContent;
    } else if (filePath.startsWith('prompts/')) {
      const promptName = filePath.split('/')[1].replace('.md', '');
      files.prompts[promptName] = fileContent;
    }
  }

  return files;
}

async function createZip(files: any) {
  const JSZip = require('jszip');
  const zip = new JSZip();

  // Add files
  zip.file("README.md", files.readme);
  zip.file("CLAUDE.md", files.claude);

  // Add modules
  for (const [name, content] of Object.entries(files.modules)) {
    zip.file(`modules/${name}.md`, content as string);
  }

  // Add prompts
  for (const [name, content] of Object.entries(files.prompts)) {
    zip.file(`prompts/${name}.md`, content as string);
  }

  return await zip.generateAsync({ type: 'nodebuffer' });
}
```

### Phase 5: Test Export Flow

```javascript
// 1. Complete workflow (12 phases)
// 2. Navigate to export page
await page.goto(`http://localhost:3000/export/${sessionId}`);

// 3. Click export button
await page.click('button:has-text("Export")');

// 4. Wait for download
const download = await page.waitForEvent('download');
await download.saveAs('./test-export.zip');

// 5. Verify ZIP contents
const AdmZip = require('adm-zip');
const zip = new AdmZip('./test-export.zip');
const zipEntries = zip.getEntries();

console.log('ZIP Contents:');
zipEntries.forEach(entry => {
  console.log(`  - ${entry.entryName}`);
});

// 6. Verify structure
const expectedFiles = [
  'README.md',
  'CLAUDE.md',
  'modules/',
  'prompts/'
];

for (const file of expectedFiles) {
  const exists = zipEntries.some(e => e.entryName.includes(file));
  console.log(`${exists ? '✅' : '❌'} ${file}`);
}
```

## Expected Issues & Fixes

### Issue 1: Missing `/api/export` Endpoint
**Status**: ❌ Not implemented
**Fix**: Create the file above
**Priority**: HIGH

### Issue 2: Missing Dependencies
**Check**:
```bash
npm list openai anthropic jszip
```

**Fix if missing**:
```bash
npm install openai @anthropic-ai/sdk jszip
```

### Issue 3: Environment Variables Not Set
**Check**:
```bash
echo $OPENAI_API_KEY
echo $ANTHROPIC_API_KEY
```

**Fix**: Add to `.env`:
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Issue 4: Exports Table Missing
**Fix**: Run SQL above in Phase 2

### Issue 5: GPT-5 Not Available Yet
**Fix**: Use `gpt-4-turbo` or `gpt-4` temporarily:
```typescript
model: "gpt-4-turbo"
```

### Issue 6: Claude Output Format Inconsistent
**Fix**: Add clearer instructions in system prompt about using exact format:
```
IMPORTANT: Format each file as:
## File: path/to/file.md
```markdown
[file content here]
```
```

### Issue 7: Rate Limiting
**Fix**: Add rate limit check in API:
```typescript
const { count } = await supabase
  .from('exports')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString());

if (count >= 5) {
  return NextResponse.json(
    { error: 'Export limit reached (5/day)' },
    { status: 429 }
  );
}
```

## Manual Testing Checklist

Once API is implemented:

- [ ] Create test account
- [ ] Start new workflow session
- [ ] Fill in all 12 phases with test data
- [ ] Navigate to export page
- [ ] Click export button
- [ ] Verify download starts
- [ ] Extract ZIP file
- [ ] Verify structure:
  - [ ] README.md exists
  - [ ] CLAUDE.md exists
  - [ ] modules/ directory exists
  - [ ] prompts/ directory exists
- [ ] Read generated files
- [ ] Verify content quality
- [ ] Check links between files work
- [ ] Test with different answer sets

## Automated Test Script

```bash
#!/bin/bash
# test-export.sh

echo "🧪 Testing Export Pipeline"

# 1. Check dependencies
echo "📦 Checking dependencies..."
npm list openai anthropic jszip 2>/dev/null || npm install openai @anthropic-ai/sdk jszip

# 2. Check environment
echo "🔑 Checking environment variables..."
if [ -z "$OPENAI_API_KEY" ] || [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "❌ Missing API keys in .env"
  exit 1
fi

# 3. Check dev server
echo "🌐 Checking dev server..."
curl -s http://localhost:3000 > /dev/null || {
  echo "❌ Dev server not running"
  exit 1
}

# 4. Check API endpoint exists
echo "🔌 Checking /api/export endpoint..."
if [ ! -f "app/api/export/route.ts" ]; then
  echo "❌ Export API not implemented"
  echo "   Create app/api/export/route.ts"
  exit 1
fi

# 5. Check knowledge bases
echo "📚 Checking knowledge bases..."
for file in ai-workflow/knowledge-base-1.md ai-workflow/knowledge-base-2.md claude-instructions/claude-instructions.md claude-instructions/claude-knowledge-base-1.md claude-instructions/claude-knowledge-base-2.md; do
  if [ ! -f "$file" ]; then
    echo "❌ Missing: $file"
    exit 1
  fi
  if [ ! -s "$file" ]; then
    echo "⚠️  Empty: $file"
  fi
done

echo "✅ All checks passed!"
echo "🎯 Ready for manual testing"
```

## Next Steps

1. **Implement Export API** - Create `app/api/export/route.ts`
2. **Install Dependencies** - `npm install openai @anthropic-ai/sdk jszip`
3. **Add API Keys** - Configure environment variables
4. **Create Test User** - Set up authentication
5. **Run Manual Test** - Complete workflow and export
6. **Iterate** - Fix issues as they arise

---

**Status**: Blocked on Export API implementation
**Priority**: Create `/api/export/route.ts` first

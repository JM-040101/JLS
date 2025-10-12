# Quick Start: Test Export Pipeline

## 🚀 5-Minute Test Guide

### Prerequisites
- ✅ Dev server running (http://localhost:3000)
- ✅ Export API implemented
- ✅ Knowledge bases loaded
- ❌ Need: User account + completed workflow

---

## Option 1: Full User Flow (Recommended)

### Step 1: Create Account (2 min)
```
1. Go to http://localhost:3000/auth/sign-up
2. Email: test@example.com
3. Password: TestPass123!
4. Sign up
```

### Step 2: Create Workflow (1 min)
```
1. Navigate to http://localhost:3000/workflow/new
2. Enter project name: "Task Manager"
3. Start workflow
```

### Step 3: Complete 12 Phases (5 min)
Use these quick test answers:

```
Phase 1: Task management app for remote teams
Phase 2: Remote teams of 5-50 people
Phase 3: Projects, tasks, assignments, real-time updates
Phase 4: Next.js 14, Supabase, Tailwind CSS, TypeScript
Phase 5: Users, teams, projects, tasks, comments tables
Phase 6: REST API with CRUD endpoints for all entities
Phase 7: Supabase Auth with email/password and Google OAuth
Phase 8: Stripe subscription £15 per month
Phase 9: Dashboard with project boards and task lists
Phase 10: Jest for unit tests, Playwright for E2E
Phase 11: Vercel deployment with automatic CI/CD
Phase 12: Email notifications, analytics, mobile app
```

### Step 4: Export (1 min)
```
1. After completing phase 12, you'll see export page
2. Click "Download Blueprint Package"
3. Wait for ZIP to generate (~30 seconds)
4. Download saas-blueprint.zip
```

### Step 5: Verify (2 min)
```bash
# Extract ZIP
unzip saas-blueprint.zip

# Check structure
ls -la

# Expected:
# README.md
# CLAUDE.md
# modules/
# prompts/

# Read files
cat README.md
cat CLAUDE.md
ls modules/
ls prompts/
```

---

## Option 2: Database Shortcut (Advanced)

If you have Supabase access, you can bypass the UI:

```sql
-- 1. Create test user (or use existing)
-- Get user_id from auth.users table

-- 2. Create completed session
INSERT INTO sessions (id, user_id, status, completed_phases, app_description, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '[your-user-id]'::uuid,
  'completed',
  12,
  'Task Manager Test',
  NOW()
);

-- 3. Insert 12 test answers
INSERT INTO answers (session_id, phase_number, content, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 1, 'Task management app for remote teams', NOW()),
('00000000-0000-0000-0000-000000000001', 2, 'Remote teams of 5-50 people', NOW()),
('00000000-0000-0000-0000-000000000001', 3, 'Projects, tasks, assignments, real-time updates', NOW()),
('00000000-0000-0000-0000-000000000001', 4, 'Next.js 14, Supabase, Tailwind CSS', NOW()),
('00000000-0000-0000-0000-000000000001', 5, 'Users, teams, projects, tasks, comments', NOW()),
('00000000-0000-0000-0000-000000000001', 6, 'REST API with CRUD endpoints', NOW()),
('00000000-0000-0000-0000-000000000001', 7, 'Supabase Auth with email and Google OAuth', NOW()),
('00000000-0000-0000-0000-000000000001', 8, 'Stripe subscription £15/month', NOW()),
('00000000-0000-0000-0000-000000000001', 9, 'Dashboard with project boards', NOW()),
('00000000-0000-0000-0000-000000000001', 10, 'Jest and Playwright tests', NOW()),
('00000000-0000-0000-0000-000000000001', 11, 'Vercel deployment', NOW()),
('00000000-0000-0000-0000-000000000001', 12, 'Email notifications and analytics', NOW());

-- 4. Navigate to export page
-- http://localhost:3000/export/00000000-0000-0000-0000-000000000001
```

---

## Expected Results

### Success Indicators
✅ Download starts within 30 seconds
✅ File named `saas-blueprint.zip` (20-100KB)
✅ ZIP contains README.md and CLAUDE.md
✅ ZIP contains modules/ directory with .md files
✅ ZIP contains prompts/ directory with .md files
✅ README mentions "Task Manager" project name
✅ Files are readable and well-formatted
✅ No broken links between files

### Possible Errors

**Error 401 Unauthorized**
- Cause: Not logged in
- Fix: Sign in first

**Error 400 Complete all 12 phases**
- Cause: Workflow not finished
- Fix: Complete remaining phases

**Error 429 Export limit reached**
- Cause: Already exported 5 times today
- Fix: Wait 24 hours or clear exports table

**Error 500 Export failed**
- Cause: API issue (GPT/Claude)
- Fix: Check logs, verify API keys

---

## Troubleshooting

### Issue: Download button doesn't work
```bash
# Check browser console for errors
# Try direct link:
curl -H "Authorization: Bearer [token]" \
  http://localhost:3000/api/export/[session-id] \
  --output test.zip
```

### Issue: ZIP is empty or corrupted
```bash
# Verify ZIP integrity
unzip -t saas-blueprint.zip

# Check file size
ls -lh saas-blueprint.zip

# If <1KB, likely an error response
cat saas-blueprint.zip
```

### Issue: Missing modules or prompts
```bash
# Check what Claude generated
# Look at server logs during export
# May need to refine Claude instructions
```

---

## Validation Checklist

After export, verify:

- [ ] README.md exists and is readable
- [ ] README mentions correct project name
- [ ] README includes tech stack
- [ ] README has module links
- [ ] CLAUDE.md exists and is readable
- [ ] CLAUDE.md has module references
- [ ] CLAUDE.md includes constraints
- [ ] modules/ directory exists
- [ ] At least 3 module files present
- [ ] Module files are under 50KB each
- [ ] prompts/ directory exists
- [ ] At least 5 prompt files present
- [ ] Prompts are numbered sequentially
- [ ] All markdown is valid syntax
- [ ] No broken internal links
- [ ] Code blocks are properly formatted

---

## Performance Benchmarks

**Expected Timing**:
- User signup: ~30 seconds
- Complete 12 phases: ~5-10 minutes
- Export processing: ~30-60 seconds
- Total test: ~10-15 minutes

**API Call Duration**:
- GPT-4 call: ~10-20 seconds
- Claude call: ~15-30 seconds
- ZIP generation: ~1-2 seconds
- Total API time: ~30-60 seconds

**File Sizes**:
- README.md: ~5-10KB
- CLAUDE.md: ~3-7KB
- Module files: ~3-8KB each
- Prompt files: ~2-5KB each
- Total ZIP: ~20-100KB

---

## Quick Test Commands

```bash
# Check if server is running
curl http://localhost:3000

# Check if export API is accessible (will return 401 without auth)
curl http://localhost:3000/api/export/test-id

# Check knowledge bases exist
ls -lh ai-workflow/*.md
ls -lh claude-instructions/*.md

# Check env variables
echo $OPENAI_API_KEY | cut -c1-10
echo $ANTHROPIC_API_KEY | cut -c1-10

# Run automated checks
./test-export.sh  # If you created the script
```

---

## Success Criteria

### Minimum Viable Test
✅ Can create account
✅ Can complete all 12 phases
✅ Can click export button
✅ Can download ZIP file
✅ ZIP contains README and CLAUDE

### Full Quality Test
✅ All minimum criteria
✅ ZIP contains modules directory
✅ ZIP contains prompts directory
✅ Content is relevant to answers
✅ Links between files work
✅ Code examples are valid

### Production Ready
✅ All full quality criteria
✅ Tested with 3+ different inputs
✅ Error handling verified
✅ Rate limiting tested
✅ Performance acceptable (<60s)
✅ No API errors in logs

---

## Next Steps After Successful Test

1. ✅ **Verify content quality** - Read generated files
2. 🔧 **Refine knowledge bases** - Improve prompts if needed
3. 📊 **Test variations** - Try different answer sets
4. 🐛 **Fix any issues** - Address parsing errors
5. 🚀 **Deploy to production** - Once stable

---

**Ready to test?** Start with Option 1 (full user flow) for the most realistic test!

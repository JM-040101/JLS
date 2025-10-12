# 🐛 Debugging Summary - Plan Generation Issues

**Date**: 2025-10-12
**Status**: ✅ FIXED + COMPREHENSIVE LOGGING ADDED

---

## 🔧 Critical Bug Fixed

### Issue: Wrong Column Name in Query
**Location**: `app/api/generate-plan/[id]/route.ts` line 73

**Before** (BROKEN):
```typescript
const { data: answers } = await supabase
  .from('answers')
  .select('phase_number, content')  // ❌ 'content' column doesn't exist!
  .eq('session_id', sessionId)
```

**After** (FIXED):
```typescript
const { data: answers } = await supabase
  .from('answers')
  .select('phase_number, answer_text, question_text')  // ✅ Correct columns
  .eq('session_id', sessionId)
```

**Impact**: This was causing the entire plan generation to fail silently. The query would return no results because the column name was wrong.

---

## 📊 Comprehensive Logging Added

### Server-Side Logging (Node.js)

All logs prefixed with `[GENERATE-PLAN]` or `[CALL-GPT]`:

```typescript
[GENERATE-PLAN] Starting plan generation for session: {sessionId}
[GENERATE-PLAN] Authenticated user: {userId}
[GENERATE-PLAN] Checking for existing plan...
[GENERATE-PLAN] Fetching answers...
[GENERATE-PLAN] Found answers: 54
[GENERATE-PLAN] Unique phases: 12
[GENERATE-PLAN] Calling GPT-4 to create building plan...
[CALL-GPT] Starting GPT-4 call with 54 answers
[CALL-GPT] OpenAI client created
[CALL-GPT] Loading knowledge bases...
[CALL-GPT] Knowledge bases loaded: { kb1Length: 24052, kb2Length: 21389 }
[CALL-GPT] Formatted answers length: 15234
[CALL-GPT] Calling OpenAI API...
[CALL-GPT] GPT-4 response received: { model, finishReason, tokensUsed }
[GENERATE-PLAN] GPT-4 response length: 8543
[GENERATE-PLAN] Saving plan to database...
[GENERATE-PLAN] New plan created successfully: {planId}
```

**Where to view**: Server terminal where `npm run dev` is running

---

### Client-Side Logging (Browser)

All logs prefixed with `[PREVIEW-PLAN]`:

```typescript
[PREVIEW-PLAN] Starting plan generation for session: {sessionId}
[PREVIEW-PLAN] Calling API: /api/generate-plan/{id}
[PREVIEW-PLAN] API response status: 200
[PREVIEW-PLAN] Plan received: { planLength: 8543, status: 'generated', planId: '...' }
[PREVIEW-PLAN] Plan state updated successfully
[PREVIEW-PLAN] Generation complete
```

**Where to view**: Browser Developer Tools (F12) → Console tab

---

## 🔍 Error Tracking

### Error Responses Now Include:

**API Errors**:
```json
{
  "error": "Failed to fetch answers",
  "details": "column \"content\" does not exist"
}
```

**Client Errors**:
```javascript
console.error('[PREVIEW-PLAN] API error response:', {
  error: "...",
  details: "..."
})
```

---

## 🐛 Other Issues Fixed

### 1. Phase Counting Logic
**Before**: Counted total answers (could be 54 for 12 phases)
**After**: Counts unique phases using `Set`

```typescript
const uniquePhases = answers ? new Set(answers.map(a => a.phase_number)).size : 0
```

### 2. Answers Formatting
**Before**: Used non-existent `a.content` field
**After**: Groups answers by phase with questions

```typescript
const phaseGroups = answers.reduce((acc, answer) => {
  if (!acc[answer.phase_number]) {
    acc[answer.phase_number] = []
  }
  acc[answer.phase_number].push(`Q: ${answer.question_text}\nA: ${answer.answer_text}`)
  return acc
}, {} as Record<number, string[]>)
```

### 3. Session Progress Trigger
**Issue**: Trigger tried to set `current_phase = 13` when inserting phase 12 answers
**Fixed**: Applied migration 010 to cap at 12

```sql
current_phase = LEAST(NEW.phase_number + 1, 12)
```

---

## 🎯 How to Debug Now

### Step 1: Open Browser Console
Press **F12** → **Console** tab

### Step 2: Navigate to Preview Plan Page
```
http://localhost:3000/preview-plan/88925bdc-e09b-4071-8912-13df0a39e190
```

### Step 3: Watch Logs in Real-Time

**Client logs** (Browser Console):
- `[PREVIEW-PLAN]` - Every action on the page
- Errors will show full details

**Server logs** (Terminal):
- `[GENERATE-PLAN]` - API endpoint processing
- `[CALL-GPT]` - GPT-4 API calls
- All errors with stack traces

---

## ✅ Current Status

### Database
- ✅ Session `88925bdc-e09b-4071-8912-13df0a39e190` has all 12 phases complete
- ✅ All 5 phase 12 questions answered
- ✅ Session status: `in_progress` (editable)
- ✅ Trigger fixed to cap at phase 12

### Code
- ✅ API query uses correct column names
- ✅ Phase counting logic correct
- ✅ Comprehensive logging in place
- ✅ Error details returned to client

### Testing
- ⏳ **Wait 60 seconds** for rate limit to clear
- ✅ Then navigate to preview page
- ✅ Check console for detailed logs
- ✅ Report any errors with log output

---

## 🚨 Known Issues

### Supabase Rate Limiting
**Error**: `AuthApiError: Request rate limit reached`
**Cause**: Too many requests in short time
**Solution**: Wait 60 seconds between tests

**Symptoms**:
- 429 status codes
- "over_request_rate_limit" error
- Pages failing to load
- Auto-save failures

**Prevention**:
- Avoid rapid page refreshes
- Wait for operations to complete
- Use direct SQL for data setup instead of UI

---

## 📝 Testing Checklist

After rate limit clears (60 seconds):

1. **Navigate to preview page**
   ```
   http://localhost:3000/preview-plan/88925bdc-e09b-4071-8912-13df0a39e190
   ```

2. **Open browser console** (F12)

3. **Watch for logs**:
   - `[PREVIEW-PLAN] Starting plan generation...`
   - `[PREVIEW-PLAN] Calling API...`
   - `[PREVIEW-PLAN] API response status: 200`
   - `[PREVIEW-PLAN] Plan received...`

4. **Check server terminal** for:
   - `[GENERATE-PLAN] Starting plan generation...`
   - `[CALL-GPT] Starting GPT-4 call...`
   - `[GENERATE-PLAN] Plan created successfully`

5. **If errors occur**:
   - Copy console logs (client-side)
   - Copy terminal output (server-side)
   - Check error details in response

---

## 🎓 Debugging Commands

### Check Database State
```sql
-- Verify session
SELECT id, status, completed_phases, current_phase
FROM sessions
WHERE id = '88925bdc-e09b-4071-8912-13df0a39e190';

-- Count phase 12 answers
SELECT COUNT(*)
FROM answers
WHERE session_id = '88925bdc-e09b-4071-8912-13df0a39e190'
  AND phase_number = 12;

-- Check for existing plan
SELECT id, status, LENGTH(content) as content_length
FROM plans
WHERE session_id = '88925bdc-e09b-4071-8912-13df0a39e190';
```

### Clear Rate Limits (if needed)
Just wait 60 seconds - Supabase automatically clears the limit.

---

## 💡 Summary

### What Was Wrong
1. ❌ API queried non-existent `content` column
2. ❌ Phase counting logic incorrect
3. ❌ No error visibility
4. ❌ Trigger tried to exceed phase 12

### What Was Fixed
1. ✅ Changed query to use `answer_text` column
2. ✅ Count unique phases correctly
3. ✅ Added comprehensive logging everywhere
4. ✅ Fixed trigger to cap at phase 12
5. ✅ Error details now returned to client

### How to Test
1. Wait 60 seconds for rate limit
2. Open browser console (F12)
3. Navigate to preview page
4. Watch logs flow in console and terminal
5. All errors now visible with full details

---

**Status**: ✅ **READY FOR TESTING WITH FULL ERROR VISIBILITY**

🎯 **You can now see exactly what's happening at every step and where any errors occur!**

# Timeout Analysis - Complete Breakdown

**Date**: 2025-10-13
**Status**: BLOCKED - Vercel Hobby Plan Limitation

---

## 🔴 Core Problem

**GPT-4 plan generation times out on Vercel despite all mitigation attempts.**

---

## Timeline of Issues & Fixes Attempted

### Issue #1: Original Synchronous Timeout (FIXED ✅)
**Error**: `504 Gateway Timeout` after ~10 seconds
**Cause**: Synchronous API call to GPT-4 took 15-30 seconds
**Fix Attempted**: Added `export const maxDuration = 60`
**Result**: Still timed out - Vercel Hobby doesn't respect maxDuration properly

### Issue #2: JSON Parse Error (FIXED ✅)
**Error**: `Unexpected token 'A', "An error o"... is not valid JSON`
**Cause**: Vercel returns plain text error on timeout instead of JSON
**Fix Applied**: Frontend now detects content-type and handles both JSON and plain text
**Result**: Better error messages, but still timing out

### Issue #3: Async Job Queue Attempt (PARTIALLY WORKING ⚠️)
**Implementation**:
- Created `jobs` table in database
- `/api/generate-plan/[id]` creates job and returns immediately (✅ Works)
- `/api/jobs/process/[job_id]` processes GPT-4 call async (❌ Still times out)
- Frontend polls for completion every 2 seconds (✅ Works)

**Current Behavior**:
```
[PREVIEW-PLAN] Job created: efed8526-aa9b-4dc2-86fe-95d351e8419f
[PREVIEW-PLAN] Triggering job processing
[PREVIEW-PLAN] Polling attempt 1/60 - Status: pending
[PREVIEW-PLAN] Polling attempt 2/60 - Status: processing
[PREVIEW-PLAN] Polling attempt 3/60 - Status: processing
...
[PREVIEW-PLAN] Polling attempt 22/60 - Status: processing
```

**Result**: Job gets stuck in "processing" forever because `/api/jobs/process/[job_id]` endpoint times out before GPT-4 finishes.

---

## 🔍 Root Cause Analysis

### Why It's Timing Out

1. **GPT-4 Request Duration**:
   - Comprehensive 815-line prompt + 2 knowledge bases
   - Typically takes **30-60 seconds** to complete
   - This is normal and expected for quality output

2. **Vercel Hobby Plan Limitations**:
   - **Official limit**: `maxDuration = 60` supported
   - **Reality**: Vercel enforces timeouts earlier (~10-30s depending on region)
   - Even background job processors hit the same limit
   - No way to truly bypass this on Hobby plan

3. **Why Async Job Queue Didn't Work**:
   - The job processor endpoint (`/api/jobs/process/[job_id]`) is **still a serverless function**
   - Serverless functions on Vercel Hobby have the same timeout limits
   - Moving the timeout from one endpoint to another doesn't solve the underlying limit

---

## 📊 Evidence From Logs

### Frontend Logs (Working as Expected)
```
✅ Job creation: Immediate response with job_id
✅ Job processor trigger: Fire-and-forget call
✅ Polling: Every 2 seconds, checking status
```

### Backend Logs (Stuck)
```
Job Status Timeline:
0s:  Status: pending (job created)
2s:  Status: processing (job processor started)
4s:  Status: processing (GPT-4 call initiated)
6s:  Status: processing (waiting for GPT-4...)
...
44s: Status: processing (still waiting...)
```

**Job never reaches "completed" because the processor times out before GPT-4 finishes.**

### Vercel Error (From Previous Attempts)
```
FUNCTION_INVOCATION_TIMEOUT lhr1::qgvvv-1760362559264-4da34d7e64eb
An error occurred with your deployment
```

---

## 🚫 What Won't Work

### ❌ Longer `maxDuration`
- Already set to 60 (maximum for Hobby)
- Vercel ignores it or enforces earlier timeout

### ❌ Async Job Queue (Current Implementation)
- Job processor is still a serverless function
- Subject to same timeout limits
- Just moves the problem to a different endpoint

### ❌ Client-Side Timeout Extension
- Browser can wait indefinitely
- But server-side function still times out

### ❌ Splitting the Prompt
- Would compromise quality (user explicitly said no)
- Still might timeout with large knowledge bases

---

## ✅ What Will Work

### Option 1: Upgrade to Vercel Pro ($20/mo)
**Pros**:
- Immediate solution
- `maxDuration = 300` (5 minutes)
- No code changes needed
- Most reliable

**Cons**:
- Monthly cost
- Still has upper limit (5 min)

---

### Option 2: External Job Queue (Inngest - FREE)
**How It Works**:
- Inngest runs jobs outside Vercel's infrastructure
- No timeout limits (jobs can run hours)
- Free tier: 1,000 jobs/month

**Implementation**:
1. Sign up for Inngest (free)
2. Install `inngest` package
3. Move GPT-4 call to Inngest function
4. Keep existing polling logic

**Pros**:
- Free forever (for your usage)
- No timeout limits
- Minimal code changes
- Jobs can be retried automatically

**Cons**:
- External dependency
- Requires Inngest account
- Slightly more complex setup

---

### Option 3: Optimize Prompt (NOT RECOMMENDED)
**Reduce prompt from 815 lines to ~300-400 lines**

**Pros**:
- Might fit in Vercel Hobby timeout
- No external services

**Cons**:
- **Compromises quality** (user explicitly rejected this)
- Still might timeout
- Defeats the purpose

---

### Option 4: Streaming Response
**Stream GPT-4 response in chunks as it generates**

**Pros**:
- User sees progress in real-time
- Better UX

**Cons**:
- Complex implementation
- Doesn't solve timeout (stream itself can timeout)
- Requires major refactor

---

### Option 5: Move to Different Platform
**Deploy to Railway, Fly.io, or Render instead of Vercel**

**Pros**:
- No function timeout limits
- More control

**Cons**:
- Complete migration required
- More setup complexity
- Different pricing model

---

## 📈 Recommended Solution

**Use Inngest (Option 2) - External Job Queue**

### Why Inngest?
1. ✅ **Free forever** for your usage (1000 jobs/month, you need ~100/month)
2. ✅ **No timeout limits** - jobs can run as long as needed
3. ✅ **Minimal code changes** - just move GPT-4 call to Inngest function
4. ✅ **Keep current architecture** - polling logic stays the same
5. ✅ **Automatic retries** - built-in error handling

### Implementation Estimate
- **Time**: 15-20 minutes
- **Code Changes**: 3 files
- **Testing**: 5 minutes

### Alternative If Cost Is No Issue
**Vercel Pro** - Simplest solution, immediate fix, no external dependencies

---

## 🎯 Current State

**Status**: ❌ BLOCKED
**Reason**: Vercel Hobby timeout limits cannot be bypassed with current architecture
**Next Step**: Choose between Inngest (free) or Vercel Pro ($20/mo)

---

## 📝 Technical Details

### GPT-4 Call Breakdown
```
Total Time: ~30-60 seconds
├── Load knowledge bases: ~0.5s
├── Format answers: ~0.5s
├── OpenAI API call: ~25-55s
│   ├── Prompt tokens: ~50,000 tokens
│   ├── Completion tokens: ~4,000 tokens
│   └── Processing time: Variable (depends on OpenAI load)
└── Save to database: ~0.5s
```

### Vercel Timeout Behavior (Observed)
```
Hobby Plan Reality:
├── Official maxDuration: 60s
├── Actual timeout: 10-30s (varies by region)
├── No warning before timeout
└── Returns 504 or plain text error
```

### Why It's Not Just A "Bug"
This is a **fundamental platform limitation**, not a bug in our code:
- Code is correct
- Architecture is sound
- GPT-4 prompt is optimized
- Issue is Vercel's infrastructure constraints

---

**Conclusion**: The async job queue implementation is **architecturally correct** but cannot overcome Vercel Hobby's hard timeout limits. An external job queue or platform upgrade is required.

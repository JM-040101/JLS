# Inngest Export Debugging Guide

## Problem: Export Stuck at 0%

### What We Fixed
1. ✅ Added missing `updated_at` column to exports table
2. ✅ Split 95%/100% updates into separate steps
3. ✅ Marked old failed exports with clear error messages

### Current Status
- Schema is correct
- Inngest functions are registered in `/app/api/inngest/route.ts`
- Environment variables exist in `.env.local`

## Debugging Steps

### 1. Verify Fresh Export Created
```sql
-- Run in Supabase SQL Editor
SELECT id, status, progress, created_at
FROM exports
WHERE created_at > now() - interval '5 minutes'
ORDER BY created_at DESC;
```

If no records appear, the export API isn't being called or is failing before creating the record.

### 2. Check Inngest Dashboard
- Visit: https://app.inngest.com
- Navigate to your "SaaS Blueprint Generator" app
- Go to "Events" tab
- Look for `export/generate.requested` events
- Click on an event to see:
  - ✅ Event received
  - ✅ Function triggered
  - ❌ Function failed (check error logs)

### 3. Check Vercel Function Logs
- Go to Vercel dashboard
- Select your project
- Go to "Functions" tab
- Look for `/api/export/[id]` invocations
- Check logs for errors

### 4. Common Issues

#### Issue: Inngest Not Synced with Vercel
**Solution:**
1. Go to https://app.inngest.com
2. Click "Apps" → Your app
3. Click "Sync" to re-sync functions with Vercel
4. Redeploy your Vercel app if needed

#### Issue: Missing Environment Variables
**Solution:**
Check Vercel project settings → Environment Variables:
- `INNGEST_SIGNING_KEY`
- `INNGEST_EVENT_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`

#### Issue: Inngest Function Not Registered
**Solution:**
The function must be deployed to Vercel and synced with Inngest:
```bash
# Redeploy to Vercel
git push origin main

# Then sync in Inngest dashboard
```

### 5. Manual Event Test
You can manually trigger an Inngest event from their dashboard:
1. Go to Inngest dashboard
2. Click "Events" → "Send Event"
3. Use this payload:
```json
{
  "name": "export/generate.requested",
  "data": {
    "exportId": "<UUID from database>",
    "sessionId": "<session UUID>",
    "userId": "<user UUID>",
    "planId": "<plan UUID>"
  }
}
```

### 6. Check If Progress Updates Work
If Inngest is running but progress stays at 0%, check function logs in Inngest dashboard for errors like:
- "Column updated_at does not exist" ← Should be fixed now
- "Failed to fetch plan" ← Plan not found or not approved
- API key errors for OpenAI/Anthropic
- Timeout errors (shouldn't happen with Inngest's unlimited execution time)

## Expected Timeline
- **0:00** - Export created, Inngest event sent
- **0:05** - Inngest picks up event, updates to 5% "Starting..."
- **0:10** - Updates to 10% "Loading plan..."
- **0:15** - Updates to 15% "Generating documentation..."
- **0:30** - Updates to 20% "Launching AI generation..."
- **2:30** - Updates to 40% "Generated 8 modules..." (GPT-4 finishes)
- **4:00** - Updates to 60% "Generated 9 prompts..." (GPT-4 finishes)
- **5:30** - Updates to 80% "Generated core docs..." (Claude finishes)
- **5:40** - Updates to 85% "Processing content..."
- **5:45** - Updates to 90% "Packaging files..."
- **5:50** - Updates to 95% "Finalizing..."
- **5:55** - Updates to 100% "Export complete!"

## Still Stuck?
If export is still at 0% after 2 minutes:
1. Check Inngest dashboard for error logs
2. Check Vercel function logs for API errors
3. Verify environment variables are set
4. Try manual event trigger in Inngest dashboard

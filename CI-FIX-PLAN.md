# CI/CD Fixes Plan - GitHub Actions Failures

**Created:** October 22, 2025
**Status:** 🔴 In Progress

---

## 🎯 Overview

Fix all failing GitHub Actions jobs identified in the latest workflow run:
1. ❌ E2E Tests (Database Connection)
2. ❌ Lighthouse Performance (TypeScript Build Error)
3. ❌ Security Scanning (SARIF Upload Permissions)
4. ❌ Merge Test Reports (Missing Directory)

---

## 📋 Detailed Action Plan

### 1. Fix E2E Test Database Migrations ⚡ HIGH PRIORITY

**Problem:**
- All E2E test jobs failing during "Run database migrations" step
- Error: `failed to connect to postgres ... connect: no such file or directory`
- Postgres socket not available at `/var/run/postgresql/.s.PGSQL.5432`

**Root Cause:**
- No Postgres service running in GitHub Actions environment
- `DATABASE_URL` pointing to non-existent Unix socket

**Solution:**
```yaml
# Add to .github/workflows/e2e-tests.yml

services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: jls_test
    ports:
      - 5432:5432
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

**Steps:**
1. ✅ Add Postgres service to workflow file
2. ✅ Update `DATABASE_URL` to use TCP connection instead of Unix socket
3. ✅ Set environment variable: `DATABASE_URL: postgresql://postgres:postgres@localhost:5432/jls_test`
4. ✅ Ensure migrations run after Postgres is healthy

**Files to Modify:**
- `.github/workflows/e2e-tests.yml`

**Test:**
- Push changes and verify E2E tests can connect to database
- Check migration step completes successfully

---

### 2. Fix TypeScript Build Error in Settings Page 🔧 HIGH PRIORITY

**Problem:**
- Lighthouse Performance job failing during build
- Error: `./app/dashboard/settings/page.tsx:154:47 - Type error: Property 'plan' does not exist on type`
- Next.js build exiting with code 1

**Root Cause:**
- `subscriptionDetails` type doesn't include `plan` property
- Code assumes `plan` exists but type definition is missing it

**Solution:**

**Option A: Add plan to type definition (RECOMMENDED)**
```typescript
// types/database.ts or lib/subscription.ts
interface SubscriptionDetails {
  plan: string | null
  status: string
  nextBillingDate?: string
  statistics: {
    totalBlueprints: number
    apiCallsThisMonth: number
    exportsGenerated: number
  }
}
```

**Option B: Handle undefined plan in component**
```typescript
// app/dashboard/settings/page.tsx:154
<span className="font-semibold">
  {subscriptionDetails?.plan || 'Free'}
</span>
```

**Steps:**
1. ✅ Check current `SubscriptionDetails` type definition
2. ✅ Add `plan` property to type interface
3. ✅ Update `getSubscriptionDetails()` function to return plan
4. ✅ Verify type consistency across all subscription-related components
5. ✅ Run local build to test: `npm run build`

**Files to Modify:**
- `types/database.ts` or `lib/subscription.ts`
- Possibly `lib/stripe/subscription.ts`

**Test:**
- Run `npm run build` locally
- Verify no TypeScript errors
- Check settings page renders correctly

---

### 3. Fix Security Scanning SARIF Upload 🔒 MEDIUM PRIORITY

**Problem:**
- Trivy scan succeeds but upload fails
- Error: `Resource not accessible by integration`
- GitHub CodeQL action can't upload SARIF results

**Root Cause:**
- Default `GITHUB_TOKEN` lacks `security-events: write` permission
- Workflow needs explicit permission to upload code scanning results

**Solution:**
```yaml
# Add to .github/workflows/e2e-tests.yml (or create separate security.yml)

permissions:
  contents: read
  security-events: write  # Required for uploading SARIF results

jobs:
  security-scan:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
    steps:
      - name: Run Trivy security scan
        # ... existing step

      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'
```

**Steps:**
1. ✅ Add `security-events: write` permission to workflow
2. ✅ Verify job-level permissions if top-level isn't enough
3. ✅ Ensure repository settings allow Actions to create security events

**Files to Modify:**
- `.github/workflows/e2e-tests.yml`

**Alternative Solution (if permissions don't work):**
- Create a Personal Access Token (PAT) with `security_events` scope
- Add PAT as repository secret: `SECURITY_SCAN_TOKEN`
- Use in workflow: `token: ${{ secrets.SECURITY_SCAN_TOKEN }}`

**Test:**
- Push changes and verify SARIF upload succeeds
- Check Security tab in GitHub for scan results

---

### 4. Fix Test Report Merging 📊 MEDIUM PRIORITY

**Problem:**
- Merge Test Reports job failing
- Error: `Directory does not exist: /home/runner/work/JLS/JLS/all-test-results`
- Playwright can't find test results to merge

**Root Cause:**
- E2E test jobs not uploading results to expected directory
- Or upload step failing due to earlier E2E failures
- Directory path mismatch between upload and merge steps

**Solution:**

**Step 1: Ensure E2E jobs upload results**
```yaml
# In E2E test jobs
- name: Upload test results
  if: always()  # Upload even if tests fail
  uses: actions/upload-artifact@v4
  with:
    name: test-results-${{ matrix.browser }}-${{ matrix.shard }}
    path: test-results/
    retention-days: 7
```

**Step 2: Download all artifacts before merging**
```yaml
# In merge job
- name: Download all test results
  uses: actions/download-artifact@v4
  with:
    path: all-test-results
    pattern: test-results-*
    merge-multiple: true

- name: Merge playwright reports
  run: npx playwright merge-reports --reporter=html ./all-test-results
```

**Steps:**
1. ✅ Verify E2E jobs have upload-artifact step
2. ✅ Ensure `if: always()` is set so results upload even on failure
3. ✅ Check artifact names match download pattern
4. ✅ Verify merge job downloads all artifacts correctly
5. ✅ Update merge command to use correct path

**Files to Modify:**
- `.github/workflows/e2e-tests.yml`

**Test:**
- Push changes and verify artifacts are uploaded
- Check merge job can download and merge reports
- Verify HTML report is generated

---

## 🔄 Implementation Order

### Phase 1: Critical Fixes (Do First) 🚨
1. **Fix Database Migrations** → Unblocks all E2E tests
2. **Fix TypeScript Error** → Unblocks build process

### Phase 2: Infrastructure Fixes (Do Second) 📦
3. **Fix SARIF Upload Permissions** → Enables security scanning
4. **Fix Test Report Merging** → Enables test result aggregation

### Phase 3: Verification (Do Last) ✅
5. **Test Full Workflow** → Verify all jobs pass
6. **Update CHANGELOG.md** → Document CI/CD improvements

---

## 📝 Checklist

### Pre-Implementation
- [ ] Read through entire plan
- [ ] Understand each failure and its fix
- [ ] Have access to repository settings
- [ ] Can push to main branch or create PR

### Phase 1: Database & Build
- [ ] Add Postgres service to E2E workflow
- [ ] Update DATABASE_URL environment variable
- [ ] Add `plan` property to SubscriptionDetails type
- [ ] Run local build to verify TypeScript fix
- [ ] Commit and push changes
- [ ] Monitor E2E test runs

### Phase 2: Security & Reports
- [ ] Add security-events permission to workflow
- [ ] Verify SARIF upload works
- [ ] Update test result upload/download steps
- [ ] Verify test report merging works
- [ ] Check GitHub Actions artifacts

### Phase 3: Documentation
- [ ] Update CHANGELOG.md with CI/CD section
- [ ] Document workflow improvements
- [ ] Note any remaining issues
- [ ] Mark plan as complete

---

## 🧪 Testing Strategy

### After Each Fix:
1. **Commit changes** with clear message
2. **Push to branch** (or main if confident)
3. **Monitor GitHub Actions** tab
4. **Check logs** for specific job
5. **Verify fix** resolved the issue
6. **Move to next fix** if successful

### Full Integration Test:
1. All E2E tests pass (Chromium, Firefox, WebKit)
2. Build completes without TypeScript errors
3. Security scan uploads SARIF results
4. Test reports merge successfully
5. Green checkmarks on all jobs ✅

---

## 📚 Reference Links

- [GitHub Actions Services](https://docs.github.com/en/actions/using-containerized-services/about-service-containers)
- [Permissions for GITHUB_TOKEN](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token)
- [Playwright Test Sharding](https://playwright.dev/docs/test-sharding)
- [Upload SARIF Files](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/uploading-a-sarif-file-to-github)

---

## ⚠️ Potential Issues & Mitigation

### Issue: Postgres service slow to start
**Mitigation:** Use health checks in service definition

### Issue: TypeScript errors in other files
**Mitigation:** Run full type check locally first: `npx tsc --noEmit`

### Issue: Permission still denied after adding security-events
**Mitigation:** Use PAT token with security_events scope

### Issue: Test results still not merging
**Mitigation:** Check artifact names match exactly, verify path in merge command

---

## 🎯 Success Criteria

✅ **All E2E tests pass** across all browsers and shards
✅ **Build completes** without TypeScript errors
✅ **Security scan uploads** SARIF results successfully
✅ **Test reports merge** and HTML report generates
✅ **Green workflow** on GitHub Actions tab
✅ **CHANGELOG updated** with CI/CD improvements

---

## 📞 Need Help?

If stuck on any step:
1. Check GitHub Actions logs for detailed error messages
2. Review GitHub documentation links above
3. Ask Claude to help debug specific errors
4. Create an issue in the repository for tracking

---

*Last Updated: October 22, 2025*
*Status: Ready to implement*

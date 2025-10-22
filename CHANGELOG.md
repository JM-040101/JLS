# SharpAxe Changelog

This document tracks all updates, changes, and improvements made to the SharpAxe SaaS Blueprint Generator app.

---

## [2025-10-22] - CI/CD Pipeline Fixes

### 🔧 GitHub Actions Improvements
- **Database Setup for E2E Tests**:
  - Added Postgres 15 service container to workflow
  - Configured health checks for reliable database availability
  - Updated DATABASE_URL to use TCP connection instead of Unix socket
  - Connection string: `postgresql://postgres:postgres@localhost:5432/jls_test`
  - File: `.github/workflows/e2e-tests.yml`

- **TypeScript Build Fixes**:
  - Added `plan` property to subscription details return type
  - Plan now shows: "Admin", "Pro", or "Free" based on user status
  - Added `apiCallsThisMonth` and `exportsGenerated` statistics
  - Fixed Settings page type error causing build failures
  - File: `lib/subscription.ts`

- **Security Scanning Permissions**:
  - Added `security-events: write` permission to workflow
  - Enables SARIF file uploads to GitHub Code Scanning
  - Trivy security scan results now properly integrated
  - File: `.github/workflows/e2e-tests.yml`

- **Test Report Merging**:
  - Added `merge-multiple: true` to artifact download
  - Fixed path handling for Playwright report merging
  - All test results now properly aggregated across browser shards
  - File: `.github/workflows/e2e-tests.yml`

### 📝 Documentation
- **CI Fix Plan**: Created comprehensive [CI-FIX-PLAN.md](CI-FIX-PLAN.md)
  - Detailed problem analysis for each failure
  - Step-by-step implementation guide
  - Testing strategy and success criteria

### 🎨 Settings Page UI Fix
- **Glass Effect Standardization**:
  - Updated Settings page to match dashboard styling consistency
  - Changed all three card sections to simple glass effect:
    - Account Information card
    - Subscription Details card
    - Usage Statistics card
  - Removed complex glassmorphism in favor of standardized design
  - File: `app/dashboard/settings/page.tsx`

### ⚡ Interactive Settings Page
- **Fully Functional Settings**:
  - Added editable name field with inline Edit/Save/Cancel buttons
  - Implemented password change functionality with validation:
    - Current password verification
    - New password must be at least 8 characters
    - Confirm password matching
  - Added subscription management:
    - "Upgrade to Pro" button for Free users (links to /pricing)
    - "Manage Subscription" button for Pro users (Stripe portal placeholder)
  - Real-time success/error messages with auto-dismiss
  - Loading states for all actions (Save/Update buttons show progress)
  - Files:
    - `app/dashboard/settings/SettingsClient.tsx` (NEW)
    - `app/dashboard/settings/actions.ts` (NEW)
    - `app/dashboard/settings/page.tsx` (refactored)

### 👤 User Profile Dropdown Menu
- **Interactive Navigation Enhancement**:
  - Replaced static user avatar with clickable dropdown menu
  - Menu items:
    - Settings (navigates to /dashboard/settings)
    - Profile (navigates to /profile)
    - Sign Out (with red hover effect)
  - Features:
    - Smooth animations and transitions
    - Click-outside-to-close behavior
    - Glassmorphism styling matching navbar
    - User info header showing name and email
    - Chevron icon indicates dropdown state
  - Files:
    - `components/navigation/UserProfileDropdown.tsx` (NEW)
    - `components/navigation/TopNavbar.tsx` (integrated dropdown)

---

## [2025-10-22] - Major UI/UX Overhaul & Branding Update

### 🎨 Branding Changes
- **Logo Redesign**: Changed from animated axe to simplified "SharpAxe" text logo
  - Both A's (lowercase 'a' in Sharp and uppercase 'A' in Axe) use cyan-to-teal gradient
  - Rest of text in standard heading color
  - Removed complex axe SVG animation
  - File: `components/navigation/SharpAxeLogo.tsx`

- **Color Scheme Consolidation**:
  - Removed purple (#a855f7) and pink (#ec4899) colors
  - Standardized on cyan (#06b6d4) to teal (#14b8a6) gradient throughout app
  - Updated: Welcome text, buttons, progress bars, activity indicators
  - File: `branding.config.ts`

### 🧭 Navigation System Overhaul
- **Replaced Sidebar with Top Navigation Bar**:
  - Floating glass navbar with glassmorphism effect
  - Centered Dashboard/Settings tabs
  - Responsive mobile menu
  - File: `components/navigation/TopNavbar.tsx`
  - Removed: `components/dashboard/Sidebar.tsx` (still exists but not used)

- **Search Functionality**:
  - Moved search from dashboard content to top navbar
  - Search box appears only when user has blueprints
  - Real-time filtering of blueprints by name
  - Clean glass effect with cyan border when active
  - Files: `components/navigation/TopNavbar.tsx`, `components/dashboard/DashboardContent.tsx`

### 🏠 Dashboard Improvements
- **Glass Effect Standardization**:
  - Applied consistent simple glass effect to all cards:
    - Background: `rgba(255, 255, 255, 0.05)`
    - Border: `1px solid rgba(255, 255, 255, 0.1)`
  - Updated components:
    - `components/dashboard/HeroBentoCard.tsx`
    - `components/dashboard/RecentActivity.tsx`
    - `components/dashboard/BlueprintCard.tsx`

- **Recent Activity Enhancement**:
  - Changed from static placeholder data to real user activity
  - Generates activities from actual user sessions:
    - Blueprint created (with truncated title)
    - Started working on phases
    - Reached Phase X (for phases 6-11)
    - Completed all phases
    - Exported blueprint files
  - Smart relative timestamps (e.g., "2h ago", "3d ago")
  - Shows up to 6 most recent activities
  - All icons use cyan-teal gradient colors
  - File: `components/dashboard/RecentActivity.tsx`

- **Component Architecture**:
  - Created `components/dashboard/DashboardPageClient.tsx` to manage search state
  - Updated `components/dashboard/DashboardLayout.tsx` to support search props
  - Refactored `app/dashboard/page.tsx` to use new client wrapper

### ⚙️ Settings Page
- **New Settings Page Created**: `app/dashboard/settings/page.tsx`
  - Account Information section (name, email)
  - Subscription Details (plan, status, next billing date)
  - Usage Statistics (total blueprints, API calls, exports)
  - Same glass effect design as dashboard
  - Fully integrated with existing auth and subscription system

### 📱 Responsive Design
- **Mobile Optimization**:
  - Mobile menu overlay for navigation
  - Search hidden on mobile (< 768px)
  - Responsive grid layouts maintained
  - Touch-friendly button sizes

### 🛠️ Technical Updates
- **Layout Simplification**:
  - Removed complex sidebar state management
  - Simplified DashboardLayout from flex calculations to simple padding
  - Cleaner component hierarchy

- **Git Repository**:
  - Initialized proper git repository in JLS-main directory
  - Connected to correct remote: `https://github.com/JM-040101/JLS.git`
  - All changes committed and pushed

---

## Key Files Modified

### Components
- ✅ `components/navigation/SharpAxeLogo.tsx` - Simplified logo
- ✅ `components/navigation/TopNavbar.tsx` - New top navigation
- ✅ `components/dashboard/DashboardLayout.tsx` - Updated for top nav
- ✅ `components/dashboard/DashboardPageClient.tsx` - NEW: Search state management
- ✅ `components/dashboard/DashboardContent.tsx` - Search integration
- ✅ `components/dashboard/HeroBentoCard.tsx` - Glass effect
- ✅ `components/dashboard/RecentActivity.tsx` - Real data + colors
- ✅ `components/dashboard/BlueprintCard.tsx` - Glass effect

### Pages
- ✅ `app/dashboard/page.tsx` - Refactored with client wrapper
- ✅ `app/dashboard/settings/page.tsx` - NEW: Settings page

### Config
- ✅ `branding.config.ts` - SharpAxe branding + cyan-teal colors

---

## Design Tokens

### Current Color Palette
```typescript
colors: {
  gradientFrom: '#06b6d4',  // Cyan
  gradientTo: '#14b8a6',    // Teal
  accent: '#06b6d4',        // Cyan
  success: '#10b981',       // Green (kept for success states)
  warning: '#f59e0b',       // Orange (kept for warnings)
}
```

### Glass Effect Standard
```css
background: rgba(255, 255, 255, 0.05);
border: 1px solid rgba(255, 255, 255, 0.1);
```

---

## Future Considerations

### Pending Items
- [ ] Consider re-implementing sidebar for larger dashboards (optional)
- [ ] Add keyboard shortcuts for search (Cmd/Ctrl + K)
- [ ] Implement search result highlighting
- [ ] Add filters to Recent Activity (by type, date range)
- [ ] Export Recent Activity as timeline
- [ ] Add avatar upload in Settings page
- [ ] Implement theme switcher (dark/light mode)

### Known Issues
- None currently reported

---

## How to Use This File

**For You (User):**
- Check this file to see what's been updated
- Reference it when planning new features
- Use it to track what's working vs what needs improvement

**For Claude:**
- Always read this file at the start of sessions to understand recent changes
- Update this file whenever making significant changes
- Reference specific sections when discussing features

---

*Last Updated: October 22, 2025*
*Version: 1.0.0*

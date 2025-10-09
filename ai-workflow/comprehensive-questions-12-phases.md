# Comprehensive 12-Phase SaaS Blueprint Questions

## Overview
This document contains simplified but thorough questions for each phase of the SaaS blueprint workflow. Questions are designed to:
- Extract all necessary context for building a complete blueprint
- Use plain language accessible to non-technical founders
- Enable the AI to provide expert guidance using the knowledge base
- Build progressively on previous phases

---

## Phase 1: Product Abstraction & Vision
**Goal:** Define the core product metaphor and primitives that will guide all development

### Questions:

1. **What's the core metaphor for your product?**
   - Examples: Canvas (Figma), Pipeline (Zapier), Blocks (Notion), Inbox (Gmail)
   - What real-world concept best represents how users will interact with your product?

2. **What are the main "things" users will create or manipulate?**
   - List the 3-5 core objects/primitives (e.g., Projects, Tasks, Documents, Messages)
   - What do users DO with these things?

3. **How should these primitives be named consistently?**
   - UI component name: _____
   - Database table name: _____
   - API endpoint name: _____
   - (We'll ensure consistency across all layers)

4. **What are the possible states for your main primitive?**
   - Examples: Draft → Published → Archived
   - What actions move between states? (Create, Update, Delete, Share, etc.)

5. **How do your primitives relate to each other?**
   - One-to-many? (One Project has many Tasks)
   - Many-to-many? (Users can belong to multiple Teams)

---

## Phase 2: Core Product Assumptions (CPA Layer)
**Goal:** Document assumptions about growth, compliance, uptime, and customer expectations

### Questions:

1. **Growth & Concurrency**
   - How many users/organizations do you expect in Year 1? Year 3?
   - Will usage be steady or bursty? (e.g., 9-5 office hours vs. 24/7 global)
   - Expected growth rate: ___%

2. **Data Sensitivity & Compliance**
   - What type of data will you handle? (Personal, Financial, Health, Business)
   - Which regulations apply? (GDPR, HIPAA, SOC 2, PCI-DSS, None yet)
   - Where must data be stored? (EU only, US only, Any region, User choice)

3. **Uptime & Support Expectations**
   - What uptime commitment? (99%, 99.9%, 99.99%)
   - Support model? (Email only, Chat 9-5, 24/7 phone)
   - Is downtime acceptable for maintenance? (Yes/No)

4. **Customer Integration Model**
   - Who's your initial target? (Self-serve SMBs, Enterprise, Both)
   - Will customers need single-tenant deployments? (Yes/No)
   - Integration requirements? (SSO, SAML, API, Webhooks)

---

## Phase 3: Audience & Customer Development
**Goal:** Define ideal customer profile and validate problem-solution fit

### Questions:

1. **Who is your Ideal Customer Profile (ICP)?**
   - Industry/vertical: _____
   - Company size: (Solo, 2-10, 11-50, 51-200, 201+)
   - Role/title of buyer: _____
   - Role/title of end user: _____

2. **What specific problem are you solving?**
   - Describe the pain point in one sentence:
   - How are they solving it today?
   - What's broken about current solutions?

3. **Have you validated this pain with real users?**
   - Number of customer interviews: _____
   - Key insights from conversations:
   - Have you built a prototype or wireframe? (Yes/No)

4. **What's the "job to be done" for your user?**
   - When do they "hire" your product?
   - What are they trying to accomplish?
   - What does success look like for them?

---

## Phase 4: MVP, V1.5 & Roadmap
**Goal:** Prioritize features and define what ships when

### Questions:

1. **What is the ONE core problem your MVP solves?**
   - Complete this: "This MVP helps [user] accomplish [goal] without [friction]"

2. **List all potential features you've considered:**
   - (We'll help you prioritize using RICE, MoSCoW, or Kano)

3. **Which features are must-haves for MVP?**
   - Essential for core value: _____
   - Nice-to-haves for V1.5: _____
   - Future roadmap ideas: _____

4. **How will you validate MVP success?**
   - Success metric: (User activation, Revenue, Retention, Other)
   - Target number: _____
   - Timeframe: _____

---

## Phase 5: User Flows & Onboarding
**Goal:** Map the journey from awareness to activation

### Questions:

1. **How will users sign up?**
   - Email + password
   - Social login (Google, GitHub, LinkedIn)
   - SSO (for enterprise)
   - Other: _____

2. **What is the "aha moment" you want users to experience?**
   - Complete this: "Users will say 'aha!' when they _____"
   - Examples: Send first message, Create first project, See first insight

3. **How will you guide new users to that aha moment?**
   - Guided tour/walkthrough
   - Interactive checklist
   - Tooltips and hints
   - Sample data/templates
   - Video tutorial
   - Just let them explore

4. **What defines an "activated" user?**
   - Specific action: _____
   - Time to First Value (TTFV) target: _____ minutes
   - How will you measure activation rate?

5. **What might cause users to drop off before activation?**
   - Too many signup fields?
   - Unclear value proposition?
   - Complex first steps?
   - Missing critical features?

---

## Phase 6: UI/UX & Branding
**Goal:** Define design system and accessibility standards

### Questions:

1. **Which design framework fits your needs?**
   - Tailwind CSS (custom, flexible, learn-as-you-go)
   - Material UI (pre-built, accessible, Google aesthetic)
   - Other: _____
   - Why this choice?

2. **What's your brand personality?**
   - Professional & corporate
   - Friendly & approachable
   - Bold & innovative
   - Minimal & clean
   - Other: _____

3. **Describe your color scheme:**
   - Primary color: _____
   - Secondary color: _____
   - Accent color: _____
   - (We'll follow the 60-30-10 rule)

4. **Accessibility requirements:**
   - WCAG compliance needed? (Yes/No - Level A, AA, or AAA)
   - Must support screen readers? (Yes/No)
   - Keyboard navigation required? (Yes/No)

5. **Which SaaS products inspire your UI?**
   - List 2-3 examples and what you like about them

---

## Phase 7: Tech Stack & Infrastructure
**Goal:** Select technologies for maintainability and growth

### Questions:

1. **What's your team situation?**
   - Solo non-technical founder
   - Solo developer
   - Small technical team (2-5)
   - Larger team (6+)

2. **Frontend preference:**
   - React + Next.js
   - Vue + Nuxt
   - Svelte + SvelteKit
   - No preference - recommend best fit
   - Other: _____

3. **Backend preference:**
   - Node.js (Express, Nest.js)
   - Python (Django, FastAPI)
   - Ruby on Rails
   - Go
   - No preference - recommend best fit
   - Other: _____

4. **Database:**
   - PostgreSQL
   - MySQL
   - MongoDB
   - Supabase (PostgreSQL + auth + storage)
   - Firebase
   - No preference - recommend best fit

5. **Hosting & deployment:**
   - Vercel (easy, automatic, great for Next.js)
   - AWS/Azure/GCP (full control, complex)
   - Render/Fly.io (middle ground)
   - No preference - recommend based on team size

6. **Authentication:**
   - Build custom with JWT
   - Auth0
   - Clerk
   - Supabase Auth
   - Firebase Auth
   - No preference - recommend best fit

7. **Payments:**
   - Stripe (flexible, developer-friendly, you handle VAT)
   - Paddle (Merchant of Record, handles VAT)
   - Lemon Squeezy (Merchant of Record, simpler)
   - Not needed yet

8. **CI/CD & DevOps:**
   - GitHub Actions
   - GitLab CI
   - CircleCI
   - Not needed yet - manual deployment OK

---

## Phase 8: Database Design & Multi-Tenancy
**Goal:** Design schema and choose tenancy model

### Questions:

1. **Core resources to store:**
   - List main database tables you'll need: _____

2. **User-Organization relationship:**
   - Users belong to ONE organization only (Google Workspace model)
   - Users can belong to MULTIPLE organizations (GitHub model)

3. **Multi-tenancy approach:**
   - Shared database with `organisation_id` column (simple, cost-effective)
   - Separate database per tenant (strong isolation, operational overhead)
   - Hybrid: Start shared, move enterprise to isolated
   - Not sure - recommend based on CPA assumptions

4. **User roles needed:**
   - Owner/Admin (full control)
   - Member (standard user)
   - Guest/Viewer (read-only)
   - Other custom roles: _____

5. **Data isolation requirements:**
   - Standard isolation (app-level checks)
   - Strong isolation (row-level security in database)
   - Complete isolation (separate databases)

---

## Phase 9: Feedback Injection Loops
**Goal:** Establish continuous product feedback systems

### Questions:

1. **Pre-launch validation:**
   - Will you test with wireframes or clickable prototypes? (Yes/No)
   - How many beta testers do you want? _____

2. **Feedback collection methods:**
   - In-app surveys
   - Support tickets/email
   - User interviews (scheduled)
   - Analytics/usage data
   - Fake door tests (show "coming soon" to gauge interest)
   - All of the above

3. **Analytics you'll track:**
   - User activation events
   - Feature usage
   - Drop-off points
   - User paths/flows
   - Custom events: _____

4. **How will you close the feedback loop?**
   - Public roadmap showing what's being built
   - Email updates when feedback is implemented
   - Changelog or release notes
   - Direct replies to suggestions

---

## Phase 10: Pricing & Monetisation UX
**Goal:** Define pricing strategy and upgrade flows

### Questions:

1. **Which pricing model fits your value delivery?**
   - Flat monthly subscription (simple, predictable)
   - Per-user/seat pricing (scales with team size)
   - Usage-based (API calls, storage, features used)
   - Tiered plans (Free, Pro, Business, Enterprise)
   - Freemium (free forever plan + paid upgrades)
   - One-time purchase
   - Not sure - help me decide

2. **Pricing tiers you're considering:**
   - Free tier: What's included? _____
   - Paid tier(s): Name, price, features _____
   - Enterprise: Custom pricing? (Yes/No)

3. **When should users see pricing?**
   - Before they experience value (traditional paywall)
   - After their first "aha moment" (activation-first pricing)
   - Not sure - recommend best practice

4. **Upgrade prompts:**
   - What triggers an upgrade prompt? (Hit limit, Complete action, Time-based)
   - Where do you show upgrade CTAs? (Dashboard, In features, Modal, Banner)

5. **Pricing page features:**
   - Do you want an ROI/pricing calculator? (Yes/No)
   - Should you show social proof (logos, testimonials)? (Yes/No)
   - Will you offer annual discounts? (Yes/No - If yes, what %?)

6. **International customers:**
   - Need to handle EU VAT automatically? (Yes - use Paddle/Lemon Squeezy, No - use Stripe)
   - Other tax/compliance considerations? _____

---

## Phase 11: Launch Readiness & Analytics
**Goal:** Ensure infrastructure, monitoring, and compliance

### Questions:

1. **Analytics platform:**
   - PostHog (open source, product analytics)
   - Mixpanel (product analytics, events)
   - Amplitude (product analytics, enterprise)
   - Google Analytics (basic web analytics)
   - Plausible (privacy-focused, simple)
   - Multiple tools
   - Not sure - recommend

2. **Error tracking & monitoring:**
   - Sentry (error tracking)
   - Datadog (full observability)
   - LogRocket (session replay + errors)
   - Not needed yet

3. **Uptime & SLA:**
   - What uptime will you promise? (99%, 99.9%, 99.99%, No SLA yet)
   - Status page needed? (Yes/No)

4. **Compliance & security:**
   - Do you need SOC 2? (Yes/No/Not yet)
   - GDPR compliance required? (Yes - EU customers, No)
   - Penetration testing planned? (Yes/No)
   - Data encryption at rest? (Yes/No)

5. **Scaling preparation:**
   - Expected traffic at launch: _____ users
   - Load testing planned? (Yes/No)
   - Auto-scaling configured? (Yes/No/Not needed yet)
   - CDN for static assets? (Yes/No)

---

## Phase 12: GTM & AI Integration
**Goal:** Plan go-to-market and AI-powered features

### Questions:

1. **Go-to-market motion:**
   - Product-Led Growth (self-serve, try before buy)
   - Sales-Led (demos, custom proposals)
   - Channel/Partner-led (integrations, referrals)
   - Community-led (open source, word of mouth)
   - Combination: _____

2. **AI/LLM use cases in your product:**
   - Chatbot/assistant
   - Content generation (text, images)
   - Summarization (documents, conversations)
   - Automation/workflow intelligence
   - Search/recommendations
   - Data analysis/insights
   - None - no AI planned
   - Other: _____

3. **If using AI - what modalities?**
   - Text only
   - Text + Image
   - Text + Audio
   - Multimodal (Text + Image + Audio + Video)

4. **AI model requirements:**
   - What's your budget constraint? (Low, Medium, High, No constraint)
   - Do you need long context (100k+ tokens)? (Yes/No)
   - Privacy requirements? (Cloud API OK, Must self-host, Hybrid)
   - Latency requirements? (Real-time < 1s, Standard < 5s, Batch OK)

5. **AI integration in GTM:**
   - How will AI tie into marketing?
   - Will AI be part of onboarding?
   - Is AI a core differentiator or nice-to-have feature?

6. **Model selection help needed?**
   - Should we recommend specific models based on your needs? (Yes/No)
   - Do you need cost comparisons? (Yes/No)

---

## Question Flow Strategy

### Progressive Disclosure
- Start broad (Phase 1-3: Vision, assumptions, audience)
- Get specific (Phase 4-8: Features, tech, database)
- Refine details (Phase 9-12: Feedback, pricing, launch, GTM)

### Context Building
- Each phase references previous answers
- AI provides recommendations based on cumulative context
- Users can revise earlier phases if new insights emerge

### Validation Points
- After Phase 3: "Does the problem-solution fit make sense?"
- After Phase 7: "Is this stack realistic for your team?"
- After Phase 10: "Does pricing align with value delivery?"
- After Phase 12: "Are all assumptions documented and trade-offs understood?"

---

## Output Format

After all 12 phases, the AI generates:

```markdown
# Comprehensive SaaS Product Blueprint: [Product Name]

## Executive Summary
[1-2 paragraphs synthesizing the entire plan]

## Phase 1: Product Abstraction & Vision
[User's answers + AI recommendations]

## Phase 2: Core Product Assumptions
[Documented assumptions + architectural implications]

...

## Phase 12: GTM & AI Integration
[Strategy + specific model recommendations if applicable]

## Implementation Roadmap
[Sequenced steps from MVP to V1.5 to scaling]

## Stack Summary
[Complete tech stack with rationale]

## Next Steps
[Actionable items to start building]
```

---

## Notes for AI Workflow Implementation

### Question Adaptation
- If user answers "I don't know" → AI provides options with trade-offs
- If user is non-technical → AI explains concepts in plain language
- If user is technical → AI can dive deeper into implementation details

### Knowledge Base Integration
- AI should reference specific frameworks from KB1 (SaaS Playbook)
- AI should suggest models from KB2 (AI API Keys) when Phase 12 is reached
- AI should validate answers against best practices in knowledge bases

### Validation Rules
- Required questions must have meaningful answers (not just "skip" or "I don't know")
- AI should probe deeper when answers are vague
- AI should highlight conflicts (e.g., "You want enterprise customers but chose a budget hosting option")

### Time Estimates per Phase
- Phase 1-3: 5-10 minutes each (strategic)
- Phase 4-6: 10-15 minutes each (planning)
- Phase 7-8: 15-20 minutes each (technical decisions)
- Phase 9-12: 10-15 minutes each (refinement)
- Total: 2-3 hours for thoughtful completion

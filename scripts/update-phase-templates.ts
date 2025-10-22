/**
 * Script to update phase_templates table with comprehensive questions
 * Based on ai-workflow/comprehensive-questions-12-phases.md
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Phase templates with comprehensive questions from knowledge base
const phaseTemplates = [
  {
    phase_number: 1,
    phase_name: 'Product Abstraction & Vision',
    phase_description: 'Define the core product metaphor and primitives that will guide all development',
    questions: [
      {
        id: 'core-metaphor',
        text: 'What\'s the core metaphor for your product?',
        help_text: 'Examples: Canvas (Figma), Pipeline (Zapier), Blocks (Notion), Inbox (Gmail). What real-world concept best represents how users will interact with your product?',
        type: 'textarea',
        required: true
      },
      {
        id: 'main-primitives',
        text: 'What are the main "things" users will create or manipulate?',
        help_text: 'List the 3-5 core objects/primitives (e.g., Projects, Tasks, Documents, Messages). What do users DO with these things?',
        type: 'textarea',
        required: true
      },
      {
        id: 'primitive-naming',
        text: 'How should these primitives be named consistently?',
        help_text: 'We\'ll ensure consistency across all layers. For each primitive, provide: UI component name, Database table name, API endpoint name',
        type: 'textarea',
        required: true
      },
      {
        id: 'primitive-states',
        text: 'What are the possible states for your main primitive?',
        help_text: 'Examples: Draft → Published → Archived. What actions move between states? (Create, Update, Delete, Share, etc.)',
        type: 'textarea',
        required: true
      },
      {
        id: 'primitive-relationships',
        text: 'How do your primitives relate to each other?',
        help_text: 'One-to-many? (One Project has many Tasks) Many-to-many? (Users can belong to multiple Teams)',
        type: 'textarea',
        required: true
      }
    ]
  },
  {
    phase_number: 2,
    phase_name: 'Core Product Assumptions (CPA Layer)',
    phase_description: 'Document assumptions about growth, compliance, uptime, and customer expectations',
    questions: [
      {
        id: 'growth-concurrency',
        text: 'How many users/organizations do you expect in Year 1? Year 3?',
        help_text: 'Will usage be steady or bursty? (e.g., 9-5 office hours vs. 24/7 global). What\'s your expected growth rate?',
        type: 'textarea',
        required: true
      },
      {
        id: 'data-compliance',
        text: 'What type of data will you handle and which regulations apply?',
        help_text: 'Data types: Personal, Financial, Health, Business. Regulations: GDPR, HIPAA, SOC 2, PCI-DSS, None yet. Where must data be stored? (EU only, US only, Any region, User choice)',
        type: 'textarea',
        required: true
      },
      {
        id: 'uptime-support',
        text: 'What uptime commitment and support model will you provide?',
        help_text: 'Uptime: 99%, 99.9%, 99.99%? Support: Email only, Chat 9-5, 24/7 phone? Is downtime acceptable for maintenance?',
        type: 'textarea',
        required: true
      },
      {
        id: 'customer-model',
        text: 'Who\'s your initial target and what integrations do they need?',
        help_text: 'Target: Self-serve SMBs, Enterprise, Both? Single-tenant deployments needed? Integrations: SSO, SAML, API, Webhooks?',
        type: 'textarea',
        required: true
      }
    ]
  },
  {
    phase_number: 3,
    phase_name: 'Audience & Customer Development',
    phase_description: 'Define ideal customer profile and validate problem-solution fit',
    questions: [
      {
        id: 'ideal-customer',
        text: 'Who is your Ideal Customer Profile (ICP)?',
        help_text: 'Industry/vertical, Company size (Solo, 2-10, 11-50, 51-200, 201+), Role/title of buyer, Role/title of end user',
        type: 'textarea',
        required: true
      },
      {
        id: 'problem-solving',
        text: 'What specific problem are you solving?',
        help_text: 'Describe the pain point in one sentence. How are they solving it today? What\'s broken about current solutions?',
        type: 'textarea',
        required: true
      },
      {
        id: 'validation',
        text: 'Have you validated this pain with real users?',
        help_text: 'Number of customer interviews, Key insights from conversations, Have you built a prototype or wireframe?',
        type: 'textarea',
        required: true
      },
      {
        id: 'job-to-be-done',
        text: 'What\'s the "job to be done" for your user?',
        help_text: 'When do they "hire" your product? What are they trying to accomplish? What does success look like for them?',
        type: 'textarea',
        required: true
      }
    ]
  },
  {
    phase_number: 4,
    phase_name: 'MVP, V1.5 & Roadmap',
    phase_description: 'Prioritize features and define what ships when',
    questions: [
      {
        id: 'mvp-core-problem',
        text: 'What is the ONE core problem your MVP solves?',
        help_text: 'Complete this: "This MVP helps [user] accomplish [goal] without [friction]"',
        type: 'textarea',
        required: true
      },
      {
        id: 'all-features',
        text: 'List all potential features you\'ve considered',
        help_text: 'We\'ll help you prioritize using RICE, MoSCoW, or Kano frameworks',
        type: 'textarea',
        required: true
      },
      {
        id: 'feature-priority',
        text: 'Which features are must-haves for MVP vs nice-to-haves?',
        help_text: 'Essential for core value (MVP), Nice-to-haves for V1.5, Future roadmap ideas',
        type: 'textarea',
        required: true
      },
      {
        id: 'mvp-validation',
        text: 'How will you validate MVP success?',
        help_text: 'Success metric (User activation, Revenue, Retention, Other), Target number, Timeframe',
        type: 'textarea',
        required: true
      }
    ]
  },
  {
    phase_number: 5,
    phase_name: 'User Flows & Onboarding',
    phase_description: 'Map the journey from awareness to activation',
    questions: [
      {
        id: 'signup-methods',
        text: 'How will users sign up?',
        help_text: 'Email + password, Social login (Google, GitHub, LinkedIn), SSO (for enterprise), Other',
        type: 'select',
        options: ['Email + Password', 'Social Login', 'SSO', 'Multiple Methods'],
        required: true
      },
      {
        id: 'aha-moment',
        text: 'What is the "aha moment" you want users to experience?',
        help_text: 'Complete this: "Users will say \'aha!\' when they _____". Examples: Send first message, Create first project, See first insight',
        type: 'textarea',
        required: true
      },
      {
        id: 'onboarding-guidance',
        text: 'How will you guide new users to that aha moment?',
        help_text: 'Guided tour/walkthrough, Interactive checklist, Tooltips and hints, Sample data/templates, Video tutorial, Just let them explore',
        type: 'textarea',
        required: true
      },
      {
        id: 'activation-definition',
        text: 'What defines an "activated" user?',
        help_text: 'Specific action, Time to First Value (TTFV) target in minutes, How will you measure activation rate?',
        type: 'textarea',
        required: true
      },
      {
        id: 'dropoff-concerns',
        text: 'What might cause users to drop off before activation?',
        help_text: 'Too many signup fields? Unclear value proposition? Complex first steps? Missing critical features?',
        type: 'textarea',
        required: false
      }
    ]
  },
  {
    phase_number: 6,
    phase_name: 'UI/UX & Branding',
    phase_description: 'Define design system and accessibility standards',
    questions: [
      {
        id: 'design-framework',
        text: 'Which design framework fits your needs?',
        help_text: 'Tailwind CSS (custom, flexible, learn-as-you-go), Material UI (pre-built, accessible, Google aesthetic), Other. Why this choice?',
        type: 'textarea',
        required: true
      },
      {
        id: 'brand-personality',
        text: 'What\'s your brand personality?',
        help_text: 'Professional & corporate, Friendly & approachable, Bold & innovative, Minimal & clean, Other',
        type: 'textarea',
        required: true
      },
      {
        id: 'color-scheme',
        text: 'Describe your color scheme',
        help_text: 'Primary color, Secondary color, Accent color (We\'ll follow the 60-30-10 rule)',
        type: 'textarea',
        required: true
      },
      {
        id: 'accessibility',
        text: 'What are your accessibility requirements?',
        help_text: 'WCAG compliance needed? (Level A, AA, or AAA), Must support screen readers?, Keyboard navigation required?',
        type: 'textarea',
        required: true
      },
      {
        id: 'ui-inspiration',
        text: 'Which SaaS products inspire your UI?',
        help_text: 'List 2-3 examples and what you like about them',
        type: 'textarea',
        required: false
      }
    ]
  },
  {
    phase_number: 7,
    phase_name: 'Tech Stack & Infrastructure',
    phase_description: 'Select technologies for maintainability and growth',
    questions: [
      {
        id: 'team-situation',
        text: 'What\'s your team situation?',
        help_text: 'Solo non-technical founder, Solo developer, Small technical team (2-5), Larger team (6+)',
        type: 'select',
        options: ['Solo non-technical', 'Solo developer', 'Small team (2-5)', 'Large team (6+)'],
        required: true
      },
      {
        id: 'frontend-stack',
        text: 'Frontend preference',
        help_text: 'React + Next.js, Vue + Nuxt, Svelte + SvelteKit, No preference - recommend best fit, Other',
        type: 'textarea',
        required: true
      },
      {
        id: 'backend-stack',
        text: 'Backend preference',
        help_text: 'Node.js (Express, Nest.js), Python (Django, FastAPI), Ruby on Rails, Go, No preference - recommend best fit, Other',
        type: 'textarea',
        required: true
      },
      {
        id: 'database-choice',
        text: 'Database preference',
        help_text: 'PostgreSQL, MySQL, MongoDB, Supabase (PostgreSQL + auth + storage), Firebase, No preference',
        type: 'textarea',
        required: true
      },
      {
        id: 'hosting-deployment',
        text: 'Hosting & deployment preference',
        help_text: 'Vercel (easy, automatic, great for Next.js), AWS/Azure/GCP (full control, complex), Render/Fly.io (middle ground), No preference',
        type: 'textarea',
        required: true
      },
      {
        id: 'authentication',
        text: 'Authentication approach',
        help_text: 'Build custom with JWT, Auth0, Clerk, Supabase Auth, Firebase Auth, No preference',
        type: 'textarea',
        required: true
      },
      {
        id: 'payments',
        text: 'Payments provider',
        help_text: 'Stripe (flexible, you handle VAT), Paddle (Merchant of Record, handles VAT), Lemon Squeezy (Merchant of Record, simpler), Not needed yet',
        type: 'textarea',
        required: true
      }
    ]
  },
  {
    phase_number: 8,
    phase_name: 'Database Design & Multi-Tenancy',
    phase_description: 'Design schema and choose tenancy model',
    questions: [
      {
        id: 'core-resources',
        text: 'What are the core resources you need to store?',
        help_text: 'List main database tables you\'ll need',
        type: 'textarea',
        required: true
      },
      {
        id: 'user-org-relationship',
        text: 'User-Organization relationship',
        help_text: 'Users belong to ONE organization only (Google Workspace model), Users can belong to MULTIPLE organizations (GitHub model)',
        type: 'select',
        options: ['One organization per user', 'Multiple organizations per user'],
        required: true
      },
      {
        id: 'tenancy-approach',
        text: 'Multi-tenancy approach',
        help_text: 'Shared database with organisation_id column (simple, cost-effective), Separate database per tenant (strong isolation, operational overhead), Hybrid: Start shared, move enterprise to isolated, Not sure - recommend based on CPA',
        type: 'textarea',
        required: true
      },
      {
        id: 'user-roles',
        text: 'User roles needed',
        help_text: 'Owner/Admin (full control), Member (standard user), Guest/Viewer (read-only), Other custom roles',
        type: 'textarea',
        required: true
      },
      {
        id: 'data-isolation',
        text: 'Data isolation requirements',
        help_text: 'Standard isolation (app-level checks), Strong isolation (row-level security in database), Complete isolation (separate databases)',
        type: 'textarea',
        required: true
      }
    ]
  },
  {
    phase_number: 9,
    phase_name: 'Feedback Injection Loops',
    phase_description: 'Establish continuous product feedback systems',
    questions: [
      {
        id: 'prelaunch-validation',
        text: 'Pre-launch validation approach',
        help_text: 'Will you test with wireframes or clickable prototypes? How many beta testers do you want?',
        type: 'textarea',
        required: true
      },
      {
        id: 'feedback-methods',
        text: 'Feedback collection methods',
        help_text: 'In-app surveys, Support tickets/email, User interviews (scheduled), Analytics/usage data, Fake door tests (show "coming soon" to gauge interest), All of the above',
        type: 'textarea',
        required: true
      },
      {
        id: 'analytics-tracking',
        text: 'Analytics you\'ll track',
        help_text: 'User activation events, Feature usage, Drop-off points, User paths/flows, Custom events',
        type: 'textarea',
        required: true
      },
      {
        id: 'feedback-loop-closure',
        text: 'How will you close the feedback loop?',
        help_text: 'Public roadmap showing what\'s being built, Email updates when feedback is implemented, Changelog or release notes, Direct replies to suggestions',
        type: 'textarea',
        required: true
      }
    ]
  },
  {
    phase_number: 10,
    phase_name: 'Pricing & Monetisation UX',
    phase_description: 'Define pricing strategy and upgrade flows',
    questions: [
      {
        id: 'pricing-model',
        text: 'Which pricing model fits your value delivery?',
        help_text: 'Flat monthly subscription (simple, predictable), Per-user/seat pricing (scales with team size), Usage-based (API calls, storage, features used), Tiered plans (Free, Pro, Business, Enterprise), Freemium (free forever plan + paid upgrades), One-time purchase, Not sure - help me decide',
        type: 'textarea',
        required: true
      },
      {
        id: 'pricing-tiers',
        text: 'Pricing tiers you\'re considering',
        help_text: 'Free tier: What\'s included? Paid tier(s): Name, price, features. Enterprise: Custom pricing?',
        type: 'textarea',
        required: true
      },
      {
        id: 'pricing-visibility',
        text: 'When should users see pricing?',
        help_text: 'Before they experience value (traditional paywall), After their first "aha moment" (activation-first pricing), Not sure - recommend best practice',
        type: 'textarea',
        required: true
      },
      {
        id: 'upgrade-prompts',
        text: 'Upgrade prompt strategy',
        help_text: 'What triggers an upgrade prompt? (Hit limit, Complete action, Time-based) Where do you show upgrade CTAs? (Dashboard, In features, Modal, Banner)',
        type: 'textarea',
        required: true
      },
      {
        id: 'pricing-page-features',
        text: 'Pricing page features',
        help_text: 'Do you want an ROI/pricing calculator? Should you show social proof (logos, testimonials)? Will you offer annual discounts? If yes, what %?',
        type: 'textarea',
        required: false
      },
      {
        id: 'international-customers',
        text: 'International customer considerations',
        help_text: 'Need to handle EU VAT automatically? (Yes - use Paddle/Lemon Squeezy, No - use Stripe) Other tax/compliance considerations?',
        type: 'textarea',
        required: true
      }
    ]
  },
  {
    phase_number: 11,
    phase_name: 'Launch Readiness & Analytics',
    phase_description: 'Ensure infrastructure, monitoring, and compliance',
    questions: [
      {
        id: 'analytics-platform',
        text: 'Analytics platform',
        help_text: 'PostHog (open source, product analytics), Mixpanel (product analytics, events), Amplitude (product analytics, enterprise), Google Analytics (basic web analytics), Plausible (privacy-focused, simple), Multiple tools, Not sure - recommend',
        type: 'textarea',
        required: true
      },
      {
        id: 'error-monitoring',
        text: 'Error tracking & monitoring',
        help_text: 'Sentry (error tracking), Datadog (full observability), LogRocket (session replay + errors), Not needed yet',
        type: 'textarea',
        required: true
      },
      {
        id: 'uptime-sla',
        text: 'Uptime & SLA commitments',
        help_text: 'What uptime will you promise? (99%, 99.9%, 99.99%, No SLA yet) Status page needed?',
        type: 'textarea',
        required: true
      },
      {
        id: 'compliance-security',
        text: 'Compliance & security requirements',
        help_text: 'Do you need SOC 2? GDPR compliance required? Penetration testing planned? Data encryption at rest?',
        type: 'textarea',
        required: true
      },
      {
        id: 'scaling-prep',
        text: 'Scaling preparation',
        help_text: 'Expected traffic at launch (number of users), Load testing planned?, Auto-scaling configured?, CDN for static assets?',
        type: 'textarea',
        required: true
      }
    ]
  },
  {
    phase_number: 12,
    phase_name: 'GTM & AI Integration',
    phase_description: 'Plan go-to-market and AI-powered features',
    questions: [
      {
        id: 'gtm-motion',
        text: 'Go-to-market motion',
        help_text: 'Product-Led Growth (self-serve, try before buy), Sales-Led (demos, custom proposals), Channel/Partner-led (integrations, referrals), Community-led (open source, word of mouth), Combination',
        type: 'textarea',
        required: true
      },
      {
        id: 'ai-use-cases',
        text: 'AI/LLM use cases in your product',
        help_text: 'Chatbot/assistant, Content generation (text, images), Summarization (documents, conversations), Automation/workflow intelligence, Search/recommendations, Data analysis/insights, None - no AI planned, Other',
        type: 'textarea',
        required: true
      },
      {
        id: 'ai-modalities',
        text: 'If using AI - what modalities?',
        help_text: 'Text only, Text + Image, Text + Audio, Multimodal (Text + Image + Audio + Video)',
        type: 'textarea',
        required: false
      },
      {
        id: 'ai-requirements',
        text: 'AI model requirements',
        help_text: 'Budget constraint? (Low, Medium, High, No constraint) Need long context (100k+ tokens)? Privacy requirements? (Cloud API OK, Must self-host, Hybrid) Latency requirements? (Real-time < 1s, Standard < 5s, Batch OK)',
        type: 'textarea',
        required: false
      },
      {
        id: 'ai-gtm-integration',
        text: 'AI integration in GTM',
        help_text: 'How will AI tie into marketing? Will AI be part of onboarding? Is AI a core differentiator or nice-to-have feature?',
        type: 'textarea',
        required: false
      }
    ]
  }
]

async function updatePhaseTemplates() {
  console.log('🚀 Starting phase template update...\n')

  for (const template of phaseTemplates) {
    console.log(`📝 Updating Phase ${template.phase_number}: ${template.phase_name}`)

    const { data, error } = await supabase
      .from('phase_templates')
      .upsert({
        phase_number: template.phase_number,
        title: template.phase_name,
        description: template.phase_description,
        questions: template.questions,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'phase_number'
      })
      .select()

    if (error) {
      console.error(`❌ Error updating Phase ${template.phase_number}:`, error)
    } else {
      console.log(`✅ Successfully updated Phase ${template.phase_number} with ${template.questions.length} questions`)
    }
  }

  console.log('\n✨ Phase template update complete!')
}

updatePhaseTemplates()
  .then(() => {
    console.log('\n🎉 All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })

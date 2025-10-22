// Workflow phase definitions
export const WORKFLOW_PHASES = [
  {
    id: 1,
    title: "Problem & Solution Definition",
    description: "Define the core problem your SaaS solves and your unique solution approach",
    estimatedTime: 15,
  },
  {
    id: 2,
    title: "Target Market Analysis",
    description: "Identify and analyze your target audience, market size, and competition",
    estimatedTime: 20,
  },
  {
    id: 3,
    title: "Value Proposition & Pricing",
    description: "Define your unique value proposition and pricing strategy",
    estimatedTime: 15,
  },
  {
    id: 4,
    title: "Feature Planning & MVP",
    description: "Plan core features and define your minimum viable product",
    estimatedTime: 25,
  },
  {
    id: 5,
    title: "Technical Architecture",
    description: "Design your technical stack, database schema, and system architecture",
    estimatedTime: 30,
  },
  {
    id: 6,
    title: "User Experience Design",
    description: "Plan user flows, interface design, and user experience strategy",
    estimatedTime: 20,
  },
  {
    id: 7,
    title: "Security & Compliance",
    description: "Define security requirements, data protection, and compliance needs",
    estimatedTime: 15,
  },
  {
    id: 8,
    title: "Integration & APIs",
    description: "Plan third-party integrations and API strategy",
    estimatedTime: 20,
  },
  {
    id: 9,
    title: "Deployment & Infrastructure",
    description: "Design deployment strategy, hosting, and infrastructure requirements",
    estimatedTime: 25,
  },
  {
    id: 10,
    title: "Analytics & Monitoring",
    description: "Plan analytics, monitoring, and performance tracking",
    estimatedTime: 15,
  },
  {
    id: 11,
    title: "Marketing & Growth",
    description: "Define marketing strategy, user acquisition, and growth tactics",
    estimatedTime: 20,
  },
  {
    id: 12,
    title: "Launch & Scaling",
    description: "Plan launch strategy, scaling approach, and future development",
    estimatedTime: 20,
  },
] as const

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  PRO: {
    id: 'pro',
    name: 'Pro Plan',
    price: 14.99,
    currency: 'GBP',
    interval: 'month' as const,
    features: [
      'Unlimited blueprint generations',
      '12-phase guided workflow',
      'GPT-5 & Claude Sonnet 4 integration',
      'Exportable documentation',
      'Claude Code prompts',
      'EU VAT included',
      'Email support'
    ],
    stripePrice: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || '',
  }
} as const

// API endpoints
export const API_ROUTES = {
  AUTH: {
    SIGN_UP: '/api/auth/sign-up',
    SIGN_IN: '/api/auth/sign-in',
    SIGN_OUT: '/api/auth/sign-out',
    PROFILE: '/api/auth/profile',
  },
  WORKFLOW: {
    SESSIONS: '/api/workflow/sessions',
    ANSWERS: '/api/workflow/answers',
    GENERATE: '/api/workflow/generate',
  },
  PAYMENTS: {
    CHECKOUT: '/api/payments/checkout',
    WEBHOOK: '/api/payments/webhook',
    SUBSCRIPTION: '/api/payments/subscription',
  },
  AI: {
    GPT_WORKFLOW: '/api/ai/gpt-workflow',
    CLAUDE_PROCESS: '/api/ai/claude-process',
  },
  EXPORT: {
    GENERATE: '/api/export/generate',
    DOWNLOAD: '/api/export/download',
  }
} as const

// File generation templates
export const FILE_TEMPLATES = {
  CLAUDE_MD: 'claude-main',
  MODULE_README: 'module-readme',
  SETUP_PROMPT: 'setup-prompt',
  FEATURE_PROMPT: 'feature-prompt',
} as const

// Export file structure
export const EXPORT_STRUCTURE = {
  ROOT: '/',
  MODULES: '/modules/',
  PROMPTS: '/prompts/',
  DOCS: '/docs/',
} as const

// Rate limiting
export const RATE_LIMITS = {
  API_CALLS_PER_MINUTE: 10,
  EXPORT_GENERATIONS_PER_DAY: 5,
} as const

// Validation constants
export const VALIDATION = {
  SESSION_DESCRIPTION_MIN: 10,
  SESSION_DESCRIPTION_MAX: 500,
  ANSWER_TEXT_MIN: 1,
  ANSWER_TEXT_MAX: 2000,
  PHASE_COUNT: 12,
} as const
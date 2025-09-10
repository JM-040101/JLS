-- Migration: 003_seed_phase_templates
-- Description: Seed phase templates with workflow questions
-- Author: System
-- Date: 2024

-- Clear existing templates (if any)
TRUNCATE TABLE phase_templates;

-- ============================================
-- PHASE 1: Problem & Solution Definition
-- ============================================
INSERT INTO phase_templates (phase_number, title, description, estimated_time, questions, help_text)
VALUES (
  1,
  'Problem & Solution Definition',
  'Define the core problem your SaaS solves and your unique solution approach',
  15,
  '[
    {
      "id": "problem_statement",
      "type": "textarea",
      "label": "What specific problem does your SaaS solve?",
      "placeholder": "Describe the problem in detail...",
      "required": true,
      "validation": {"minLength": 50, "maxLength": 500}
    },
    {
      "id": "target_users",
      "type": "text",
      "label": "Who experiences this problem most?",
      "placeholder": "e.g., Small business owners, Marketing teams",
      "required": true,
      "validation": {"minLength": 10, "maxLength": 200}
    },
    {
      "id": "current_solutions",
      "type": "textarea",
      "label": "How is this problem currently being solved?",
      "placeholder": "Describe existing solutions or workarounds...",
      "required": true,
      "validation": {"minLength": 30, "maxLength": 400}
    },
    {
      "id": "solution_approach",
      "type": "textarea",
      "label": "What is your unique solution approach?",
      "placeholder": "Explain how your solution is different/better...",
      "required": true,
      "validation": {"minLength": 50, "maxLength": 500}
    },
    {
      "id": "key_benefits",
      "type": "textarea",
      "label": "What are the top 3 benefits of your solution?",
      "placeholder": "1. Saves time by...\n2. Reduces costs by...\n3. Improves quality by...",
      "required": true,
      "validation": {"minLength": 30, "maxLength": 300}
    }
  ]'::jsonb,
  'Focus on a specific, measurable problem. The clearer your problem definition, the better your solution will be.'
);

-- ============================================
-- PHASE 2: Target Market Analysis
-- ============================================
INSERT INTO phase_templates (phase_number, title, description, estimated_time, questions, help_text)
VALUES (
  2,
  'Target Market Analysis',
  'Identify and analyze your target audience, market size, and competition',
  20,
  '[
    {
      "id": "target_market",
      "type": "select",
      "label": "Primary target market",
      "required": true,
      "options": ["B2B", "B2C", "B2B2C", "B2G", "D2C"]
    },
    {
      "id": "market_size",
      "type": "select",
      "label": "Estimated market size",
      "required": true,
      "options": ["< $100M", "$100M - $1B", "$1B - $10B", "> $10B"]
    },
    {
      "id": "customer_segments",
      "type": "textarea",
      "label": "Describe your customer segments",
      "placeholder": "Primary: ...\nSecondary: ...",
      "required": true,
      "validation": {"minLength": 50, "maxLength": 500}
    },
    {
      "id": "competitors",
      "type": "textarea",
      "label": "List your top 3-5 competitors",
      "placeholder": "1. CompetitorName - their strength\n2. ...",
      "required": true,
      "validation": {"minLength": 30, "maxLength": 400}
    },
    {
      "id": "competitive_advantage",
      "type": "textarea",
      "label": "What is your competitive advantage?",
      "placeholder": "We are different because...",
      "required": true,
      "validation": {"minLength": 50, "maxLength": 400}
    }
  ]'::jsonb,
  'Be specific about your target audience. "Everyone" is not a valid target market.'
);

-- ============================================
-- PHASE 3: Value Proposition & Pricing
-- ============================================
INSERT INTO phase_templates (phase_number, title, description, estimated_time, questions, help_text)
VALUES (
  3,
  'Value Proposition & Pricing',
  'Define your unique value proposition and pricing strategy',
  15,
  '[
    {
      "id": "value_proposition",
      "type": "textarea",
      "label": "Write your value proposition statement",
      "placeholder": "We help [target customer] achieve [desired outcome] by [unique approach]",
      "required": true,
      "validation": {"minLength": 30, "maxLength": 200}
    },
    {
      "id": "pricing_model",
      "type": "select",
      "label": "Pricing model",
      "required": true,
      "options": ["Subscription", "Usage-based", "Tiered", "Freemium", "One-time", "Hybrid"]
    },
    {
      "id": "price_range",
      "type": "text",
      "label": "Target price range",
      "placeholder": "e.g., $29-99/month, $0.10 per API call",
      "required": true,
      "validation": {"minLength": 5, "maxLength": 100}
    },
    {
      "id": "pricing_tiers",
      "type": "textarea",
      "label": "Describe your pricing tiers (if applicable)",
      "placeholder": "Starter: $X - features...\nPro: $Y - features...",
      "required": false,
      "validation": {"maxLength": 500}
    },
    {
      "id": "revenue_projections",
      "type": "text",
      "label": "Year 1 revenue target",
      "placeholder": "e.g., $100K ARR",
      "required": true,
      "validation": {"minLength": 5, "maxLength": 50}
    }
  ]'::jsonb,
  'Price based on value delivered, not cost. Research competitor pricing thoroughly.'
);

-- ============================================
-- PHASE 4: Feature Planning & MVP
-- ============================================
INSERT INTO phase_templates (phase_number, title, description, estimated_time, questions, help_text)
VALUES (
  4,
  'Feature Planning & MVP',
  'Plan core features and define your minimum viable product',
  25,
  '[
    {
      "id": "core_features",
      "type": "textarea",
      "label": "List 5-7 core features for MVP",
      "placeholder": "1. User authentication\n2. Dashboard\n3. ...",
      "required": true,
      "validation": {"minLength": 50, "maxLength": 500}
    },
    {
      "id": "user_workflows",
      "type": "textarea",
      "label": "Describe the main user workflow",
      "placeholder": "User signs up → Creates project → ...",
      "required": true,
      "validation": {"minLength": 50, "maxLength": 400}
    },
    {
      "id": "mvp_timeline",
      "type": "select",
      "label": "MVP development timeline",
      "required": true,
      "options": ["1-2 months", "3-4 months", "5-6 months", "6+ months"]
    },
    {
      "id": "future_features",
      "type": "textarea",
      "label": "Post-MVP features (Phase 2)",
      "placeholder": "Features to add after launch...",
      "required": false,
      "validation": {"maxLength": 400}
    },
    {
      "id": "success_metrics",
      "type": "textarea",
      "label": "How will you measure MVP success?",
      "placeholder": "- User signups\n- Active users\n- ...",
      "required": true,
      "validation": {"minLength": 30, "maxLength": 300}
    }
  ]'::jsonb,
  'Focus on the minimum features needed to validate your core value proposition.'
);

-- ============================================
-- PHASE 5: Technical Architecture
-- ============================================
INSERT INTO phase_templates (phase_number, title, description, estimated_time, questions, help_text)
VALUES (
  5,
  'Technical Architecture',
  'Design your technical stack, database schema, and system architecture',
  30,
  '[
    {
      "id": "tech_stack",
      "type": "multiselect",
      "label": "Primary technology stack",
      "required": true,
      "options": ["Next.js", "React", "Vue", "Node.js", "Python", "Ruby", "Go", "PostgreSQL", "MongoDB", "Redis", "AWS", "GCP", "Azure", "Vercel", "Supabase"]
    },
    {
      "id": "architecture_type",
      "type": "select",
      "label": "Architecture pattern",
      "required": true,
      "options": ["Monolithic", "Microservices", "Serverless", "JAMstack", "Event-driven"]
    },
    {
      "id": "database_design",
      "type": "textarea",
      "label": "Describe main database entities",
      "placeholder": "Users, Projects, Teams, Subscriptions...",
      "required": true,
      "validation": {"minLength": 30, "maxLength": 400}
    },
    {
      "id": "api_design",
      "type": "select",
      "label": "API architecture",
      "required": true,
      "options": ["REST", "GraphQL", "gRPC", "WebSocket", "Hybrid"]
    },
    {
      "id": "scalability_plan",
      "type": "textarea",
      "label": "How will the system scale?",
      "placeholder": "Horizontal scaling, caching strategy, CDN...",
      "required": true,
      "validation": {"minLength": 50, "maxLength": 400}
    }
  ]'::jsonb,
  'Choose boring technology. Proven, stable tools are better than cutting-edge for MVP.'
);

-- ============================================
-- PHASE 6: User Experience Design
-- ============================================
INSERT INTO phase_templates (phase_number, title, description, estimated_time, questions, help_text)
VALUES (
  6,
  'User Experience Design',
  'Plan user flows, interface design, and user experience strategy',
  20,
  '[
    {
      "id": "design_style",
      "type": "select",
      "label": "Design style/theme",
      "required": true,
      "options": ["Minimal", "Modern", "Professional", "Playful", "Dark mode", "Glassmorphism"]
    },
    {
      "id": "key_pages",
      "type": "textarea",
      "label": "List key pages/screens",
      "placeholder": "Landing, Dashboard, Settings, Profile...",
      "required": true,
      "validation": {"minLength": 30, "maxLength": 300}
    },
    {
      "id": "onboarding_flow",
      "type": "textarea",
      "label": "Describe user onboarding flow",
      "placeholder": "Step 1: Sign up\nStep 2: ...",
      "required": true,
      "validation": {"minLength": 50, "maxLength": 400}
    },
    {
      "id": "mobile_strategy",
      "type": "select",
      "label": "Mobile strategy",
      "required": true,
      "options": ["Responsive web", "PWA", "Native app", "Mobile-first", "Desktop only"]
    },
    {
      "id": "accessibility",
      "type": "multiselect",
      "label": "Accessibility features",
      "required": true,
      "options": ["WCAG compliance", "Screen reader support", "Keyboard navigation", "High contrast mode", "Multi-language"]
    }
  ]'::jsonb,
  'Good UX is invisible. Users should achieve their goals without thinking about the interface.'
);

-- ============================================
-- PHASE 7: Security & Compliance
-- ============================================
INSERT INTO phase_templates (phase_number, title, description, estimated_time, questions, help_text)
VALUES (
  7,
  'Security & Compliance',
  'Define security requirements, data protection, and compliance needs',
  15,
  '[
    {
      "id": "data_sensitivity",
      "type": "select",
      "label": "Data sensitivity level",
      "required": true,
      "options": ["Public", "Internal", "Confidential", "Highly sensitive", "Regulated"]
    },
    {
      "id": "compliance_requirements",
      "type": "multiselect",
      "label": "Compliance requirements",
      "required": true,
      "options": ["GDPR", "CCPA", "HIPAA", "SOC 2", "ISO 27001", "PCI DSS", "None"]
    },
    {
      "id": "authentication_method",
      "type": "multiselect",
      "label": "Authentication methods",
      "required": true,
      "options": ["Email/Password", "SSO", "OAuth", "2FA", "Biometric", "Magic link"]
    },
    {
      "id": "data_encryption",
      "type": "textarea",
      "label": "Data encryption strategy",
      "placeholder": "At rest: AES-256\nIn transit: TLS 1.3\n...",
      "required": true,
      "validation": {"minLength": 30, "maxLength": 300}
    },
    {
      "id": "backup_strategy",
      "type": "textarea",
      "label": "Backup and disaster recovery plan",
      "placeholder": "Daily backups, 30-day retention...",
      "required": true,
      "validation": {"minLength": 30, "maxLength": 300}
    }
  ]'::jsonb,
  'Security is not optional. Build it in from the start, not as an afterthought.'
);

-- ============================================
-- PHASE 8: Integration & APIs
-- ============================================
INSERT INTO phase_templates (phase_number, title, description, estimated_time, questions, help_text)
VALUES (
  8,
  'Integration & APIs',
  'Plan third-party integrations and API strategy',
  20,
  '[
    {
      "id": "key_integrations",
      "type": "multiselect",
      "label": "Essential integrations",
      "required": true,
      "options": ["Stripe", "PayPal", "Slack", "Google", "Microsoft", "Zapier", "Webhook", "Email", "SMS", "Analytics"]
    },
    {
      "id": "api_access",
      "type": "select",
      "label": "API access model",
      "required": true,
      "options": ["No API", "Private API", "Public API", "Partner API", "Marketplace"]
    },
    {
      "id": "webhook_events",
      "type": "textarea",
      "label": "Key webhook events (if applicable)",
      "placeholder": "user.created, payment.success, ...",
      "required": false,
      "validation": {"maxLength": 300}
    },
    {
      "id": "rate_limiting",
      "type": "text",
      "label": "API rate limiting strategy",
      "placeholder": "e.g., 100 requests/minute per user",
      "required": true,
      "validation": {"minLength": 10, "maxLength": 100}
    },
    {
      "id": "documentation_plan",
      "type": "select",
      "label": "API documentation approach",
      "required": true,
      "options": ["OpenAPI/Swagger", "Postman", "Custom docs", "No documentation", "Interactive playground"]
    }
  ]'::jsonb,
  'Every integration adds complexity. Only integrate what directly serves your core value prop.'
);

-- ============================================
-- PHASE 9: Deployment & Infrastructure
-- ============================================
INSERT INTO phase_templates (phase_number, title, description, estimated_time, questions, help_text)
VALUES (
  9,
  'Deployment & Infrastructure',
  'Design deployment strategy, hosting, and infrastructure requirements',
  25,
  '[
    {
      "id": "hosting_platform",
      "type": "select",
      "label": "Primary hosting platform",
      "required": true,
      "options": ["Vercel", "AWS", "GCP", "Azure", "Heroku", "DigitalOcean", "Self-hosted"]
    },
    {
      "id": "deployment_strategy",
      "type": "select",
      "label": "Deployment strategy",
      "required": true,
      "options": ["Continuous deployment", "Staged releases", "Blue-green", "Canary", "Manual"]
    },
    {
      "id": "environments",
      "type": "multiselect",
      "label": "Environment setup",
      "required": true,
      "options": ["Development", "Staging", "Production", "QA", "Demo"]
    },
    {
      "id": "cicd_tools",
      "type": "multiselect",
      "label": "CI/CD tools",
      "required": true,
      "options": ["GitHub Actions", "GitLab CI", "Jenkins", "CircleCI", "Vercel", "Netlify"]
    },
    {
      "id": "infrastructure_budget",
      "type": "select",
      "label": "Monthly infrastructure budget",
      "required": true,
      "options": ["< $100", "$100-500", "$500-2000", "$2000-5000", "> $5000"]
    }
  ]'::jsonb,
  'Start with managed services. You can always migrate to self-hosted when you have the team for it.'
);

-- ============================================
-- PHASE 10: Analytics & Monitoring
-- ============================================
INSERT INTO phase_templates (phase_number, title, description, estimated_time, questions, help_text)
VALUES (
  10,
  'Analytics & Monitoring',
  'Plan analytics, monitoring, and performance tracking',
  15,
  '[
    {
      "id": "analytics_tools",
      "type": "multiselect",
      "label": "Analytics tools",
      "required": true,
      "options": ["Google Analytics", "Mixpanel", "Amplitude", "PostHog", "Segment", "Custom"]
    },
    {
      "id": "key_metrics",
      "type": "textarea",
      "label": "Key metrics to track",
      "placeholder": "DAU, MAU, Churn rate, LTV, CAC...",
      "required": true,
      "validation": {"minLength": 30, "maxLength": 300}
    },
    {
      "id": "monitoring_tools",
      "type": "multiselect",
      "label": "Monitoring tools",
      "required": true,
      "options": ["Sentry", "DataDog", "New Relic", "CloudWatch", "Grafana", "Custom"]
    },
    {
      "id": "alerting_strategy",
      "type": "textarea",
      "label": "Alerting strategy",
      "placeholder": "Critical: Immediate\nHigh: Within 1 hour\n...",
      "required": true,
      "validation": {"minLength": 30, "maxLength": 300}
    },
    {
      "id": "performance_goals",
      "type": "textarea",
      "label": "Performance goals",
      "placeholder": "Page load: < 2s\nAPI response: < 200ms\n...",
      "required": true,
      "validation": {"minLength": 30, "maxLength": 300}
    }
  ]'::jsonb,
  'Measure what matters. Vanity metrics waste time - focus on metrics that drive decisions.'
);

-- ============================================
-- PHASE 11: Marketing & Growth
-- ============================================
INSERT INTO phase_templates (phase_number, title, description, estimated_time, questions, help_text)
VALUES (
  11,
  'Marketing & Growth',
  'Define marketing strategy, user acquisition, and growth tactics',
  20,
  '[
    {
      "id": "marketing_channels",
      "type": "multiselect",
      "label": "Primary marketing channels",
      "required": true,
      "options": ["SEO", "Content", "Social media", "Paid ads", "Email", "Partnerships", "Product-led", "Sales"]
    },
    {
      "id": "launch_strategy",
      "type": "select",
      "label": "Launch strategy",
      "required": true,
      "options": ["Soft launch", "Beta launch", "Product Hunt", "Press release", "Influencer", "Gradual rollout"]
    },
    {
      "id": "customer_acquisition_cost",
      "type": "text",
      "label": "Target CAC (Customer Acquisition Cost)",
      "placeholder": "e.g., $50 per customer",
      "required": true,
      "validation": {"minLength": 5, "maxLength": 50}
    },
    {
      "id": "growth_tactics",
      "type": "textarea",
      "label": "Growth tactics for first 6 months",
      "placeholder": "Referral program, content marketing...",
      "required": true,
      "validation": {"minLength": 50, "maxLength": 400}
    },
    {
      "id": "retention_strategy",
      "type": "textarea",
      "label": "User retention strategy",
      "placeholder": "Onboarding emails, feature education...",
      "required": true,
      "validation": {"minLength": 30, "maxLength": 300}
    }
  ]'::jsonb,
  'The best marketing is a great product. Focus on product-market fit before scaling marketing.'
);

-- ============================================
-- PHASE 12: Launch & Scaling
-- ============================================
INSERT INTO phase_templates (phase_number, title, description, estimated_time, questions, help_text)
VALUES (
  12,
  'Launch & Scaling',
  'Plan launch strategy, scaling approach, and future development',
  20,
  '[
    {
      "id": "launch_date",
      "type": "text",
      "label": "Target launch date",
      "placeholder": "e.g., Q2 2024",
      "required": true,
      "validation": {"minLength": 5, "maxLength": 50}
    },
    {
      "id": "launch_goals",
      "type": "textarea",
      "label": "Launch success criteria",
      "placeholder": "100 signups, 10 paying customers...",
      "required": true,
      "validation": {"minLength": 30, "maxLength": 300}
    },
    {
      "id": "scaling_triggers",
      "type": "textarea",
      "label": "When to scale (triggers)",
      "placeholder": "At 1000 users, scale database\nAt $10K MRR, hire support...",
      "required": true,
      "validation": {"minLength": 50, "maxLength": 400}
    },
    {
      "id": "team_growth",
      "type": "textarea",
      "label": "Team growth plan",
      "placeholder": "First hire: Developer\nSecond hire: ...",
      "required": true,
      "validation": {"minLength": 30, "maxLength": 300}
    },
    {
      "id": "funding_strategy",
      "type": "select",
      "label": "Funding strategy",
      "required": true,
      "options": ["Bootstrap", "Revenue-funded", "Angel investment", "VC funding", "Crowdfunding", "Grants"]
    }
  ]'::jsonb,
  'Launch early and iterate. Perfect is the enemy of shipped.'
);
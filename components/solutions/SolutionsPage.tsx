'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle, Sparkles, AlertTriangle, Lightbulb, Target, Zap } from 'lucide-react'
import DotGrid from '@/components/backgrounds/DotGrid'
import GradientOrbs from '@/components/dashboard/GradientOrbs'
import SharpAxeLogo from '@/components/navigation/SharpAxeLogo'
import { branding } from '@/branding.config'

export default function SolutionsPage() {
  return (
    <div className="min-h-screen relative" style={{ background: branding.colors.background }}>
      <div className="fixed inset-0 z-0">
        <DotGrid
          dotSize={3}
          gap={25}
          baseColor={branding.colors.divider}
          activeColor={branding.colors.accent}
          proximity={120}
          shockRadius={200}
          shockStrength={3}
        />
      </div>
      <GradientOrbs />

      <div className="relative z-10">
        <nav
          className="fixed top-0 left-0 right-0 z-50 mx-auto mt-4 transition-all duration-300"
          style={{
            maxWidth: '1400px',
            width: 'calc(100% - 32px)',
            height: '60px',
          }}
        >
          <div
            className="relative h-full rounded-2xl overflow-visible"
            style={{
              background: 'rgba(18, 20, 28, 0.8)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(6, 182, 212, 0.1)',
            }}
          >
            <div
              className="absolute bottom-0 left-0 right-0 h-[2px] opacity-60"
              style={{
                background: `linear-gradient(90deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo}, ${branding.colors.gradientFrom})`,
                borderRadius: '0 0 16px 16px',
              }}
            />

            <div className="flex items-center h-full px-6 relative">
              <div className="flex items-center flex-shrink-0">
                <Link href="/">
                  <SharpAxeLogo />
                </Link>
              </div>

              <nav className="hidden md:flex items-center space-x-2 absolute left-1/2 transform -translate-x-1/2">
                <Link
                  href="/solutions"
                  className="relative px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: `linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(20, 184, 166, 0.2))`,
                    color: branding.colors.textHeading,
                    boxShadow: '0 0 20px rgba(6, 182, 212, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  }}
                >
                  Solutions
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                    }}
                  />
                </Link>
              </nav>

              <div className="flex items-center space-x-3 flex-shrink-0 ml-auto">
                <Link
                  href="/auth/sign-in"
                  className="px-6 py-2.5 rounded-xl font-medium transition-all duration-200"
                  style={{
                    color: branding.colors.text,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.borderColor = branding.colors.accent
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                    color: branding.colors.background,
                    boxShadow: `0 0 20px ${branding.colors.accentGlow}`,
                  }}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <section className="pt-32 pb-24 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-16">
              <h1
                className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r leading-tight"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${branding.colors.textHeading} 0%, ${branding.colors.accent} 50%, ${branding.colors.gradientTo} 100%)`,
                  fontFamily: branding.fonts.heading,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                The Right Way to Build AI-Powered SaaS
              </h1>
              <p className="text-xl" style={{ color: branding.colors.text }}>
                Why planning beats one-shot prompting every time
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <div
              className="rounded-3xl p-12"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                backdropFilter: 'blur(60px) saturate(200%)',
                WebkitBackdropFilter: 'blur(60px) saturate(200%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
              }}
            >
              <div className="flex items-center mb-6">
                <AlertTriangle className="w-8 h-8 mr-3" style={{ color: branding.colors.accent }} />
                <h2
                  className="text-3xl font-bold"
                  style={{
                    color: branding.colors.textHeading,
                    fontFamily: branding.fonts.heading
                  }}
                >
                  The Problem: One-Shot Prompting Fails
                </h2>
              </div>
              <div className="space-y-6" style={{ color: branding.colors.text }}>
                <p className="text-lg leading-relaxed">
                  Building an AI-powered SaaS application is complex. Many developers try to shortcut the process with a single prompt: <em style={{ color: branding.colors.textMuted }}>"Build me a SaaS app for meal planning with AI recommendations."</em>
                </p>
                <p className="text-lg leading-relaxed">
                  This approach <strong style={{ color: branding.colors.textHeading }}>consistently fails</strong> because:
                </p>
                <ul className="space-y-4 ml-6">
                  <li className="flex items-start">
                    <span className="mr-3 mt-1" style={{ color: branding.colors.accent }}>•</span>
                    <span><strong style={{ color: branding.colors.textHeading }}>No architectural planning</strong> - AI generates code without understanding your full system requirements, leading to incompatible modules and technical debt</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 mt-1" style={{ color: branding.colors.accent }}>•</span>
                    <span><strong style={{ color: branding.colors.textHeading }}>Missing business context</strong> - The AI doesn't know your target users, market positioning, or competitive advantages</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 mt-1" style={{ color: branding.colors.accent }}>•</span>
                    <span><strong style={{ color: branding.colors.textHeading }}>Security oversights</strong> - Critical security requirements like authentication, data validation, and compliance aren't properly specified</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 mt-1" style={{ color: branding.colors.accent }}>•</span>
                    <span><strong style={{ color: branding.colors.textHeading }}>Scalability issues</strong> - No consideration for database design, caching strategies, or infrastructure requirements</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 mt-1" style={{ color: branding.colors.accent }}>•</span>
                    <span><strong style={{ color: branding.colors.textHeading }}>Inconsistent implementation</strong> - Different coding patterns across features, making maintenance difficult</span>
                  </li>
                </ul>
                <div
                  className="mt-8 p-6 rounded-xl border-l-4"
                  style={{
                    background: `linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(220, 38, 38, 0.05))`,
                    borderColor: '#dc2626'
                  }}
                >
                  <p className="text-lg font-semibold" style={{ color: branding.colors.textHeading }}>
                    The result? Spaghetti code that breaks when you try to extend it, requiring complete rewrites.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <div
              className="rounded-3xl p-12"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                backdropFilter: 'blur(60px) saturate(200%)',
                WebkitBackdropFilter: 'blur(60px) saturate(200%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
              }}
            >
              <div className="flex items-center mb-6">
                <Lightbulb className="w-8 h-8 mr-3" style={{ color: branding.colors.accent }} />
                <h2
                  className="text-3xl font-bold"
                  style={{
                    color: branding.colors.textHeading,
                    fontFamily: branding.fonts.heading
                  }}
                >
                  The Solution: Strategic Planning First
                </h2>
              </div>
              <div className="space-y-6" style={{ color: branding.colors.text }}>
                <p className="text-lg leading-relaxed">
                  <strong style={{ color: branding.colors.textHeading }}>SharpAxe</strong> takes a fundamentally different approach: <strong style={{ color: branding.colors.accent }}>plan everything first, build second</strong>.
                </p>
                <p className="text-lg leading-relaxed">
                  Our 12-phase guided workflow ensures you've thought through every critical aspect of your SaaS before writing a single line of code:
                </p>
                <div className="grid md:grid-cols-2 gap-6 mt-8">
                  {[
                    { phase: 'Phase 1-3', title: 'Market & Users', desc: 'Define your problem, target audience, and competitive positioning' },
                    { phase: 'Phase 4-6', title: 'Features & UX', desc: 'Detail core features, user workflows, and interface requirements' },
                    { phase: 'Phase 7-9', title: 'Technical Architecture', desc: 'Plan tech stack, database schema, API design, and integrations' },
                    { phase: 'Phase 10-12', title: 'Security & Launch', desc: 'Specify security requirements, deployment strategy, and monetization' }
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="p-6 rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, ${branding.colors.accent}15, ${branding.colors.gradientTo}15)`,
                        border: `1px solid ${branding.colors.accent}40`
                      }}
                    >
                      <div className="text-sm font-semibold mb-2" style={{ color: branding.colors.accent }}>
                        {item.phase}
                      </div>
                      <h3 className="text-xl font-bold mb-2" style={{ color: branding.colors.textHeading }}>
                        {item.title}
                      </h3>
                      <p style={{ color: branding.colors.text }}>
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <div
              className="rounded-3xl p-12"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                backdropFilter: 'blur(60px) saturate(200%)',
                WebkitBackdropFilter: 'blur(60px) saturate(200%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
              }}
            >
              <div className="flex items-center mb-6">
                <Target className="w-8 h-8 mr-3" style={{ color: branding.colors.accent }} />
                <h2
                  className="text-3xl font-bold"
                  style={{
                    color: branding.colors.textHeading,
                    fontFamily: branding.fonts.heading
                  }}
                >
                  Why This Works with Claude Code
                </h2>
              </div>
              <div className="space-y-6" style={{ color: branding.colors.text }}>
                <p className="text-lg leading-relaxed">
                  <strong style={{ color: branding.colors.textHeading }}>Claude Code</strong> is Anthropic's AI coding assistant that excels at implementing well-defined specifications. When you provide comprehensive context, it can:
                </p>
                <ul className="space-y-4 ml-6">
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 mr-3 mt-0.5 flex-shrink-0" style={{ color: branding.colors.accent }} />
                    <span><strong style={{ color: branding.colors.textHeading }}>Follow architectural patterns consistently</strong> across all modules</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 mr-3 mt-0.5 flex-shrink-0" style={{ color: branding.colors.accent }} />
                    <span><strong style={{ color: branding.colors.textHeading }}>Implement security best practices</strong> from the ground up</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 mr-3 mt-0.5 flex-shrink-0" style={{ color: branding.colors.accent }} />
                    <span><strong style={{ color: branding.colors.textHeading }}>Generate production-ready code</strong> that scales with your business</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 mr-3 mt-0.5 flex-shrink-0" style={{ color: branding.colors.accent }} />
                    <span><strong style={{ color: branding.colors.textHeading }}>Maintain code quality standards</strong> throughout the project</span>
                  </li>
                </ul>
                <div
                  className="mt-8 p-6 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${branding.colors.accent}15, ${branding.colors.gradientTo}15)`,
                    border: `1px solid ${branding.colors.accent}40`
                  }}
                >
                  <p className="text-lg font-semibold" style={{ color: branding.colors.textHeading }}>
                    SharpAxe generates the perfect blueprint for Claude Code to execute flawlessly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <div
              className="rounded-3xl p-12"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                backdropFilter: 'blur(60px) saturate(200%)',
                WebkitBackdropFilter: 'blur(60px) saturate(200%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
              }}
            >
              <div className="flex items-center mb-6">
                <Zap className="w-8 h-8 mr-3" style={{ color: branding.colors.accent }} />
                <h2
                  className="text-3xl font-bold"
                  style={{
                    color: branding.colors.textHeading,
                    fontFamily: branding.fonts.heading
                  }}
                >
                  What You Get
                </h2>
              </div>
              <div className="space-y-6" style={{ color: branding.colors.text }}>
                <p className="text-lg leading-relaxed">
                  After completing the 12-phase workflow, SharpAxe generates a complete project package:
                </p>
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                  {[
                    { title: 'README.md', items: ['Project overview', 'Architecture diagrams', 'Tech stack justification', 'Feature descriptions'] },
                    { title: 'CLAUDE.md', items: ['Setup instructions', 'Development guidelines', 'Project context', 'Best practices'] },
                    { title: '8 Module Docs', items: ['Auth module spec', 'API module spec', 'Database schema', 'UI/UX specifications'] },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="p-6 rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, ${branding.colors.accent}10, ${branding.colors.gradientTo}10)`,
                        border: `1px solid ${branding.colors.accent}30`
                      }}
                    >
                      <h3 className="text-xl font-bold mb-4" style={{ color: branding.colors.textHeading }}>
                        {item.title}
                      </h3>
                      <ul className="space-y-2">
                        {item.items.map((subitem, i) => (
                          <li key={i} className="flex items-start text-sm">
                            <span className="mr-2" style={{ color: branding.colors.accent }}>→</span>
                            <span>{subitem}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div
                  className="mt-8 p-8 rounded-xl text-center"
                  style={{
                    background: `linear-gradient(135deg, ${branding.colors.accent}20, ${branding.colors.gradientTo}20)`,
                    border: `2px solid ${branding.colors.accent}60`
                  }}
                >
                  <h3 className="text-2xl font-bold mb-3" style={{ color: branding.colors.textHeading }}>
                    Plus: 9 Executable Prompts
                  </h3>
                  <p className="text-lg mb-4" style={{ color: branding.colors.text }}>
                    Ready-to-use prompts for Claude Code to build your entire application, module by module
                  </p>
                  <div className="inline-flex items-center text-sm font-semibold" style={{ color: branding.colors.accent }}>
                    <Sparkles className="w-5 h-5 mr-2" />
                    21 total files • 5-6 minute export • Production-ready documentation
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2
              className="text-4xl font-bold mb-6"
              style={{
                color: branding.colors.textHeading,
                fontFamily: branding.fonts.heading
              }}
            >
              Ready to Build the Right Way?
            </h2>
            <p className="text-xl mb-10" style={{ color: branding.colors.text }}>
              Stop wasting time on failed one-shot attempts. Plan first, build confidently.
            </p>
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center text-xl px-10 py-5 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                color: branding.colors.background,
                boxShadow: `0 0 30px ${branding.colors.accentGlow}`,
              }}
            >
              Start Your Blueprint
              <ArrowRight className="ml-3 w-6 h-6" />
            </Link>
          </div>
        </section>

        <footer
          className="py-16 mt-20"
          style={{
            background: 'linear-gradient(135deg, rgba(28, 31, 46, 0.8), rgba(18, 20, 28, 0.9))',
            backdropFilter: 'blur(20px)',
            borderTop: `1px solid ${branding.colors.divider}`,
          }}
        >
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                }}
              >
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span
                className="text-2xl font-bold"
                style={{
                  color: branding.colors.textHeading,
                  fontFamily: branding.fonts.heading
                }}
              >
                {branding.name}
              </span>
            </div>
            <p style={{ color: branding.colors.textMuted }}>
              {branding.tagline}
            </p>
            <p className="text-sm mt-6" style={{ color: branding.colors.textMuted }}>
              © 2024 {branding.name}. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

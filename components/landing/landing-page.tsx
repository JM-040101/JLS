'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Zap, FileText, Download, X, Sparkles } from 'lucide-react'
import DotGrid from '@/components/backgrounds/DotGrid'
import GradientOrbs from '@/components/dashboard/GradientOrbs'
import SharpAxeLogo from '@/components/navigation/SharpAxeLogo'
import { branding } from '@/branding.config'
import { MultiTierPricingSection } from '@/components/pricing/multi-tier-pricing-section'

export default function LandingPage() {
  const [showDemo, setShowDemo] = useState(false)
  const [isNavVisible, setIsNavVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Show nav when at top of page
      if (currentScrollY < 10) {
        setIsNavVisible(true)
      }
      // Hide nav when scrolling down
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsNavVisible(false)
      }
      // Show nav when scrolling up
      else if (currentScrollY < lastScrollY) {
        setIsNavVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

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
          className="fixed left-0 right-0 z-50 transition-all duration-300"
          style={{
            width: '100%',
            height: '60px',
            top: isNavVisible ? '0' : '-60px',
            opacity: isNavVisible ? 1 : 0,
          }}
        >
          <div
            className="relative h-full overflow-visible"
            style={{
              background: 'rgba(18, 20, 28, 0.9)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderBottom: '1px solid rgba(6, 182, 212, 0.2)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div
              className="absolute bottom-0 left-0 right-0 h-[2px] opacity-60"
              style={{
                background: `linear-gradient(90deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo}, ${branding.colors.gradientFrom})`,
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
                    color: branding.colors.textMuted,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = branding.colors.accent}
                  onMouseLeave={(e) => e.currentTarget.style.color = branding.colors.textMuted}
                >
                  Solutions
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
          <div className="container mx-auto">
            <div
              className="max-w-5xl mx-auto rounded-3xl p-12 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                backdropFilter: 'blur(60px) saturate(200%)',
                WebkitBackdropFilter: 'blur(60px) saturate(200%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
              }}
            >
              <div
                className="w-24 h-1.5 mx-auto mb-8 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                  boxShadow: `0 0 20px ${branding.colors.accentGlow}`
                }}
              />

              <h1
                className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r leading-tight"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${branding.colors.textHeading} 0%, ${branding.colors.accent} 50%, ${branding.colors.gradientTo} 100%)`,
                  fontFamily: branding.fonts.heading,
                  WebkitBackdropClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Transform Your SaaS Ideas Into Comprehensive Blueprints
              </h1>

              <p
                className="text-xl mb-10 max-w-3xl mx-auto leading-relaxed"
                style={{
                  color: branding.colors.textMuted,
                  lineHeight: '1.8'
                }}
              >
                A guided 12-phase workflow that transforms your SaaS concepts into detailed technical blueprints
                with exportable documentation and Claude Code prompts.
              </p>

              <div className="flex justify-center gap-4 flex-wrap">
                <Link
                  href="/auth/sign-up"
                  className="inline-flex items-center px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                    color: branding.colors.background,
                    boxShadow: `0 0 30px ${branding.colors.accentGlow}`,
                  }}
                >
                  Start Building Your Blueprint
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <button
                  onClick={() => setShowDemo(true)}
                  className="px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: branding.colors.textHeading,
                    border: `1px solid ${branding.colors.accent}60`,
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.borderColor = branding.colors.accent
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    e.currentTarget.style.borderColor = `${branding.colors.accent}60`
                  }}
                >
                  View Demo
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2
                className="text-4xl font-bold mb-4"
                style={{
                  color: branding.colors.textHeading,
                  fontFamily: branding.fonts.heading
                }}
              >
                Everything You Need to Plan Your SaaS
              </h2>
              <p
                className="text-lg max-w-2xl mx-auto"
                style={{ color: branding.colors.textMuted }}
              >
                Our AI-powered workflow guides you through every aspect of SaaS planning,
                from concept to technical implementation.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div
                className="text-center p-8 rounded-3xl transition-all duration-300 transform hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                  backdropFilter: 'blur(60px) saturate(200%)',
                  WebkitBackdropFilter: 'blur(60px) saturate(200%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{
                    background: `linear-gradient(135deg, ${branding.colors.gradientFrom}40, ${branding.colors.gradientTo}40)`,
                    border: `1px solid ${branding.colors.accent}60`,
                  }}
                >
                  <Zap className="w-8 h-8" style={{ color: branding.colors.accent }} />
                </div>
                <h3
                  className="text-2xl font-bold mb-3"
                  style={{
                    color: branding.colors.textHeading,
                    fontFamily: branding.fonts.heading
                  }}
                >
                  12-Phase Guided Workflow
                </h3>
                <p style={{ color: branding.colors.text, lineHeight: '1.7' }}>
                  Sequential phases covering everything from market analysis to technical architecture,
                  ensuring no critical aspect is overlooked.
                </p>
              </div>

              <div
                className="text-center p-8 rounded-3xl transition-all duration-300 transform hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                  backdropFilter: 'blur(60px) saturate(200%)',
                  WebkitBackdropFilter: 'blur(60px) saturate(200%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{
                    background: `linear-gradient(135deg, ${branding.colors.gradientFrom}40, ${branding.colors.gradientTo}40)`,
                    border: `1px solid ${branding.colors.accent}60`,
                  }}
                >
                  <FileText className="w-8 h-8" style={{ color: branding.colors.accent }} />
                </div>
                <h3
                  className="text-2xl font-bold mb-3"
                  style={{
                    color: branding.colors.textHeading,
                    fontFamily: branding.fonts.heading
                  }}
                >
                  AI-Powered Documentation
                </h3>
                <p style={{ color: branding.colors.text, lineHeight: '1.7' }}>
                  GPT-5 and Claude Sonnet 4 work together to transform your answers into
                  comprehensive technical documentation and implementation guides.
                </p>
              </div>

              <div
                className="text-center p-8 rounded-3xl transition-all duration-300 transform hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                  backdropFilter: 'blur(60px) saturate(200%)',
                  WebkitBackdropFilter: 'blur(60px) saturate(200%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{
                    background: `linear-gradient(135deg, ${branding.colors.gradientFrom}40, ${branding.colors.gradientTo}40)`,
                    border: `1px solid ${branding.colors.accent}60`,
                  }}
                >
                  <Download className="w-8 h-8" style={{ color: branding.colors.accent }} />
                </div>
                <h3
                  className="text-2xl font-bold mb-3"
                  style={{
                    color: branding.colors.textHeading,
                    fontFamily: branding.fonts.heading
                  }}
                >
                  Exportable Blueprints
                </h3>
                <p style={{ color: branding.colors.text, lineHeight: '1.7' }}>
                  Download complete project blueprints with README files, CLAUDE.md instructions,
                  and executable prompts for Claude Code.
                </p>
              </div>
            </div>
          </div>
        </section>

        <MultiTierPricingSection />

        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2
                className="text-4xl font-bold mb-4"
                style={{
                  color: branding.colors.textHeading,
                  fontFamily: branding.fonts.heading
                }}
              >
                Why Choose SharpAxe?
              </h2>
              <p className="text-lg" style={{ color: branding.colors.textMuted }}>
                Purpose-built for modern SaaS development with Claude Code
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div
                className="p-8 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <h3 className="text-2xl font-bold mb-3" style={{ color: branding.colors.textHeading }}>
                  🎯 Specialized for Claude Code
                </h3>
                <p style={{ color: branding.colors.text, lineHeight: '1.7' }}>
                  Unlike generic project planning tools, SharpAxe generates documentation and prompts specifically optimized for Claude Code's capabilities. Each blueprint includes executable prompts that Claude Code can use to build your entire application.
                </p>
              </div>

              <div
                className="p-8 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <h3 className="text-2xl font-bold mb-3" style={{ color: branding.colors.textHeading }}>
                  🤖 Dual AI Architecture
                </h3>
                <p style={{ color: branding.colors.text, lineHeight: '1.7' }}>
                  We use GPT-5 for intelligent conversation and question-asking, then Claude Sonnet 4 for technical documentation generation. This combination ensures both thorough planning and implementation-ready specifications.
                </p>
              </div>

              <div
                className="p-8 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <h3 className="text-2xl font-bold mb-3" style={{ color: branding.colors.textHeading }}>
                  📋 Comprehensive Planning
                </h3>
                <p style={{ color: branding.colors.text, lineHeight: '1.7' }}>
                  Our 12-phase workflow covers everything: market analysis, user personas, features, tech stack, database schema, API design, security, deployment, and more. Nothing gets overlooked.
                </p>
              </div>

              <div
                className="p-8 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <h3 className="text-2xl font-bold mb-3" style={{ color: branding.colors.textHeading }}>
                  ⚡ Fast & Efficient
                </h3>
                <p style={{ color: branding.colors.text, lineHeight: '1.7' }}>
                  Complete your blueprint in 30-45 minutes, then export in 5-6 minutes. Get 21 professional files including README, module docs, prompts, and architecture diagrams - ready to start building immediately.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { number: '12', label: 'Guided Phases' },
                { number: '21', label: 'Generated Files' },
                { number: '9', label: 'Claude Prompts' },
                { number: '5min', label: 'Export Time' }
              ].map((stat, index) => (
                <div
                  key={index}
                  className="text-center p-6 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${branding.colors.accent}15, ${branding.colors.gradientTo}15)`,
                    border: `1px solid ${branding.colors.accent}40`
                  }}
                >
                  <div
                    className="text-4xl font-bold mb-2"
                    style={{
                      background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {stat.number}
                  </div>
                  <div className="text-sm font-semibold" style={{ color: branding.colors.text }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
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
            <p className="mb-6" style={{ color: branding.colors.text }}>
              Transform ideas into actionable SaaS blueprints with AI-powered guidance.
            </p>
            <p className="text-sm" style={{ color: branding.colors.textMuted }}>
              © 2024 {branding.name}. All rights reserved.
            </p>
          </div>
        </footer>
      </div>

      {showDemo && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)' }}>
          <div
            className="rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            style={{
              background: 'linear-gradient(135deg, rgba(28, 31, 46, 0.95), rgba(18, 20, 28, 0.98))',
              backdropFilter: 'blur(60px) saturate(200%)',
              WebkitBackdropFilter: 'blur(60px) saturate(200%)',
              border: `1px solid ${branding.colors.accent}60`,
              boxShadow: `0 20px 60px 0 rgba(0, 0, 0, 0.7), 0 0 80px ${branding.colors.accentGlow}`,
            }}
          >
            <div
              className="sticky top-0 px-8 py-6 flex justify-between items-center rounded-t-3xl"
              style={{
                background: 'rgba(28, 31, 46, 0.95)',
                borderBottom: `1px solid ${branding.colors.divider}`,
                backdropFilter: 'blur(20px)',
              }}
            >
              <h2
                className="text-3xl font-bold"
                style={{
                  color: branding.colors.textHeading,
                  fontFamily: branding.fonts.heading
                }}
              >
                How {branding.name} Works
              </h2>
              <button
                onClick={() => setShowDemo(false)}
                className="p-2 rounded-xl transition-all duration-200"
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
                aria-label="Close demo"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                    style={{
                      background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                      color: branding.colors.background
                    }}
                  >
                    1
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2" style={{ color: branding.colors.textHeading, fontFamily: branding.fonts.heading }}>
                      Start Your 12-Phase Workflow
                    </h3>
                    <p className="mb-3" style={{ color: branding.colors.text }}>
                      Answer guided questions about your SaaS idea across 12 comprehensive phases:
                    </p>
                    <ul className="grid grid-cols-2 gap-2 text-sm">
                      <li className="flex items-center" style={{ color: branding.colors.text }}>
                        <CheckCircle className="w-4 h-4 mr-2" style={{ color: branding.colors.accent }} />
                        Market Analysis
                      </li>
                      <li className="flex items-center" style={{ color: branding.colors.text }}>
                        <CheckCircle className="w-4 h-4 mr-2" style={{ color: branding.colors.accent }} />
                        User Personas
                      </li>
                      <li className="flex items-center" style={{ color: branding.colors.text }}>
                        <CheckCircle className="w-4 h-4 mr-2" style={{ color: branding.colors.accent }} />
                        Core Features
                      </li>
                      <li className="flex items-center" style={{ color: branding.colors.text }}>
                        <CheckCircle className="w-4 h-4 mr-2" style={{ color: branding.colors.accent }} />
                        Tech Stack
                      </li>
                      <li className="flex items-center" style={{ color: branding.colors.text }}>
                        <CheckCircle className="w-4 h-4 mr-2" style={{ color: branding.colors.accent }} />
                        Architecture
                      </li>
                      <li className="flex items-center" style={{ color: branding.colors.text }}>
                        <CheckCircle className="w-4 h-4 mr-2" style={{ color: branding.colors.accent }} />
                        Security & Compliance
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                    style={{
                      background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                      color: branding.colors.background
                    }}
                  >
                    2
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2" style={{ color: branding.colors.textHeading, fontFamily: branding.fonts.heading }}>
                      AI Generates Your Blueprint
                    </h3>
                    <p className="mb-3" style={{ color: branding.colors.text }}>
                      Our AI models (GPT-5 & Claude Sonnet 4) process your answers and create:
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start" style={{ color: branding.colors.text }}>
                        <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" style={{ color: branding.colors.accent }} />
                        <span><strong style={{ color: branding.colors.textHeading }}>README.md:</strong> Project overview with architecture diagrams</span>
                      </li>
                      <li className="flex items-start" style={{ color: branding.colors.text }}>
                        <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" style={{ color: branding.colors.accent }} />
                        <span><strong style={{ color: branding.colors.textHeading }}>CLAUDE.md:</strong> Instructions for Claude Code to build your project</span>
                      </li>
                      <li className="flex items-start" style={{ color: branding.colors.text }}>
                        <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" style={{ color: branding.colors.accent }} />
                        <span><strong style={{ color: branding.colors.textHeading }}>Module docs:</strong> 8 detailed technical module specifications</span>
                      </li>
                      <li className="flex items-start" style={{ color: branding.colors.text }}>
                        <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" style={{ color: branding.colors.accent }} />
                        <span><strong style={{ color: branding.colors.textHeading }}>Executable prompts:</strong> 9 ready-to-use prompts for Claude Code</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                    style={{
                      background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                      color: branding.colors.background
                    }}
                  >
                    3
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2" style={{ color: branding.colors.textHeading, fontFamily: branding.fonts.heading }}>
                      Export & Build with Claude Code
                    </h3>
                    <p className="mb-3" style={{ color: branding.colors.text }}>
                      Download your complete blueprint as a ZIP file containing 21 AI-generated files. Then:
                    </p>
                    <ol className="space-y-2" style={{ color: branding.colors.text }}>
                      <li className="flex items-start">
                        <span
                          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5"
                          style={{
                            background: `${branding.colors.accent}30`,
                            color: branding.colors.accent
                          }}
                        >
                          1
                        </span>
                        <span>Open the project folder in your code editor</span>
                      </li>
                      <li className="flex items-start">
                        <span
                          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5"
                          style={{
                            background: `${branding.colors.accent}30`,
                            color: branding.colors.accent
                          }}
                        >
                          2
                        </span>
                        <span>Launch Claude Code and follow the CLAUDE.md instructions</span>
                      </li>
                      <li className="flex items-start">
                        <span
                          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5"
                          style={{
                            background: `${branding.colors.accent}30`,
                            color: branding.colors.accent
                          }}
                        >
                          3
                        </span>
                        <span>Use the executable prompts to build each feature step-by-step</span>
                      </li>
                      <li className="flex items-start">
                        <span
                          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5"
                          style={{
                            background: `${branding.colors.accent}30`,
                            color: branding.colors.accent
                          }}
                        >
                          4
                        </span>
                        <span>Deploy your fully-functional SaaS application</span>
                      </li>
                    </ol>
                  </div>
                </div>
              </div>

              <div
                className="rounded-2xl p-6 text-center"
                style={{
                  background: `linear-gradient(135deg, ${branding.colors.accent}20, ${branding.colors.gradientTo}20)`,
                  border: `1px solid ${branding.colors.accent}40`
                }}
              >
                <h3 className="text-xl font-semibold mb-3" style={{ color: branding.colors.textHeading, fontFamily: branding.fonts.heading }}>
                  Ready to Build Your SaaS?
                </h3>
                <p className="mb-4" style={{ color: branding.colors.text }}>
                  Start your first blueprint for free. Export takes 5-6 minutes with 21 AI-generated files.
                </p>
                <Link
                  href="/auth/sign-up"
                  className="inline-flex items-center text-lg px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                    color: branding.colors.background,
                    boxShadow: `0 0 20px ${branding.colors.accentGlow}`,
                  }}
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

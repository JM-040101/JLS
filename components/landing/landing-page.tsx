'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle, Zap, FileText, Download } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blueprint-navy-50 to-white">
      {/* Header */}
      <header className="border-b border-blueprint-navy-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blueprint-navy-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-blueprint-navy-900">SaaS Blueprint</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/sign-in" className="btn-ghost text-blueprint-navy-600">
              Sign In
            </Link>
            <Link href="/auth/sign-up" className="btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold text-blueprint-navy-900 mb-6">
            Transform Your SaaS Ideas Into
            <span className="text-blueprint-cyan-600"> Comprehensive Blueprints</span>
          </h1>
          <p className="text-xl text-blueprint-navy-600 mb-8 max-w-3xl mx-auto">
            A guided 12-phase workflow that transforms your SaaS concepts into detailed technical blueprints 
            with exportable documentation and Claude Code prompts.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/auth/sign-up" className="btn-primary text-lg px-8 py-3">
              Start Building Your Blueprint
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <button className="btn-outline text-lg px-8 py-3">
              View Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-blueprint-navy-900 mb-4">
              Everything You Need to Plan Your SaaS
            </h2>
            <p className="text-blueprint-navy-600 max-w-2xl mx-auto">
              Our AI-powered workflow guides you through every aspect of SaaS planning, 
              from concept to technical implementation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="workflow-step text-center">
              <div className="w-12 h-12 bg-blueprint-cyan-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-blueprint-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold text-blueprint-navy-900 mb-2">
                12-Phase Guided Workflow
              </h3>
              <p className="text-blueprint-navy-600">
                Sequential phases covering everything from market analysis to technical architecture, 
                ensuring no critical aspect is overlooked.
              </p>
            </div>

            <div className="workflow-step text-center">
              <div className="w-12 h-12 bg-blueprint-cyan-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-blueprint-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold text-blueprint-navy-900 mb-2">
                AI-Powered Documentation
              </h3>
              <p className="text-blueprint-navy-600">
                GPT-5 and Claude Sonnet 4 work together to transform your answers into 
                comprehensive technical documentation and implementation guides.
              </p>
            </div>

            <div className="workflow-step text-center">
              <div className="w-12 h-12 bg-blueprint-cyan-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Download className="w-6 h-6 text-blueprint-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold text-blueprint-navy-900 mb-2">
                Exportable Blueprints
              </h3>
              <p className="text-blueprint-navy-600">
                Download complete project blueprints with README files, CLAUDE.md instructions, 
                and executable prompts for Claude Code.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-blueprint-navy-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-blueprint-navy-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-blueprint-navy-600">
              Everything you need to plan and build your SaaS, all in one subscription.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="card p-8 text-center border-2 border-blueprint-cyan-200">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-blueprint-navy-900 mb-2">Pro Plan</h3>
                <div className="text-4xl font-bold text-blueprint-cyan-600 mb-2">
                  £14.99<span className="text-lg text-blueprint-navy-600">/month</span>
                </div>
                <p className="text-blueprint-navy-600">Everything you need to succeed</p>
              </div>

              <ul className="space-y-3 mb-8 text-left">
                {[
                  'Unlimited blueprint generations',
                  '12-phase guided workflow',
                  'GPT-5 & Claude Sonnet 4 integration',
                  'Exportable documentation',
                  'Claude Code prompts',
                  'EU VAT included',
                  'Email support'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-blueprint-cyan-600 mr-2 flex-shrink-0" />
                    <span className="text-blueprint-navy-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/auth/sign-up" className="btn-primary w-full text-lg py-3">
                Start Your Blueprint Journey
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blueprint-navy-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-blueprint-cyan-600 rounded flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold">SaaS Blueprint Generator</span>
          </div>
          <p className="text-blueprint-navy-300 mb-4">
            Transform ideas into actionable SaaS blueprints with AI-powered guidance.
          </p>
          <p className="text-blueprint-navy-400 text-sm">
            © 2024 SaaS Blueprint Generator. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
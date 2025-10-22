'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Zap, FileText, Download, X } from 'lucide-react'

export default function LandingPage() {
  const [showDemo, setShowDemo] = useState(false)

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
            <button
              onClick={() => setShowDemo(true)}
              className="btn-outline text-lg px-8 py-3"
            >
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

      {/* Demo Modal */}
      {showDemo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-blueprint-navy-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-blueprint-navy-900">
                How SaaS Blueprint Generator Works
              </h2>
              <button
                onClick={() => setShowDemo(false)}
                className="text-blueprint-navy-600 hover:text-blueprint-navy-900 transition-colors"
                aria-label="Close demo"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Step 1 */}
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blueprint-cyan-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-blueprint-navy-900 mb-2">
                      Start Your 12-Phase Workflow
                    </h3>
                    <p className="text-blueprint-navy-600 mb-3">
                      Answer guided questions about your SaaS idea across 12 comprehensive phases:
                    </p>
                    <ul className="grid grid-cols-2 gap-2 text-sm text-blueprint-navy-700">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-blueprint-cyan-600 mr-2" />
                        Market Analysis
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-blueprint-cyan-600 mr-2" />
                        User Personas
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-blueprint-cyan-600 mr-2" />
                        Core Features
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-blueprint-cyan-600 mr-2" />
                        Tech Stack
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-blueprint-cyan-600 mr-2" />
                        Architecture
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-blueprint-cyan-600 mr-2" />
                        Security & Compliance
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blueprint-cyan-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-blueprint-navy-900 mb-2">
                      AI Generates Your Blueprint
                    </h3>
                    <p className="text-blueprint-navy-600">
                      Our AI models (Claude Haiku for chat, Claude Sonnet 3.5 for documentation) process your answers and create:
                    </p>
                    <ul className="mt-3 space-y-2 text-blueprint-navy-700">
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-blueprint-cyan-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span><strong>README.md:</strong> Project overview with architecture diagrams</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-blueprint-cyan-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span><strong>CLAUDE.md:</strong> Instructions for Claude Code to build your project</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-blueprint-cyan-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span><strong>Module docs:</strong> 8 detailed technical module specifications</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-blueprint-cyan-600 mr-2 flex-shrink-0 mt-0.5" />
                        <span><strong>Executable prompts:</strong> 9 ready-to-use prompts for Claude Code</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blueprint-cyan-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-blueprint-navy-900 mb-2">
                      Export & Build with Claude Code
                    </h3>
                    <p className="text-blueprint-navy-600 mb-3">
                      Download your complete blueprint as a ZIP file containing 21 AI-generated files. Then:
                    </p>
                    <ol className="space-y-2 text-blueprint-navy-700">
                      <li className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-blueprint-cyan-100 text-blueprint-cyan-700 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                          1
                        </span>
                        <span>Open the project folder in your code editor</span>
                      </li>
                      <li className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-blueprint-cyan-100 text-blueprint-cyan-700 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                          2
                        </span>
                        <span>Launch Claude Code and follow the CLAUDE.md instructions</span>
                      </li>
                      <li className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-blueprint-cyan-100 text-blueprint-cyan-700 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                          3
                        </span>
                        <span>Use the executable prompts to build each feature step-by-step</span>
                      </li>
                      <li className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-blueprint-cyan-100 text-blueprint-cyan-700 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                          4
                        </span>
                        <span>Deploy your fully-functional SaaS application</span>
                      </li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-blueprint-cyan-50 rounded-lg p-6 text-center">
                <h3 className="text-xl font-semibold text-blueprint-navy-900 mb-3">
                  Ready to Build Your SaaS?
                </h3>
                <p className="text-blueprint-navy-600 mb-4">
                  Start your first blueprint for free. Export takes 5-6 minutes with 21 AI-generated files.
                </p>
                <Link
                  href="/auth/sign-up"
                  className="btn-primary inline-flex items-center text-lg px-8 py-3"
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
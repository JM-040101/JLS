import { ReactNode } from 'react'
import { FileText } from 'lucide-react'
import Link from 'next/link'

export default function WorkflowLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blueprint-navy-50 to-white">
      {/* Simple Header */}
      <header className="bg-white border-b border-blueprint-navy-100">
        <div className="container mx-auto px-4 py-3">
          <Link href="/dashboard" className="flex items-center space-x-2 w-fit">
            <div className="w-8 h-8 bg-blueprint-navy-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-blueprint-navy-900">SaaS Blueprint</span>
          </Link>
        </div>
      </header>
      
      {children}
    </div>
  )
}
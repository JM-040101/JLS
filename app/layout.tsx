import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/providers/auth-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'SaaS Blueprint Generator',
  description: 'Transform SaaS ideas into comprehensive 12-phase blueprints with exportable documentation and Claude Code prompts.',
  keywords: ['SaaS', 'Blueprint', 'Generator', 'AI', 'Claude', 'Workflow'],
  authors: [{ name: 'SaaS Blueprint Generator' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-background text-foreground antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
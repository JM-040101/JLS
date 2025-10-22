'use client'

import { branding } from '@/branding.config'

export default function SharpAxeLogo() {
  return (
    <div className="flex items-center relative group cursor-pointer">
      {/* Text with gradient A's */}
      <h1
        className="text-3xl font-bold flex items-baseline relative"
        style={{
          fontFamily: branding.fonts.heading,
          letterSpacing: '-0.02em',
        }}
      >
        <span style={{ color: branding.colors.textHeading }}>Sh</span>
        <span
          style={{
            background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          a
        </span>
        <span style={{ color: branding.colors.textHeading }}>rp</span>
        <span
          style={{
            background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          A
        </span>
        <span style={{ color: branding.colors.textHeading }}>xe</span>
      </h1>

      <style jsx>{`
        /* Text glow on hover */
        .group:hover h1 {
          filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.5));
        }
      `}</style>
    </div>
  )
}

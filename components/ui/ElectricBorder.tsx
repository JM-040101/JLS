'use client'

import { ReactNode, CSSProperties } from 'react'

export interface ElectricBorderProps {
  children: ReactNode
  duration?: string
  trailColor?: string
  trailSize?: 'sm' | 'md' | 'lg'
  borderRadius?: string
  className?: string
  contentClassName?: string
}

const TRAIL_SIZES = {
  sm: '2px',
  md: '3px',
  lg: '4px',
}

export default function ElectricBorder({
  children,
  duration = '10s',
  trailColor,
  trailSize = 'md',
  borderRadius = '1.5rem',
  className = '',
  contentClassName = '',
}: ElectricBorderProps) {
  const borderWidth = TRAIL_SIZES[trailSize]

  // Default gradient colors (cyan to teal)
  const defaultGradient = 'conic-gradient(from var(--angle), #06b6d4, #14b8a6, #06b6d4)'
  const gradient = trailColor
    ? `conic-gradient(from var(--angle), ${trailColor}, transparent, ${trailColor})`
    : defaultGradient

  const containerStyle: CSSProperties = {
    position: 'relative',
    borderRadius,
    padding: borderWidth,
    background: gradient,
    // @ts-ignore - CSS custom property
    '--angle': '0deg',
    animation: `rotate ${duration} linear infinite`,
    willChange: 'transform',
  }

  const contentStyle: CSSProperties = {
    borderRadius: `calc(${borderRadius} - ${borderWidth})`,
    height: '100%',
    width: '100%',
  }

  return (
    <>
      <style jsx>{`
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        @keyframes rotate {
          0% {
            --angle: 0deg;
          }
          100% {
            --angle: 360deg;
          }
        }
      `}</style>
      <div className={className} style={containerStyle}>
        <div className={contentClassName} style={contentStyle}>
          {children}
        </div>
      </div>
    </>
  )
}

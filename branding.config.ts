/**
 * 🌌 Midnight Circuit — Branding Configuration
 *
 * A calm night-time dashboard with glowing edges, tech-driven but human.
 * Perfect for developer tools, AI apps, SaaS dashboards, and analytics products.
 */

export const branding = {
  // 🎨 Main Colors
  colors: {
    // Core brand colors
    background: '#12141C',        // Dark navy black — the main backdrop
    primary: '#1C1F2E',           // Deep navy — panels, navigation bars, and main sections
    primaryDark: '#161925',       // Darker shade for hover states
    primaryLight: '#252940',      // Lighter shade for subtle highlights

    secondary: '#2E3A59',         // Steel blue — subtle contrast for cards and boxes
    secondaryDark: '#252E47',     // Darker secondary
    secondaryLight: '#3A4766',    // Lighter secondary

    accent: '#00F5A0',            // Mint glow — buttons, highlights, icons, and links
    accentDark: '#00D98E',        // Darker mint for hover states
    accentLight: '#33F7B3',       // Lighter mint for glow effects
    accentGlow: 'rgba(0, 245, 160, 0.4)', // Soft mint glow for hover depth

    // Gradient accent: mint to aqua
    gradientFrom: '#00F5A0',      // Mint
    gradientTo: '#00C4FF',        // Aqua

    // Text colors
    text: '#E5E7EB',              // Pale silver — main text, clear on dark surfaces
    textHeading: '#F3F4F6',       // Bright silver — for headings
    textMuted: '#9CA3AF',         // Light grey — for hints or inactive text

    // Surface colors
    surface: '#1E2233',           // Slightly lighter navy — lifts content boxes
    divider: '#2C3245',           // Faint blue-grey — thin lines between sections

    // Status colors
    success: '#10B981',           // Emerald green — for "saved" or "complete" messages
    successDark: '#059669',       // Darker success
    successLight: '#34D399',      // Lighter success

    warning: '#F59E0B',           // Amber — for gentle alerts or cautions
    warningDark: '#D97706',       // Darker warning
    warningLight: '#FBBF24',      // Lighter warning

    error: '#F43F5E',             // Rose red — for form errors or failed actions
    errorDark: '#E11D48',         // Darker error
    errorLight: '#FB7185',        // Lighter error

    info: '#00C4FF',              // Aqua blue — for info messages
    infoDark: '#00A3D9',          // Darker info
    infoLight: '#33D1FF',         // Lighter info

    // Background gradients
    backgroundFrom: '#12141C',    // Gradient start
    backgroundVia: '#1C1F2E',     // Gradient middle
    backgroundTo: '#2E3A59',      // Gradient end
  },

  // 🖋 Typography
  fonts: {
    heading: 'Inter, Space Grotesk, sans-serif',  // Modern and easy to read
    body: 'Inter, sans-serif',                    // Clean body text
    mono: 'JetBrains Mono, monospace',            // Code and technical content
  },

  // ✨ Animation preferences
  animations: {
    duration: '200ms',                            // Smooth transitions
    easing: 'ease-in-out',                        // Natural feeling animations
  }
}

// Helper functions for common color patterns
export const brandColors = {
  // Gradient utility
  gradient: `linear-gradient(135deg, ${branding.colors.gradientFrom} 0%, ${branding.colors.gradientTo} 100%)`,

  // Glow effect for buttons
  glowEffect: `0 0 20px ${branding.colors.accentGlow}`,

  // Card shadow
  cardShadow: `0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)`,

  // Hover shadow
  hoverShadow: `0 10px 15px -3px rgba(0, 245, 160, 0.2), 0 4px 6px -2px rgba(0, 245, 160, 0.1)`,
}

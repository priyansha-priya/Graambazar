/**
 * GramBazaar Centralized Theme System
 * Single Source of Truth for design tokens, colors, spacing, typography, and breakpoints.
 */

export const themeColors = {
  primary: {
    DEFAULT: '#218838', // Brand green, main CTAs
    dark: '#176B2C',    // Hover & pressed states
    light: '#E8F5E9',   // Background tints, badge backgrounds
    contrast: '#FFFFFF',// Text on primary buttons
  },
  accent: {
    DEFAULT: '#F59E0B', // Warm amber/orange for food highlights & timers
    light: '#FEF3C7',
    dark: '#B45309',
  },
  surface: {
    page: '#F8FAFC',    // App background
    card: '#FFFFFF',    // Standard white cards, modals, tables
    subtle: '#F1F5F9',  // Header backgrounds, disabled states
    overlay: 'rgba(15, 23, 42, 0.6)', // Modal & Drawer backdrops
  },
  text: {
    primary: '#1F2937',   // High contrast headings and body
    secondary: '#6B7280', // Subtitles, timestamps, unit labels
    muted: '#9CA3AF',     // Placeholder text
    inverted: '#FFFFFF',  // Text on dark/primary backgrounds
  },
  border: {
    DEFAULT: '#E5E7EB', // Card borders, dividers, table cell lines
    focus: '#218838',   // Accessible focus rings
    error: '#DC2626',   // Form validation errors
  },
  status: {
    success: { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' },
    warning: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
    error:   { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
    info:    { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
    neutral: { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' },
  },
} as const;

export const themeDimensions = {
  button: {
    sm: 'h-8 px-3 text-xs',
    md: 'h-[42px] px-5 text-sm',
    lg: 'h-[50px] px-8 text-base',
  },
  input: {
    height: 'h-11', // 44px
    radius: 'rounded-xl',
  },
  card: {
    radius: 'rounded-xl',
    padding: 'p-5 sm:p-6',
    border: 'border border-[#E5E7EB]',
    shadow: 'shadow-sm',
  },
  modal: {
    radius: 'rounded-2xl',
    maxWidth: 'max-w-lg',
  },
  sidebar: {
    width: 'w-64',
    collapsedWidth: 'w-18',
  },
  header: {
    height: 'h-16',
  },
} as const;

export const themeBreakpoints = {
  mobileSm: 320,
  mobileMd: 375,
  tablet: 768,
  desktop: 1024,
  desktopWide: 1440,
  ultraWide: 1920,
} as const;

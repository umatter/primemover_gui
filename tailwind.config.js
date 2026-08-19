/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  variants: {
    backgroundColor: ['responsive', 'first', 'last', 'even', 'odd', 'hover', 'focus']
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Hanken Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Spectral', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"Spline Sans Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      colors: {
        // Surfaces (warm-cool paper, tinted toward brand ink-blue)
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        // Ink (text)
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        'on-brand': 'var(--on-brand)',
        'on-accent': 'var(--on-accent)',
        // Brand (Prussian ink-blue)
        brand: 'var(--brand)',
        'brand-hover': 'var(--brand-hover)',
        'brand-tint': 'var(--brand-tint)',
        // Accent (signal amber/ochre) — use sparingly
        accent: 'var(--accent)',
        'accent-strong': 'var(--accent-strong)',
        'accent-tint': 'var(--accent-tint)',
        // Status
        success: 'var(--success)',
        'success-tint': 'var(--success-tint)',
        warning: 'var(--warning)',
        'warning-tint': 'var(--warning-tint)',
        danger: 'var(--danger)',
        'danger-tint': 'var(--danger-tint)',
        info: 'var(--info)',
        'info-tint': 'var(--info-tint)'
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.1rem', letterSpacing: '0.005em' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem' }],
        base: ['0.9375rem', { lineHeight: '1.55rem' }],
        lg: ['1.0625rem', { lineHeight: '1.6rem' }],
        xl: ['1.3125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.625rem', { lineHeight: '2rem', letterSpacing: '-0.015em' }],
        '3xl': ['2.0625rem', { lineHeight: '2.3rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.625rem', { lineHeight: '2.8rem', letterSpacing: '-0.022em' }],
        '5xl': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.025em' }]
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.375rem'
      },
      boxShadow: {
        xs: '0 1px 2px 0 oklch(0.45 0.05 255 / 0.05)',
        sm: '0 1px 3px 0 oklch(0.45 0.05 255 / 0.07), 0 1px 2px -1px oklch(0.45 0.05 255 / 0.05)',
        md: '0 4px 14px -3px oklch(0.45 0.05 255 / 0.10), 0 2px 6px -2px oklch(0.45 0.05 255 / 0.06)',
        lg: '0 16px 36px -10px oklch(0.40 0.06 255 / 0.16), 0 6px 14px -8px oklch(0.40 0.06 255 / 0.10)',
        focus: '0 0 0 3px var(--ring)'
      },
      maxWidth: {
        prose: '72ch'
      },
      transitionTimingFunction: {
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)'
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' }
        }
      },
      animation: {
        'fade-up': 'fade-up 0.5s var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1)) both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite'
      }
    }
  },
  plugins: [
    // ...
    require('@tailwindcss/forms')
  ]
};

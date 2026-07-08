/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Refined brand ramp — deeper, less "caution-tape yellow", more
        // "premium automotive amber". #f0b400 reads closer to brushed
        // gold under dark UI than the previous #f5c800, which skewed
        // toward safety-vest yellow at high saturation.
        brand: {
          50: '#fff9e6', 100: '#ffedb3', 200: '#ffe080',
          300: '#ffd24d', 400: '#f7c334', 500: '#f0b400',
          600: '#cc9600', 700: '#a37800', 800: '#7a5a00', 900: '#523c00',
        },
        surface: {
          950: '#08090a', 900: '#0c0d0f', 800: '#131417',
          700: '#191b1f', 600: '#1f2126', 500: '#292c33', 400: '#363940',
        },
        accent: {
          green: '#22c55e', red: '#ef4444',
          amber: '#f59e0b', blue: '#3b82f6', orange: '#f97316',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        'brand': '0 4px 20px rgba(240,180,0,0.18)',
        'brand-lg': '0 8px 32px rgba(240,180,0,0.24)',
        'card': '0 4px 24px rgba(0,0,0,0.45)',
        'depth': '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 30px rgba(0,0,0,0.35)',
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}

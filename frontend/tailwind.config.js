/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fffde7', 100: '#fff9c4', 200: '#fff59d',
          300: '#fff176', 400: '#ffee58', 500: '#f5c800',
          600: '#d4a900', 700: '#b8860b', 800: '#9a6f00', 900: '#7a5500',
        },
        surface: {
          900: '#0c0c0c', 800: '#131313', 750: '#161616',
          700: '#1a1a1a', 600: '#202020', 500: '#2a2a2a', 400: '#333333',
        },
        accent: {
          green: '#22c55e', red: '#ef4444',
          amber: '#f59e0b', blue: '#3b82f6', orange: '#f97316',
        },
      },
      fontFamily: {
        sans: ['Barlow', 'system-ui', 'sans-serif'],
        display: ['Barlow Condensed', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'yellow': '0 4px 20px rgba(245,200,0,0.25)',
        'yellow-lg': '0 8px 32px rgba(245,200,0,0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}

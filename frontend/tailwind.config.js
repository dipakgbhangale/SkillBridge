/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#1e1b4b',
        },
        dark: {
          400: '#3d3d5c',
          500: '#2d2d4a',
          600: '#1e1e3f',
          700: '#16162e',
          800: '#12122a',
          900: '#0f0f1a',
        },
        cyan: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.45s ease both',
        'slide-up': 'slideUp 0.5s ease both',
        'scale-in': 'scaleIn 0.35s cubic-bezier(.34,1.56,.64,1) both',
        spin: 'spin 0.8s linear infinite',
      },
      keyframes: {
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(99,102,241,0)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(99,102,241,0.25)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(30px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.88)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      boxShadow: {
        glow: '0 0 20px rgba(99, 102, 241, 0.4)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.4)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cpl: {
          dark: '#070B14',
          surface: '#0D1527',
          card: '#111D38',
          border: '#1E2D4D',
          gold: '#F59E0B',
          'gold-light': '#FCD34D',
          'gold-dark': '#D97706',
          emerald: '#10B981',
          ruby: '#EF4444',
          slate: '#94A3B8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 0 25px -5px rgba(245, 158, 11, 0.3)',
        'gold-lg': '0 0 40px -5px rgba(245, 158, 11, 0.45)',
        stadium: '0 10px 40px -10px rgba(0, 0, 0, 0.7), 0 0 20px -2px rgba(245, 158, 11, 0.15)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(245, 158, 11, 0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(245, 158, 11, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};

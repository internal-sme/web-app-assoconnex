/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Bleu de marque, dérivé du logo AssoConnex° (#2364AA)
        brand: {
          50: '#EFF5FB',
          100: '#DCE9F6',
          200: '#BBD3EC',
          300: '#8DB5DE',
          400: '#5892C9',
          500: '#2364AA',
          600: '#1D5391',
          700: '#184476',
          800: '#14375F',
          900: '#112C4B',
        },
        // Neutres froids : la base blanc / noir du produit
        ink: {
          25: '#FBFBFC',
          50: '#F6F7F9',
          100: '#EDEFF2',
          200: '#E0E3E9',
          300: '#C7CCD5',
          400: '#98A0AC',
          500: '#6E7684',
          600: '#525A66',
          700: '#3B424B',
          800: '#23272E',
          900: '#14171B',
          950: '#0A0C0F',
        },
        success: { 50: '#E9F6EF', 100: '#CDEADD', 500: '#127A4C', 600: '#0E6440', 700: '#0B4F33' },
        warning: { 50: '#FDF3E4', 100: '#F9E3C2', 500: '#9A5B00', 600: '#824C00', 700: '#653B00' },
        danger: { 50: '#FDECEA', 100: '#FAD4D0', 500: '#B42318', 600: '#9A1C13', 700: '#7A150E' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Instrument Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
      },
      borderRadius: { xl: '0.75rem', '2xl': '1rem' },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(10 12 15 / 0.05)',
        sm: '0 1px 3px 0 rgb(10 12 15 / 0.07), 0 1px 2px -1px rgb(10 12 15 / 0.05)',
        md: '0 4px 12px -2px rgb(10 12 15 / 0.08), 0 2px 4px -2px rgb(10 12 15 / 0.04)',
        lg: '0 16px 40px -12px rgb(10 12 15 / 0.18), 0 4px 12px -4px rgb(10 12 15 / 0.08)',
        pop: '0 24px 60px -16px rgb(10 12 15 / 0.28)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': { from: { opacity: '0', transform: 'translateY(6px) scale(.985)' }, to: { opacity: '1', transform: 'none' } },
        'slide-left': { from: { transform: 'translateX(100%)' }, to: { transform: 'none' } },
        'toast-in': { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-in': 'fade-in .16s ease-out',
        'scale-in': 'scale-in .18s cubic-bezier(.2,.7,.3,1)',
        'slide-left': 'slide-left .24s cubic-bezier(.2,.7,.3,1)',
        'toast-in': 'toast-in .2s cubic-bezier(.2,.7,.3,1)',
      },
    },
  },
  plugins: [],
}

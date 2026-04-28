/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81'
        }
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(99,102,241,0.18), 0 20px 50px rgba(15,23,42,0.18)'
      },
      backgroundImage: {
        'hero-radial': 'radial-gradient(circle at top, rgba(99,102,241,0.22), transparent 42%), radial-gradient(circle at right, rgba(14,165,233,0.18), transparent 35%)'
      }
    }
  },
  plugins: []
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1D2428',
        canvas: '#EDF0F1',
        petrol: {
          50: '#EAF1F3',
          100: '#D3E2E6',
          600: '#2A6070',
          700: '#1B4A55',
          800: '#12373F',
          900: '#0C2830',
        },
        signal: { DEFAULT: '#F4B400', dark: '#DCA100' },
        danger: { DEFAULT: '#B3261E', dark: '#8F1D17', soft: '#FBEAE9' },
        ok: { DEFAULT: '#1F7A4D', soft: '#E4F3EB' },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', '"Arial Narrow"', 'sans-serif'],
        sans: ['Barlow', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

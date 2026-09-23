/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        display: ['"Cormorant"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        // "paper" is the page background — now a deep wine/burgundy instead
        // of a light page, to match the engraved-crest invitation style.
        paper: '#360b14',
        paperDeep: '#2a0810',
        ink: '#f0e2d0',
        clay: '#c9a877',
        gold: '#c9a877',
        line: '#8a6f52'
      },
      letterSpacing: {
        widest2: '0.28em'
      },
      transitionDuration: {
        '400': '400ms'
      }
    }
  },
  plugins: []
}

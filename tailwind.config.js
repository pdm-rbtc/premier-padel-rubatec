/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:   '#001d72',
        secondary: '#0433FF',
        accent:    '#11efb5',
        accent2:   '#ff8000',
        bg:        '#f8f9fc',
        surface:   '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

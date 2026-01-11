/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'slate-850': '#1e293b', // พื้นหลังเข้ม
        'slate-900': '#0f172a', // เข้มกว่า
        'luxury-gold': '#d4af37', // สีทองตัดนิดๆ ให้ดูแพง
        'blue-grey-500': '#64748b',
      },
      fontFamily: {
        sans: ['Prompt', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
};
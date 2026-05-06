/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        board: {
          bg: '#DEB887',
          line: '#5C3317',
          river: '#DEB887',
          red: '#CC0000',
          black: '#1A1A1A',
          piece: '#F5DEB3',
          pieceBorder: '#8B4513',
          highlight: '#FFD700',
          lastMove: 'rgba(255, 255, 0, 0.3)',
          legalMove: 'rgba(0, 180, 0, 0.6)',
          capture: 'rgba(220, 0, 0, 0.5)'
        },
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c'
        }
      },
      fontFamily: {
        kai: ['"KaiTi"', '"STKaiti"', '"AR PL UKai CN"', 'serif'],
        song: ['"SimSun"', '"STSong"', 'serif']
      }
    }
  },
  plugins: []
}

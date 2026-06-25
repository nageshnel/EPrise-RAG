/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Deep Space Background
        space: {
          950: '#05050f',
          900: '#0a0a1a',
          850: '#0d0d22',
          800: '#111128',
          700: '#16162e',
          600: '#1c1c38',
        },
        // AI Violet / Purple accents
        violet: {
          950: '#1a0533',
          900: '#2e0a5e',
          800: '#4a0f8f',
          700: '#5b18a8',
          600: '#7c3aed',
          500: '#8b5cf6',
          400: '#a78bfa',
          300: '#c4b5fd',
          200: '#ddd6fe',
        },
        // Electric Blue
        electric: {
          700: '#1741a8',
          600: '#2563eb',
          500: '#3b82f6',
          400: '#60a5fa',
          300: '#93c5fd',
        },
        // Cyan / Teal
        neon: {
          500: '#06b6d4',
          400: '#22d3ee',
          300: '#67e8f9',
        },
        // Glass surfaces
        glass: {
          heavy: 'rgba(255,255,255,0.04)',
          medium: 'rgba(255,255,255,0.06)',
          light: 'rgba(255,255,255,0.08)',
          border: 'rgba(255,255,255,0.08)',
        },
      },
      backgroundImage: {
        'aurora': 'radial-gradient(ellipse at top left, rgba(124,58,237,0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(37,99,235,0.12) 0%, transparent 50%)',
        'violet-glow': 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
        'blue-glow': 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        'btn-primary': 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)',
        'btn-glow': 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)',
      },
      boxShadow: {
        'glow-violet': '0 0 20px rgba(139,92,246,0.4)',
        'glow-blue': '0 0 20px rgba(59,130,246,0.4)',
        'glow-sm': '0 0 10px rgba(139,92,246,0.25)',
        'glass': '0 8px 32px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}

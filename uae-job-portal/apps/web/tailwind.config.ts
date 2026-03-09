import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#edfbfc',
          100: '#d3f5f7',
          200: '#aae9ef',
          300: '#6fd5e0',
          400: '#40c0cb',
          500: '#44bbc3',
          600: '#3aa9b0',
          700: '#2e8c93',
          800: '#266f75',
          900: '#1f5860',
          950: '#103840',
        },
        gold: {
          300: '#fde68a',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04)',
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 10px 30px -5px rgba(0,0,0,0.12), 0 4px 6px -2px rgba(0,0,0,0.05)',
        'glow-brand': '0 0 20px rgba(58,169,176,0.25)',
        'glow-brand-lg': '0 0 40px rgba(58,169,176,0.3)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #2e8c93 0%, #3aa9b0 50%, #40c0cb 100%)',
        'gradient-hero': 'linear-gradient(135deg, #1f5860 0%, #2e8c93 40%, #3aa9b0 100%)',
        'gradient-card': 'linear-gradient(135deg, #edfbfc 0%, #d3f5f7 100%)',
        'mesh-brand': 'radial-gradient(at 40% 20%, hsla(186,100%,25%,1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(186,60%,40%,1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(186,80%,30%,1) 0px, transparent 50%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(12px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideDown: { '0%': { transform: 'translateY(-8px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        scaleIn: { '0%': { transform: 'scale(0.95)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        bounceGentle: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
        float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};

export default config;

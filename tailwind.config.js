/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // VIM-style theme colors based on reference
        'hacker': {
          'bg': '#1e1e1e',
          'bg-secondary': '#2d2d30',
          'bg-tertiary': '#3c3c3c',
          'border': '#464647',
          'text': '#d4d4d4',
          'text-secondary': '#858585',
          'accent': '#007acc',
          'accent-hover': '#1177bb',
          'success': '#4ec9b0',
          'warning': '#dcdcaa',
          'error': '#f44747',
          'green': '#4ec9b0',
          'yellow': '#dcdcaa',
          'blue': '#4fc1ff',
          'purple': '#c586c0',
          'orange': '#ce9178',
          'cyan': '#4ec9b0',
          'magenta': '#c586c0',
          'keyword': '#c586c0',
          'function': '#dcdcaa',
          'string': '#4ec9b0',
          'comment': '#6a9955',
          'type': '#4fc1ff',
          'variable': '#d4d4d4',
        },
        'light': {
          'bg': '#ffffff',
          'bg-secondary': '#f3f3f3',
          'bg-tertiary': '#e8e8e8',
          'border': '#d4d4d4',
          'text': '#333333',
          'text-secondary': '#666666',
          'accent': '#0078d4',
          'accent-hover': '#106ebe',
          'success': '#107c10',
          'warning': '#ff8c00',
          'error': '#d13438',
          'green': '#107c10',
          'yellow': '#ff8c00',
          'blue': '#0078d4',
          'purple': '#5c2d91',
          'orange': '#ff8c00',
          'cyan': '#00bcf2',
          'magenta': '#5c2d91',
          'keyword': '#0000ff',
          'function': '#795e26',
          'string': '#a31515',
          'comment': '#008000',
          'type': '#267f99',
          'variable': '#001080',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'type': 'type 0.5s ease-in-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #58a6ff' },
          '100%': { boxShadow: '0 0 20px #58a6ff, 0 0 30px #58a6ff' },
        },
        type: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        }
      }
    },
  },
  plugins: [],
}

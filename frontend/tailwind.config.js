/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        'bg-base': 'var(--bg-base)',
        'bg-subtle': 'var(--bg-subtle)',
        'bg-elevated': 'var(--bg-elevated)',
        'border-subtle': 'var(--border)',
        'border-strong': 'var(--border-strong)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'accent': 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-subtle': 'var(--accent-subtle)',
        'success': 'var(--success)',
        'warning': 'var(--warning)',
        'danger': 'var(--danger)',
        'success-bg': 'var(--success-bg)',
        'warning-bg': 'var(--warning-bg)',
        'danger-bg': 'var(--danger-bg)',
        // Backwards compatibility mappings
        ner: {
          bg: 'var(--bg-base)',
          card: 'var(--bg-elevated)',
          cardHover: 'var(--bg-subtle)',
          border: 'var(--border)',
          borderLight: 'var(--border-strong)',
          header: 'var(--bg-elevated)',
          primary: 'var(--accent)',
          primaryHover: 'var(--accent-hover)',
          accent: 'var(--accent)',
          safe: 'var(--success)',
          safeBg: 'var(--success-bg)',
          warning: 'var(--warning)',
          warningBg: 'var(--warning-bg)',
          danger: 'var(--danger)',
          dangerBg: 'var(--danger-bg)',
          emergency: 'var(--danger)',
          muted: 'var(--text-muted)',
          text: 'var(--text-primary)'
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace']
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'DEFAULT': 'var(--radius-md)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        'full': 'var(--radius-full)'
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'none': 'none'
      }
    },
  },
  plugins: [],
}

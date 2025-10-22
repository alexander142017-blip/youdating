// Use CommonJS to avoid ESM/CJS interop issues when Tailwind loads the config.
// Gracefully handle missing optional plugin (tailwindcss-animate).
let animatePlugin;
try {
  // try to require the plugin; if not installed, keep animatePlugin null
  // eslint-disable-next-line global-require
  animatePlugin = require('tailwindcss-animate');
} catch (e) {
  animatePlugin = null;
}

module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        // Custom yellow shades for sophisticated look
        'warm-yellow': {
          50: '#fefce8',
          100: '#fef3c7',
          200: '#fde68a', 
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f'
        }
      }
    }
  },
  plugins: [
    // include plugin only if available
    ...(animatePlugin ? [animatePlugin] : []),
    require('daisyui')
  ],
  daisyui: {
    themes: [
      {
        // Custom dim yellow theme for YouDating
        "youdating-light": {
          "primary": "#fbbf24",        // Warm yellow (yellow-400)
          "primary-focus": "#f59e0b",   // Slightly darker (yellow-500)
          "primary-content": "#1f2937", // Dark text on yellow
          
          "secondary": "#f3f4f6",       // Light gray (gray-100)
          "secondary-focus": "#e5e7eb",  // Gray-200
          "secondary-content": "#374151", // Gray-700
          
          "accent": "#ffffff",          // Pure white
          "accent-focus": "#f9fafb",    // Gray-50
          "accent-content": "#111827",  // Gray-900
          
          "neutral": "#6b7280",         // Gray-500 for text
          "neutral-focus": "#4b5563",   // Gray-600
          "neutral-content": "#f9fafb", // Gray-50
          
          "base-100": "#ffffff",        // White background
          "base-200": "#f9fafb",        // Gray-50
          "base-300": "#f3f4f6",        // Gray-100
          "base-content": "#1f2937",    // Gray-800 text
          
          "info": "#3b82f6",            // Blue-500
          "success": "#10b981",         // Emerald-500  
          "warning": "#f59e0b",         // Yellow-500
          "error": "#ef4444",           // Red-500
        },
        
        "youdating-dark": {
          "primary": "#fcd34d",         // Brighter yellow for dark mode
          "primary-focus": "#fbbf24",   // Yellow-400
          "primary-content": "#0f172a", // Slate-900
          
          "secondary": "#374151",       // Gray-700
          "secondary-focus": "#4b5563", // Gray-600
          "secondary-content": "#f9fafb", // Gray-50
          
          "accent": "#1f2937",          // Gray-800
          "accent-focus": "#111827",    // Gray-900
          "accent-content": "#f9fafb",  // Gray-50
          
          "neutral": "#9ca3af",         // Gray-400 for text
          "neutral-focus": "#6b7280",   // Gray-500
          "neutral-content": "#1f2937", // Gray-800
          
          "base-100": "#0f172a",        // Slate-900 background
          "base-200": "#1e293b",        // Slate-800
          "base-300": "#334155",        // Slate-700
          "base-content": "#f1f5f9",    // Slate-100 text
          
          "info": "#60a5fa",            // Blue-400
          "success": "#34d399",         // Emerald-400
          "warning": "#fbbf24",         // Yellow-400
          "error": "#f87171",           // Red-400
        }
      },
      "light", // fallback light theme
      "dark"   // fallback dark theme
    ],
    darkTheme: "youdating-dark",
    base: true,
    styled: true,
    utils: true,
    rtl: false,
    prefix: "",
    logs: true,
  }
};

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
    extend: {}
  },
  plugins: [
    // include plugin only if available
    ...(animatePlugin ? [animatePlugin] : [])
  ]
};

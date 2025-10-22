let animatePlugin;
try {
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
  theme: { extend: {} },
  plugins: [
    ...(animatePlugin ? [animatePlugin] : [])
  ]
};

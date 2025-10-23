import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { 
    ignores: ["dist/**", "build/**", "node_modules/**", "**/*.min.js", "dist/**/*.js"]
  },
  { 
    files: ["**/*.{js,mjs,cjs,jsx}"]
  },
  // Node.js scripts configuration
  {
    files: ["scripts/**/*.js", "scripts_migrate-*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  { 
    languageOptions: { 
      globals: {
        ...globals.browser,
        ...globals.es2021
      },
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
      }
    }
  },
  {
    files: ["api/**/*.js", "scripts/**/*.js", "*.config.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021
      }
    }
  },
  js.configs.recommended,
  react.configs.flat.recommended,
  {
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "warn",
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "react/no-unescaped-entities": "warn",
      ...reactHooks.configs.recommended.rules,
    },
  },
];

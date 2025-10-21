# Youdating

A simple dating app built with modern JavaScript tooling (Vite, React). This repository contains the app source, CI workflows, and helper scripts used for automated migrations.

## Features

- Responsive React UI
- Client-side data fetching with React Query
- Vite-powered dev & production builds
- CI workflows for build & automated migration
- Scripts to help migrate/remove legacy SDK references

## Demo

Describe any links/screenshots/demo instructions here:

- Live demo: (add URL here)
- Screenshot: add images/screenshots in `docs/` or `assets/`

## Getting started

Prerequisites
- Node.js 18+ (or the version used in your project)
- npm or yarn
- Git

Install
```bash
npm install
# or
# yarn
```

Development
```bash
npm run dev
# opens dev server via Vite
```

Build (production)
```bash
npm run build
```

Run locally (serve production build)
```bash
npm run preview
```

## Project structure

- src/ - React source code
- scripts/ - migration & helper scripts (e.g., migrate-base44.js)
- .github/workflows/ - CI and automated migration workflows
- public/ or assets/ - static files (if present)

## Contributing

If you want to contribute:

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Make your changes and add tests if applicable
4. Commit and push, then open a PR

Please ensure:
- The project builds locally (`npm run build`) before opening a PR.
- Tests (if any) pass.

## Troubleshooting / Notes

- On macOS the filesystem can be case-insensitive. Make sure component filenames match their import casing (e.g., `App.jsx` vs `app.jsx`) — CI runners on Linux are case-sensitive and will fail if casing doesn't match.
- If a workflow needs to create branches/PRs, ensure the workflow permissions include:
```yaml
permissions:
  contents: write
  pull-requests: write
```
and that `actions/checkout@v3` uses `persist-credentials: true` when pushing with `GITHUB_TOKEN`.

## License

Specify a license (e.g., MIT). Add a LICENSE file if you don't already have one.

## Contact

For questions or help, open an issue or contact: alex@yourdomain.example (replace with your preferred contact).
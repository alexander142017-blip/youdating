# YouDating

A modern dating application built with React and Supabase.

## Features

- User authentication and profile management
- Match discovery and preferences
- Real-time messaging
- In-app purchases and premium features
- Profile verification
- Analytics dashboard

## Technology Stack

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **UI Components**: Radix UI + Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v7

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account and project

### Environment Setup

Create a `.env` file in the root directory:

```bash
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Linting

```bash
npm run lint
```

## Documentation

- [API Migration Guide](docs/API_MIGRATION.md) - Details about the Supabase integration
- [Supabase Schema](docs/API_MIGRATION.md#supabase-schema-requirements) - Database schema requirements

## Project Structure

```
src/
├── api/           # API helpers and Supabase client
│   ├── auth.js           # Authentication helpers
│   ├── profiles.js       # Profile management
│   ├── purchases.js      # Purchase tracking
│   ├── supabase.js       # Supabase client
│   └── base44Client.js   # Compatibility layer
├── components/    # React components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── lib/           # Utility libraries
└── utils/         # Helper functions
```

## Support

For questions or issues, please open a GitHub issue.

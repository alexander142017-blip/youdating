# YouDating

A modern dating application built with Vite, React, Supabase, and Tailwind CSS.

## Tech Stack

- **Frontend Framework**: React 18 with Vite for fast development and optimized builds
- **Backend & Database**: Supabase (PostgreSQL database, authentication, storage)
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI primitives for accessible, customizable components
- **Routing**: React Router v7
- **State Management**: TanStack Query (React Query) for server state
- **Form Handling**: React Hook Form with Zod validation

## Features

- User authentication and profile management
- Profile discovery and matching
- Real-time messaging
- Like system with mutual matches
- Premium features and in-app store
- Admin dashboard and analytics
- Mobile-responsive design

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Supabase account and project

### Environment Setup

Create a `.env` file in the root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── api/          # API helper functions for Supabase
├── components/   # Reusable React components
├── hooks/        # Custom React hooks
├── lib/          # Utility libraries
├── pages/        # Page components (routes)
├── utils/        # Helper utilities
└── main.jsx      # Application entry point
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

Private project

## Notes

This is a standalone application that uses Supabase for backend services. **Base44 is NOT used in this project.**


# YouDating AI Assistant Instructions

## Architecture Overview

YouDating is a **Vite + React + Supabase + Tailwind** dating app using modern React patterns.

### Tech Stack
- **Frontend**: Vite + React 18 + React Router DOM
- **Styling**: Tailwind CSS + Radix UI components + Framer Motion
- **Backend**: Supabase (auth, database, storage)
- **State**: TanStack React Query for server state
- **Forms**: React Hook Form + Zod validation

## Critical Patterns

### API Layer Structure (`src/api/`)
- **`supabase.js`**: Base client configuration with env validation
- **`auth.js`**: User authentication with profile merging pattern
- **`profiles.js`**: Profile CRUD operations with consistent error handling
- Files use async/await with explicit error throwing, not try/catch

**Example Pattern:**
```javascript
export async function getProfile({ userId, email }) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error; // Let React Query handle errors
  return data;
}
```

### Component Organization
- **Pages** (`src/pages/`): Route-level components (Profile, Messages, Discover, etc.)
- **Shared Components** (`src/components/shared/`): Reusable UI components
- **Layout System**: Responsive sidebar + mobile bottom nav in `Layout.jsx`

### Authentication & Routing
- All pages assume authenticated users (no public routes currently)
- **Profile completion check**: Users redirected to onboarding if `profile_completed: false`
- **Admin routes**: Conditional navigation based on `user.role === 'admin'`

## Development Workflows

### Environment Setup
```bash
# Required env vars (copy from .env.example)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Start development
npm ci && npm run dev
```

### Build Process
- **CI/CD**: `.github/workflows/ci-build.yml` runs on all PRs
- **Build command**: `npm run build` (Vite builds to `dist/`)
- **Graceful env handling**: App builds without secrets, warns at runtime

### Legacy Code Notes
- **Base44 Migration**: Old `@base44/sdk` references archived in `scripts/archive/`
- **Duplicate files**: Files with ` 2` suffix exist from merge conflicts - prefer non-numbered versions
- **Tailwind Config**: Uses CommonJS with graceful `tailwindcss-animate` fallback

## Project-Specific Conventions

### Component Patterns
1. **Shadcn/ui components**: Import from `@/components/ui/`
2. **Lucide icons**: Consistent icon library usage
3. **Query patterns**: Use React Query with 5min staleTime for user data
4. **Toast notifications**: `sonner` for user feedback

### Data Flow
1. **Authentication**: `getCurrentUser()` merges Supabase auth + profile table
2. **Profile system**: Separate profiles table extends auth.users
3. **Real-time features**: Supabase subscriptions for matches/messages
4. **Admin features**: Role-based UI rendering (no backend enforcement shown)

### File Naming & Imports
- **Absolute imports**: Use `@/` alias pointing to `src/`
- **Component files**: PascalCase `.jsx` extensions
- **API files**: camelCase `.js` extensions
- **Page routing**: React Router with `createPageUrl()` helper

## Key Integration Points

### Supabase Integration
- **Tables**: `profiles`, `matches`, `messages`, `blocks`, `reports` (inferred)
- **Auth flow**: Email/password with profile completion check
- **Real-time**: WebSocket subscriptions for live features
- **Storage**: File uploads for profile photos (pattern exists)

### UI Framework
- **Radix UI**: Headless components with Tailwind styling
- **Mobile-first**: Responsive design with sidebar → bottom nav breakpoint
- **Theme system**: CSS custom properties in Layout.jsx

## Common Debugging Commands
```bash
# Install dependencies (prefer ci for exact lockfile)
npm ci

# Development server
npm run dev

# Production build
npm run build

# Lint check
npm run lint
```

## When Adding Features
1. **New pages**: Add to `src/pages/` and update `navigationItems` in `Layout.jsx`
2. **API calls**: Follow existing patterns in `src/api/` with error throwing
3. **Components**: Use Radix UI + Tailwind, avoid custom CSS
4. **State**: Use React Query for server state, local state for UI only
5. **Admin features**: Check `currentUser?.role === 'admin'` for conditional rendering
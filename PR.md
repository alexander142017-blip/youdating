# Auth API Unification and Profile Schema Improvements

## Changes

### Auth API Standardization
- Unified all auth helpers to use `getCurrentUser` and `getCurrentUserId`
- Removed redundant `getCurrentSessionUser` function
- Updated all components to use standardized imports from '@/api/auth'
- Added consistent error handling with '[auth.*]' prefixes

### Profile API Improvements
- Enhanced `upsertProfile` with automatic `getCurrentUserId` fallback
- Removed redundant `fetchMyProfile` function in favor of unified approach
- Added schema-safe payload handling with null coalescing
- Improved type consistency in profile updates

### Build & Config
- Simplified vite.config.js while maintaining '@' path aliases
- Standardized import paths across codebase
- Removed unnecessary dedupe and optimizeDeps options

## Migration Notes
- All components now import from '@/api/auth' using absolute paths
- Profile updates can omit user_id when operating on current user
- Session management stays in session.js, auth utilities in auth.js

## Testing
- ✅ npm run lint (expected warnings for standardized imports)
- ✅ npm run build (successful production build)
- Verified auth flow and profile updates work correctly

## Impact
This change improves code maintainability by:
1. Establishing a single pattern for auth operations
2. Making profile updates more robust with automatic user context
3. Reducing code duplication in auth and profile management
4. Setting clear boundaries between auth, session, and profile concerns
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack (runs on localhost:3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Architecture Overview

This is a Next.js 15 application with Supabase authentication and shadcn/ui components.

### Core Structure
- **App Router**: Uses Next.js App Router (`app/` directory)
- **Authentication**: Supabase Auth with cookie-based sessions
- **UI Components**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Theme Support**: Light/dark mode via `next-themes`

### Key Directories
- `app/` - App Router pages and layouts
- `app/auth/` - Authentication pages (login, sign-up, password reset)
- `app/protected/` - Protected routes requiring authentication
- `components/` - Reusable React components
- `components/ui/` - shadcn/ui base components
- `components/tutorial/` - Tutorial-specific components
- `lib/` - Utility functions and configurations
- `lib/supabase/` - Supabase client configurations

### Supabase Configuration

The app uses three Supabase client configurations:

1. **Client-side** (`lib/supabase/client.ts`): Browser client for client components
2. **Server-side** (`lib/supabase/server.ts`): Server client for server components with enhanced error handling
3. **Middleware** (`lib/supabase/middleware.ts`): Authentication middleware with route protection

**Important**: The Supabase clients include Japanese error messages and enhanced URL validation.

### Authentication Flow
- Middleware (`middleware.ts`) handles session updates and route protection
- Unauthenticated users are redirected to `/auth/login` (except for auth routes and home page)
- Protected routes are under `/protected/`
- Auth confirmation handled via `/auth/confirm/route.ts`

### Environment Variables
Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` - Supabase anon key

Note: Environment variable validation includes Japanese error messages.

### shadcn/ui Configuration
- Uses "new-york" style
- Components use CSS variables for theming
- Icon library: Lucide React
- Path aliases configured for `@/components`, `@/lib`, etc.

### Development Notes
- Font: Geist Sans with CSS variables
- TypeScript configured with strict settings
- ESLint with Next.js configuration
- Tailwind with custom animation utilities
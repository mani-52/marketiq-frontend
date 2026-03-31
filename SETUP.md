# MarketIQ — Setup & Run Guide

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
```bash
cp .env.local.example .env.local
```
Then edit `.env.local` and fill in:

| Variable | How to get it |
|---|---|
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` for local dev |
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com/) |
| `GOOGLE_CLIENT_SECRET` | Same as above |

#### Google OAuth Setup (for Google login)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add Authorised redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Secret to `.env.local`

> **Note:** Google login requires real credentials. Email/password login works without Google credentials.

### 3. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Register an account
- Go to `/register` to create an email/password account
- Or use Google OAuth if credentials are configured

---

## What was fixed

### Auth Flow Fixes
- `layout.tsx` — wrapped with `AuthProvider` (SessionProvider) so `useSession()` works globally
- `AuthProvider.tsx` — clean SessionProvider wrapper
- `UserMenu.tsx` — added loading state, outside-click to close, proper `useSession` with status check
- `Topbar.tsx` — replaced hardcoded "JD" avatar with real session user; shows Login button if not authenticated
- `Sidebar.tsx` — added `UserMenu` component at the bottom

### Middleware Fix
- Moved `middleware.ts` from project root → `src/middleware.ts` (required for App Router)
- Protects `/dashboard/*` routes — unauthenticated users are redirected to `/login`

### NextAuth Fix
- Added `redirect` callback to ensure post-login redirect goes to `/dashboard`
- Exported `authOptions` for reuse
- Graceful fallback when `NEXTAUTH_SECRET` is not set

### Navigation Fixes
- All clickable auth elements use `useRouter()` from `next/navigation`
- Login button in `UserMenu` and `Topbar` both call `router.push('/login')`
- Dashboard link in dropdown calls `router.push('/dashboard')`

---

## Build for production
```bash
npm run build
npm start
```

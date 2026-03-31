# MarketIQ Frontend v2

Next.js 14 frontend for the MarketIQ intelligence platform.

## 🚀 Quick Start

```bash
1. Clone repo
2. Copy environment file:
   cp .env.example .env.local

3. Install dependencies:
   npm install

4. Run:
   npm run dev
# → http://localhost:3000
```

## 🔑 Environment Variables (.env.local)

| Key | Required | Description |
|-----|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend URL (default: http://127.0.0.1:8000) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Optional | For Google Sign-In button |

## 🔐 Authentication

Uses **JWT-based auth** against the MarketIQ backend (no NextAuth dependency):

- Email + password register/login → JWT stored in `localStorage`
- Google Sign-In via Google Identity Services → JWT from backend
- `AuthProvider` context provides `user`, `loading`, `logout`
- All API calls automatically include `Authorization: Bearer <token>`

### Google Sign-In Setup
1. Go to https://console.cloud.google.com
2. Create OAuth 2.0 credentials (Web application)
3. Add `http://localhost:3000` to Authorized JavaScript Origins
4. Copy the Client ID to `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

## 📄 Pages

| Route | Description |
|-------|-------------|
| `/login` | Sign in (email/password + Google) |
| `/register` | Create account (email/password + Google) |
| `/dashboard` | Overview |
| `/dashboard/analyze` | Company intelligence (1–30 day range) |
| `/dashboard/notifications` | Notification engine + reminders |
| `/dashboard/domain-matrix` | Domain classification matrix |
| `/dashboard/insights` | Aggregated insights |
| `/dashboard/history` | Search history |
| `/dashboard/settings` | Account & API settings |

## 🔔 Notifications Page

- Create scheduled reminders (exact datetime or quick offsets: 15m, 1h, 6h, 24h)
- Daily / weekly repeat options
- Emails sent to your registered account email
- View sent log
- Toggle: email notifications, risk alerts, analysis complete, weekly digest

## 📊 Analysis — Days Input

The Analyze page lets users pick **1 to 30 days** via:
- Quick presets: 1d / 3d / 7d / 14d / 30d
- Custom input: type any number 1–30

## 🎨 Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts
- Lucide React

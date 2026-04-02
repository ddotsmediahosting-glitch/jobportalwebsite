# DdotsmediaJobs Mobile App

Expo React Native app for [ddotsmediajobs.com](https://ddotsmediajobs.com) — built for Android and iOS.

## Setup

```bash
cd mobile
cp .env.example .env
npm install
npm start          # Expo Dev Client
npm run android    # Android emulator
npm run ios        # iOS simulator
```

## Environment Variables

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend API base URL (default: `https://ddotsmediajobs.com/api/v1`) |
| `EXPO_PUBLIC_APP_URL` | Website base URL for deep links |

## Architecture

```
mobile/
├── app/                  # Expo Router file-based routes
│   ├── _layout.tsx       # Root layout — QueryClient, auth hydration, push setup
│   ├── (auth)/           # Unauthenticated screens (login, register, forgot-password)
│   ├── (tabs)/           # Tab navigator (home, jobs, saved, notifications, profile)
│   ├── jobs/[slug].tsx   # Job detail with apply, save, share
│   └── companies/[slug].tsx  # Company profile + open positions
├── src/
│   ├── api/              # Axios client + typed API modules
│   ├── components/       # Shared UI (Button, Input, Badge, Skeleton, JobCard, FilterSheet)
│   ├── constants/        # Colors, labels, query keys
│   ├── hooks/            # usePushNotifications
│   ├── store/            # Zustand auth store
│   ├── types/            # Full TypeScript types aligned with backend schema
│   └── utils/            # format.ts (salary, dates, text)
```

## Features
- JWT auth with silent token refresh
- Real-time job search with filters (emirate, work mode, employment type)
- Save / unsave jobs (optimistic UI)
- One-tap job application
- Push notifications (Expo push tokens registered with backend)
- Candidate profile with avatar + resume upload
- Company profile page

## Backend Requirements (new endpoints added)

| Endpoint | Purpose |
|---|---|
| `POST /api/v1/notifications/push-token` | Register Expo push token |
| `DELETE /api/v1/notifications/push-token` | Remove push token on logout |

**Schema migration required:**
```bash
cd backend
npx prisma migrate dev --name add_device_tokens
```

## Building for production

```bash
npm install -g eas-cli
eas login
eas build --platform android   # .aab for Play Store
eas build --platform ios       # .ipa for App Store
```

## Known Limitations / Next Steps

1. **Push delivery not yet implemented** — device tokens are stored, but the backend `NotificationsService.createNotification()` does not yet call the Expo Push API to deliver to devices. Add `sendExpoPush(userId, title, body)` helper in `notifications.service.ts`.
2. **Social OAuth** — Google/LinkedIn/Facebook OAuth redirect flow needs deep-link handling (`ddotsmediajobs://social-callback`).
3. **Employer dashboard** — not included in this version; employer-specific screens can be added under `app/(employer)/`.
4. **google-services.json** — required for Android push; obtain from Firebase Console and place in `mobile/`.

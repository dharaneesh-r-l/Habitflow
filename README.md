# HabitFlow

A premium, futuristic habit tracker built with React Native, Expo, and TypeScript. Track habits, build routines, view analytics, earn XP, and get AI-powered insights — all stored locally on your device.

## Features

- **Home Dashboard** — Personalized greeting, animated circular progress, daily completion checklist, routines (morning/afternoon/evening/night), upcoming reminders, streak & XP tracking, motivational messages, daily challenges
- **Habit Management** — Create, edit, delete, archive, and pause habits. 40+ predefined habits in the library. 9 categories, 4 habit types (boolean, count, duration, target). Daily/weekly/custom schedules with custom colors, icons, and multiple reminders
- **Reminder Center** — Schedule per-habit notifications with custom times, messages, and weekday repeats. Enable/disable, snooze support, sound settings
- **Calendar** — Monthly view with completion heatmap, select any date to inspect habit history
- **Analytics** — Weekly/monthly stats, completion rate charts, consistency heatmap, per-habit performance, streak tracking, perfect days
- **Gamification** — XP points, levels, 12 achievement badges, streak rewards, daily challenges, milestone celebrations
- **AI Coach** — Locally-generated habit recommendations and productivity insights from your actual data (no API key required, ready for future AI integration)
- **Profile & Settings** — Dark/light theme, notification settings, week start preference, data export, reset, app info

Numeric habits show progress toward their target and count as complete once the target is reached. The daily challenge awards its XP once per day when its goal is met. Habit reminders require notification permission on the device.

## Tech Stack

- **React Native** + **Expo** (SDK 57) + **TypeScript**
- **Expo Router** for navigation
- **Zustand** for state management
- **AsyncStorage** for local persistence
- **Expo Notifications** for reminders
- **React Native Reanimated** for animations
- **Lucide React Native** for icons
- **react-native-svg** for charts
- **date-fns** for date utilities
- **Inter** font family

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Running the App

```bash
# Start the Expo dev server (works across all platforms)
npm start
# or
npm run dev

# Run directly for Android mobile / emulator
npm run android
# or
npx expo start --android

# Run for iOS or Web
npm run ios
npm run web
```

### Build for Production

```bash
# Web build
npm run build:web

# First OTA-enabled production APK (install over the existing app; requires EAS)
npx eas-cli build --platform android --profile production-apk
```

The `production-apk` profile creates an installable APK on the production update
channel. The existing `production` profile remains an Android App Bundle profile
for store releases. Both use the same production channel.

## Over-the-Air Updates

The app checks for updates automatically when it launches. A compatible update
downloads in the background and is applied on the next app launch, rather than
restarting the app while it is in use. If the device is offline, the last
available embedded or downloaded update remains usable.

Test an update with a preview-channel build first:

```bash
npx eas-cli build --platform android --profile preview
npx eas-cli update --channel preview --message "Describe the preview update"
```

After testing and approval, publish to production:

```bash
npx eas-cli update --channel production --message "Describe your update"
```

OTA updates are for JavaScript, React Native UI/logic, and bundled asset changes
that are compatible with the installed native runtime. Adding or changing native
dependencies, Android code or permissions, native configuration, or the Expo
SDK requires a new native build. The `fingerprint` runtime-version policy
separates updates by native runtime, so an update is not offered to a build with
a different native fingerprint.

### Local data and migrations

EAS Updates replace the JavaScript/assets bundle; they do not clear or recreate
AsyncStorage. HabitFlow continues to use its existing local storage keys:
`habitflow_habits`, `habitflow_completions`, `habitflow_preferences`,
`habitflow_achievements`, `habitflow_stats`, `habitflow_seeded`, and
`habitflow_onboarding_completed`. No storage keys, Zustand store structure, or
data migrations are introduced by OTA configuration. A native APK upgrade must
be installed over the existing app (same Android package and signing key), not
after uninstalling it, to retain Android app data.

If a future app release changes persisted data, add a versioned migration that
reads the current version, transforms only necessary fields, preserves existing
records, and writes the new version only after success. Keep a recoverable copy
of the original data until validation succeeds; on failure, retain and continue
using the old data rather than replacing it with defaults. Test migrations
against copies of representative stored records before release.

## Project Structure

```
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout
│   ├── +not-found.tsx      # 404 screen
│   └── (tabs)/             # Tab navigation
│       ├── _layout.tsx     # Tab bar config
│       ├── index.tsx       # Home dashboard
│       ├── habits.tsx      # Habit management
│       ├── calendar.tsx    # Calendar view
│       ├── insights.tsx    # Analytics
│       ├── coach.tsx       # AI Coach
│       └── profile.tsx     # Profile & settings
├── components/             # Reusable components
│   ├── ui/                 # Card, Button, Modal, CircularProgress
│   ├── HabitItem.tsx       # Habit row item
│   ├── HabitFormModal.tsx  # Create/edit habit form
│   └── IconHelper.tsx      # Lucide icon mapper
├── store/                  # Zustand state
│   └── habitStore.ts       # Habits, completions, stats, prefs
├── services/               # Platform services
│   ├── storage.ts          # AsyncStorage wrapper
│   └── notifications.ts    # Expo Notifications scheduling
├── data/                   # Static data
│   ├── habitLibrary.ts     # 40+ predefined habits
│   └── achievements.ts     # Badge definitions
├── theme/                  # Theme system
│   ├── colors.ts           # Dark & light palettes
│   ├── ThemeContext.ts     # Theme context
│   └── ThemeProvider.tsx   # Theme provider
├── types/                  # TypeScript types
│   └── index.ts
└── utils/                  # Utilities
    └── date.ts             # Date helpers, streak calc, XP/level
```

## Data Storage

All data is stored locally using AsyncStorage — no server or account required. Sample habits can be loaded explicitly from Profile > Load Sample Habits. Use the Profile > Reset All Data option to start fresh.

## Notifications

Reminders use Expo Notifications. On first launch, the app requests notification permissions. Reminders are scheduled per-habit with custom times and repeat days. On Android, notifications appear in the system notification tray.

## License

MIT

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
# Start the Expo dev server
npm run dev

# Or start with a specific platform
npx expo start --android
npx expo start --ios
npx expo start --web
```

### Build for Production

```bash
# Web build
npm run build:web

# Android build (requires EAS)
eas build --platform android
```

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

All data is stored locally using AsyncStorage — no server or account required. The app seeds sample habits on first launch for demonstration. Use the Profile > Reset All Data option to start fresh.

## Notifications

Reminders use Expo Notifications. On first launch, the app requests notification permissions. Reminders are scheduled per-habit with custom times and repeat days. On Android, notifications appear in the system notification tray.

## License

MIT

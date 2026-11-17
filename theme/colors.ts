export const darkTheme = {
  // Sophisticated dark navy / obsidian palette
  background: '#090D16',
  surface: '#0F1626',
  surfaceAlt: '#151E34',
  surfaceElevated: '#1A2540',
  card: '#111827',
  cardBorder: 'rgba(139, 92, 246, 0.14)',
  cardBorderHighlight: 'rgba(124, 92, 252, 0.32)',

  // Signature purple / violet accents
  primary: '#7C5CFC',
  primaryLight: '#9B82FD',
  primaryDark: '#5E3EE4',
  primaryDim: 'rgba(124, 92, 252, 0.14)',
  primaryGlow: 'rgba(124, 92, 252, 0.28)',

  // Supportive semantic accents
  accent: '#06D6A0',          // Emerald cyan for positive habits / success
  accentDim: 'rgba(6, 214, 160, 0.14)',
  streak: '#FF6B4A',          // Warm fiery coral for streaks
  streakDim: 'rgba(255, 107, 74, 0.15)',
  xp: '#F59E0B',              // Amber gold for gamification / XP
  xpDim: 'rgba(245, 158, 11, 0.14)',
  blue: '#38BDF8',            // Sky blue for analytics / info
  blueDim: 'rgba(56, 189, 248, 0.14)',

  // Status colors
  success: '#10B981',
  successDim: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B',
  warningDim: 'rgba(245, 158, 11, 0.15)',
  error: '#EF4444',
  errorDim: 'rgba(239, 68, 68, 0.15)',

  // Typography
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  // UI inputs & navigation
  inputBg: '#131B2E',
  inputBorder: 'rgba(148, 163, 184, 0.15)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.04)',
  overlay: 'rgba(5, 8, 15, 0.82)',
  gradientStart: '#7C5CFC',
  gradientEnd: '#3B82F6',
  navBg: '#0B101D',
  navBorder: 'rgba(255, 255, 255, 0.07)',
  shadow: 'rgba(0, 0, 0, 0.35)',
};

export const lightTheme = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  surfaceElevated: '#EDE9FE',
  card: '#FFFFFF',
  cardBorder: 'rgba(124, 92, 252, 0.12)',
  cardBorderHighlight: 'rgba(124, 92, 252, 0.28)',

  primary: '#6D28D9',
  primaryLight: '#8B5CF6',
  primaryDark: '#5B21B6',
  primaryDim: 'rgba(109, 40, 217, 0.08)',
  primaryGlow: 'rgba(109, 40, 217, 0.18)',

  accent: '#059669',
  accentDim: 'rgba(5, 150, 105, 0.08)',
  streak: '#EA580C',
  streakDim: 'rgba(234, 88, 12, 0.10)',
  xp: '#D97706',
  xpDim: 'rgba(217, 119, 6, 0.10)',
  blue: '#0284C7',
  blueDim: 'rgba(2, 132, 199, 0.08)',

  success: '#059669',
  successDim: 'rgba(5, 150, 105, 0.10)',
  warning: '#D97706',
  warningDim: 'rgba(217, 119, 6, 0.10)',
  error: '#DC2626',
  errorDim: 'rgba(220, 38, 38, 0.10)',

  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',

  inputBg: '#F1F5F9',
  inputBorder: 'rgba(148, 163, 184, 0.22)',
  border: 'rgba(148, 163, 184, 0.18)',
  borderLight: 'rgba(148, 163, 184, 0.10)',
  overlay: 'rgba(15, 23, 42, 0.45)',
  gradientStart: '#7C5CFC',
  gradientEnd: '#6366F1',
  navBg: '#FFFFFF',
  navBorder: 'rgba(148, 163, 184, 0.15)',
  shadow: 'rgba(15, 23, 42, 0.08)',
};

export type Theme = typeof darkTheme;

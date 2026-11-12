import React, { useMemo, useEffect } from 'react';
import { useHabitStore } from '@/store/habitStore';
import { darkTheme, lightTheme, ThemeMode } from './colors';
import { ThemeContext } from './ThemeContext';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const preferences = useHabitStore((s) => s.preferences);
  const updatePreferences = useHabitStore((s) => s.updatePreferences);
  const init = useHabitStore((s) => s.init);
  const loaded = useHabitStore((s) => s.loaded);

  useEffect(() => {
    init();
  }, []);

  const mode: ThemeMode = preferences.theme;
  const theme = mode === 'dark' ? darkTheme : lightTheme;

  const value = useMemo(
    () => ({
      theme,
      mode,
      setMode: (m: ThemeMode) => updatePreferences({ theme: m }),
      toggle: () => updatePreferences({ theme: mode === 'dark' ? 'light' : 'dark' }),
    }),
    [theme, mode, updatePreferences]
  );

  if (!loaded) {
    // Return children anyway; screens handle loading
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

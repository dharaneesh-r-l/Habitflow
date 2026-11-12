import { createContext, useContext } from 'react';
import { darkTheme, lightTheme, Theme } from './colors';

export type ThemeMode = 'dark' | 'light';

export const ThemeContext = createContext<{
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}>({
  theme: darkTheme,
  mode: 'dark',
  setMode: () => {},
  toggle: () => {},
});

export const useAppTheme = () => useContext(ThemeContext);

export { darkTheme, lightTheme };

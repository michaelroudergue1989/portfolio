import { useSyncExternalStore } from 'react';
import { getTheme, setTheme, subscribeTheme, type Theme } from '@/lib/theme';

export function useTheme(): {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
} {
  const theme = useSyncExternalStore(subscribeTheme, getTheme);
  return {
    theme,
    setTheme,
    toggleTheme: () => {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    },
  };
}

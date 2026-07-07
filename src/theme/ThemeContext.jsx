import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme } from './themes';

const THEME_PREF_KEY = '@studylog/theme_pref';

// pref: 'system' | 'light' | 'dark'
const ThemeContext = createContext({
  theme: lightTheme,
  pref: 'system',
  setPref: () => {},
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [pref, setPrefState] = useState('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_PREF_KEY).then(v => {
      if (v === 'light' || v === 'dark' || v === 'system') {
        setPrefState(v);
      }
    });
  }, []);

  const setPref = async next => {
    setPrefState(next);
    await AsyncStorage.setItem(THEME_PREF_KEY, next);
  };

  const resolved = pref === 'system' ? systemScheme || 'light' : pref;
  const theme = resolved === 'dark' ? darkTheme : lightTheme;

  const value = useMemo(() => ({ theme, pref, setPref }), [theme, pref]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

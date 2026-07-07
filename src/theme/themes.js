// Color palettes for light and dark mode (Feature 22).
// Primary is a calm indigo; accent green signals goal-hit / positive states.

export const lightTheme = {
  mode: 'light',
  bg: '#F5F6FA',
  card: '#FFFFFF',
  cardAlt: '#F0F1F6',
  border: '#E3E5ED',
  text: '#1A1B25',
  textMuted: '#6B6E80',
  textFaint: '#9AA0B0',
  primary: '#4C5BD4',
  primarySoft: '#E7E9FB',
  accent: '#2BB673',
  accentSoft: '#DFF3E9',
  warn: '#E5A400',
  warnSoft: '#FBF0D3',
  danger: '#E0533D',
  dangerSoft: '#FBE4DF',
  // Heatmap intensity ramp (lightest -> darkest) for study hours.
  heat: ['#EAECF4', '#CBD3F2', '#9FADE8', '#6E80DE', '#4C5BD4', '#33409E'],
};

export const darkTheme = {
  mode: 'dark',
  bg: '#0F1017',
  card: '#181A24',
  cardAlt: '#20222E',
  border: '#2A2D3A',
  text: '#F2F3F8',
  textMuted: '#A0A4B4',
  textFaint: '#6B6F80',
  primary: '#7C8AF0',
  primarySoft: '#242844',
  accent: '#3FCB88',
  accentSoft: '#16311F',
  warn: '#F1B838',
  warnSoft: '#332B12',
  danger: '#F0715B',
  dangerSoft: '#331E1A',
  heat: ['#1B1E2B', '#2A335C', '#3B4A9A', '#4C5BD4', '#6E80DE', '#9FADE8'],
};

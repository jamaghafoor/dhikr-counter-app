import { Platform } from 'react-native';

export const colors = {
  paper: '#F8F7F2',
  white: '#FFFFFF',
  ink: '#183C35',
  green: '#174E40',
  deep: '#123D33',
  mint: '#EAF0E8',
  soft: '#F0F1E9',
  line: '#E4E7DD',
  muted: '#78837A',
  gold: '#B39457',
  paleGold: '#F2EAD8',
  danger: '#A54C40',
};
export const fonts = {
  display: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia',
  }),
  arabic: Platform.select({
    ios: 'Geeza Pro',
    android: 'serif',
    default: 'serif',
  }),
};

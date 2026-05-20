import { createTamagui } from 'tamagui';
import { config as defaultConfig } from '@tamagui/config';
import { createAnimations } from '@tamagui/animations-react-native';

const animations = createAnimations({
  fast: {
    type: 'spring',
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
  medium: {
    type: 'spring',
    damping: 10,
    mass: 1,
    stiffness: 200,
  },
  slow: {
    type: 'spring',
    damping: 15,
    mass: 1,
    stiffness: 100,
  },
});

const config = createTamagui({
  ...defaultConfig,
  animations,
  defaultTheme: 'dark',
  tokens: {
    ...defaultConfig.tokens,
    color: {
      ...defaultConfig.tokens.color,
      brandGreen: '#4CAF50',
      brandOrange: '#FFA726',
      brandRed: '#D32F2F',
      brandGold: '#F5A623',
      brandGray: '#2A2A2A',
      brandSurface: '#1E1E1E',
      brandBg: '#121212',
      brandText: '#FFFFFF',
      brandTextSecondary: '#AAAAAA',
    },
  },
});

export type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;

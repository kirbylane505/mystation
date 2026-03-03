import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.idmg.mystation',
  appName: 'MyStation',
  webDir: 'out',
  server: {
    url: 'https://mystationlive.com',
    cleartext: false,
  },
  ios: {
    scheme: 'MyStation',
    contentInset: 'automatic',
    backgroundColor: '#0a0a1a',
  },
  android: {
    backgroundColor: '#0a0a1a',
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0a1a',
      showSpinner: false,
      launchFadeOutDuration: 500,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a1a',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;

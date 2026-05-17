import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scandeepfake.app',
  appName: 'ScanDeepFake',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    AdMob: {
      initializeOnStartup: true
    }
  }
};

export default config;

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
      initializeOnStartup: true,
      androidAppId: 'ca-app-pub-5955602053283707~3790849033'
    }
  }
};

export default config;

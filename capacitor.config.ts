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
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#0F172A",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#00F3FF",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "dark"
    }
  }
};

export default config;

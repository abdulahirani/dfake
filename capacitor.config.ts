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
      androidAppId: "ca-app-pub-5955602053283707~3790849033",
      initializeOnStartup: true
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#030712",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      useDialog: false
    },
    StatusBar: {
      style: "dark"
    }
  }
};

export default config;

import { 
  AdMob, 
  BannerAdSize, 
  BannerAdPosition, 
  BannerAdPluginEvents, 
  AdmobConsentStatus,
  type BannerAdOptions,
  type InterstitialAdOptions,
  type AppOpenAdOptions
} from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// Production AdMob IDs
const ADMOB_APP_ID = 'ca-app-pub-5955602053283707~3790849033';
const ADMOB_BANNER_ID = 'ca-app-pub-5955602053283707/2477767361';
const ADMOB_INTERSTITIAL_ID = 'ca-app-pub-5955602053283707/4763202666';
const ADMOB_APP_OPEN_ID = 'ca-app-pub-5955602053283707/3463545971';

export async function initializeAdMob() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await AdMob.initialize({
      requestTrackingAuthorization: true,
      testingDevices: [],
      initializeForTesting: false,
    });
    console.log('AdMob Initialized');
  } catch (e) {
    console.error('AdMob initialization failed', e);
  }
}

/**
 * 1. App Open Ad Logic
 * To be shown during native splash/loading screen.
 */
export async function showAppOpenAd() {
  if (!Capacitor.isNativePlatform()) return;

  const options: AppOpenAdOptions = {
    adId: ADMOB_APP_OPEN_ID,
  };

  try {
    await AdMob.loadAppOpenAd(options);
    await AdMob.showAppOpenAd();
  } catch (e) {
    console.warn('App Open Ad failed to load/show', e);
  }
}

/**
 * 2. Banner Ad Logic
 * Anchored at the BOTTOM_CENTER.
 * Strict spacing must be maintained in UI to avoid overlap.
 */
export async function showBannerAd() {
  if (!Capacitor.isNativePlatform()) return;

  const options: BannerAdOptions = {
    adId: ADMOB_BANNER_ID,
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 60, // Ensure it doesn't overlap common bottom UI elements
    isTesting: false,
  };

  try {
    await AdMob.showBanner(options);
  } catch (e) {
    console.warn('Banner Ad failed to show', e);
  }
}

export async function hideBannerAd() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await AdMob.hideBanner();
  } catch (e) {
    console.error('Failed to hide banner', e);
  }
}

/**
 * 3. Interstitial Ad Logic
 * Triggered only after scanning operation is completed.
 */
export async function prepareInterstitialAd() {
  if (!Capacitor.isNativePlatform()) return;

  const options: InterstitialAdOptions = {
    adId: ADMOB_INTERSTITIAL_ID,
    isTesting: false,
  };

  try {
    await AdMob.prepareInterstitial(options);
  } catch (e) {
    console.warn('Interstitial Ad failed to prepare', e);
  }
}

export async function showInterstitialAd() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Show only if prepared
    await AdMob.showInterstitial();
  } catch (e) {
    console.warn('Interstitial Ad failed to show - may not be ready', e);
  }
}

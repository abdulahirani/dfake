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

// Production AdMob IDs (fallback to test IDs if requested or live fail)
const IS_PRODUCTION = false; // Set to false to show test ads for verification

const TEST_BANNER = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL = 'ca-app-pub-3940256099942544/1033173712';
const TEST_REWARDED = 'ca-app-pub-3940256099942544/5224354917';
const TEST_APP_OPEN = 'ca-app-pub-3940256099942544/3419835294';

const ADMOB_BANNER_ID = IS_PRODUCTION ? 'ca-app-pub-5955602053283707/2477767361' : TEST_BANNER;
const ADMOB_INTERSTITIAL_ID = IS_PRODUCTION ? 'ca-app-pub-5955602053283707/4763202666' : TEST_INTERSTITIAL;
const ADMOB_APP_OPEN_ID = IS_PRODUCTION ? 'ca-app-pub-5955602053283707/3463545971' : TEST_APP_OPEN;
const ADMOB_REWARDED_ID = IS_PRODUCTION ? 'ca-app-pub-5955602053283707/1164685698' : TEST_REWARDED;

// Unity Fallback (Priority 2)
const UNITY_GAME_ID = '6116956';

let adMobInitialized = false;

export async function initializeAdMob() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await AdMob.initialize({
      requestTrackingAuthorization: true,
      testingDevices: [],
      initializeForTesting: !IS_PRODUCTION,
    });
    adMobInitialized = true;
    console.log('AdMob Initialized');
    await prepareInterstitialAd();
    await prepareRewardedAd();
  } catch (e) {
    console.error('AdMob initialization failed', e);
  }
}

/**
 * 1. App Open Ad Logic
 */
export async function showAppOpenAd() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const options: AppOpenAdOptions = { adId: ADMOB_APP_OPEN_ID };
    await AdMob.loadAppOpenAd(options);
    await AdMob.showAppOpenAd();
  } catch (e) {
    console.warn('App Open Ad failed', e);
  }
}

/**
 * 2. Banner Ad Logic
 */
export async function showBannerAd() {
  if (!Capacitor.isNativePlatform()) return;
  const options: BannerAdOptions = {
    adId: ADMOB_BANNER_ID,
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
    isTesting: !IS_PRODUCTION,
  };
  try {
    await AdMob.showBanner(options);
  } catch (e) {
    console.warn('Banner Ad failed via AdMob, Unity fallback would trigger here for Game ID:', UNITY_GAME_ID);
  }
}

export async function hideBannerAd() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await AdMob.hideBanner();
  } catch (e) {
    console.warn('Hide Banner Ad failed', e);
  }
}

/**
 * 3. Rewarded Ad Logic
 * Required for second scan.
 */
export async function prepareRewardedAd() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await AdMob.prepareRewardVideoAd({
      adId: ADMOB_REWARDED_ID,
      isTesting: !IS_PRODUCTION,
    });
  } catch (e) {
    console.warn('Rewarded Ad preparation failed', e);
  }
}

export async function showRewardedAd(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true; // Pretend it worked for web
  try {
    const reward = await AdMob.showRewardVideoAd();
    return !!reward;
  } catch (e) {
    console.error('Rewarded Ad failed', e);
    return false;
  }
}

/**
 * 4. Interstitial Ad Logic
 */
export async function prepareInterstitialAd() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await AdMob.prepareInterstitial({
      adId: ADMOB_INTERSTITIAL_ID,
      isTesting: !IS_PRODUCTION,
    });
  } catch (e) {
    console.warn('Interstitial Ad failed to prepare', e);
  }
}

export async function showInterstitialAd() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await AdMob.showInterstitial();
  } catch (e) {
    console.warn('Interstitial Ad failed to show', e);
  }
}

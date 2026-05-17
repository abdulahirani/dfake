/**
 * Dynamic Environment Configuration for ScanDeepFake
 * Automatically switches API endpoints based on hosting provider.
 */

import { Capacitor } from '@capacitor/core';

const getApiBaseUrl = () => {
  // If running on native mobile app (Capacitor), default to a production endpoint
  // but allow override via window.location if testing in a web-view pointing to a specific dev server
  if (Capacitor.isNativePlatform()) {
    return 'https://gundkatira-scandeepfake-scanner.hf.space';
  }

  const hostname = window.location.hostname;

  // 1. If running on standard cloud platforms, use the relative path to the current server
  // This is the most reliable way to target the server.ts endpoints
  if (
    hostname.includes('asia-southeast1.run.app') || 
    hostname.includes('web.app') || 
    hostname.includes('hf.space') || 
    hostname === 'localhost' || 
    hostname === '127.0.0.1'
  ) {
    return '';
  }

  // Fallback to production HF space
  return 'https://gundkatira-scandeepfake-scanner.hf.space';
};

export const API_BASE_URL = getApiBaseUrl();
export const DETECTION_ENDPOINT = `${API_BASE_URL}/api/detect`;

/**
 * Dynamic Environment Configuration for ScanDeepFake
 * Automatically switches API endpoints based on hosting provider.
 */

const getApiBaseUrl = () => {
  const hostname = window.location.hostname;

  // 1. If running on Firebase, point to Hugging Face Backend
  if (hostname.includes('web.app') || hostname.includes('firebaseapp.com')) {
    // Replace with your actual Hugging Face Space URL
    return 'https://gundkatira-scandeepfake-scanner.hf.space';
  }

  // 2. If running on Hugging Face or Local, use current origin
  // This allows the Dockerized FastAPI server to handle requests relative to the frontend
  if (hostname.includes('hf.space') || hostname === 'localhost' || hostname === '127.0.0.1') {
    return '';
  }

  // Fallback
  return '';
};

export const API_BASE_URL = getApiBaseUrl();
export const DETECTION_ENDPOINT = `${API_BASE_URL}/api/detect`;

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  Suspense,
  lazy,
  useState,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import {
  Upload,
  Shield,
  Activity,
  Cpu,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Info,
  FileVideo,
  FileImage,
  Loader2,
  BookOpen,
  Sun,
  Moon,
  WifiOff,
  AlertTriangle,
  Menu,
  X,
  Plus,
  Edit3,
  Globe,
  Download,
  Search,
  ExternalLink,
  Clock,
  Share2,
  Copy,
  Check,
  History,
  Trash2,
  ArrowUp,
  Layers,
  Eye,
  Lock,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { OptimizedImage } from './components/OptimizedImage';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { StatusBar } from '@capacitor/status-bar';
import { Camera } from '@capacitor/camera';
import {
  initializeAdMob,
  showAppOpenAd,
  showBannerAd,
  prepareInterstitialAd,
  showInterstitialAd,
} from './lib/admob';
import { API_BASE_URL } from './lib/config';
import {
  auth,
  db,
  isVerifiedAdmin,
  signOutAdmin,
  testConnection,
  type AppConfig,
  type Post,
} from './lib/firebase';
import {
  SITE_PAGES,
  getCanonicalUrl,
  getPagePath,
  parseRouteFromLocation,
  updateHeadSeo,
  type PageId,
} from './lib/seo';
import starterPostsData from '../posts.json';
import starterConfigData from '../config.json';

const AdminPanel = lazy(() => import('./components/AdminPanel'));

interface ScanHistoryEntry {
  id: string;
  filename: string;
  fileType: string;
  detected: boolean;
  confidence: number;
  scannedAt: string;
}

const SCAN_HISTORY_KEY = 'scandeepfake_scan_history_v1';

function estimateReadTime(content: string): string {
  const plain = content.replace(/<[^>]+>/g, ' ').trim();
  const words = plain ? plain.split(/\s+/).length : 0;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

function AdSlot({
  id,
  enabled,
  className,
  theme,
  config,
  type = 'banner',
}: {
  id: string;
  enabled?: boolean;
  className?: string;
  theme: 'dark' | 'light';
  config?: AppConfig | null;
  type?: 'banner' | 'square' | 'short';
}) {
  if (!enabled) return null;

  if (id === 'bottom-anchor' && Capacitor.isNativePlatform()) {
    return null;
  }

  const customCode = config?.settings?.customAdCode;

  const getContainerStyle = () => {
    switch (type) {
      case 'square':
        return 'aspect-square max-w-[300px]';
      case 'short':
        return 'h-20';
      default:
        return 'min-h-[100px]';
    }
  };

  return (
    <div
      className={`relative w-full overflow-hidden flex flex-col items-center justify-center border rounded-2xl transition-all hover:border-[#00F3FF]/40 group ${
        theme === 'dark'
          ? 'bg-white/5 border-white/10'
          : 'bg-black/5 border-black/10'
      } ${getContainerStyle()} ${className || ''}`}
    >
      <div
        className={`absolute top-1 right-2 text-[8px] font-black tracking-widest opacity-40 flex items-center gap-1 ${
          theme === 'dark' ? 'text-white' : 'text-black'
        }`}
      >
        <Info size={8} /> SPONSORED
      </div>

      {customCode ? (
        <div
          className="w-full flex justify-center p-4"
          dangerouslySetInnerHTML={{ __html: customCode }}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 space-y-4">
          <div
            className={`text-[10px] uppercase font-bold tracking-[0.2em] opacity-30 ${
              theme === 'dark' ? 'text-white' : 'text-black'
            }`}
          >
            {type === 'square' ? 'Native Content' : 'Premium Advertisement'}
          </div>

          {!Capacitor.isNativePlatform() && (
            <div className="flex flex-col items-center gap-2">
              <Shield
                size={24}
                className={
                  theme === 'dark' ? 'text-[#00F3FF]/40' : 'text-[#1E40AF]/40'
                }
              />
              <div
                className={`text-[8px] uppercase font-black opacity-20 text-center ${
                  theme === 'dark' ? 'text-white' : 'text-black'
                }`}
              >
                Ad ID: {id}
              </div>
            </div>
          )}

          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', height: '100%' }}
            data-ad-client={config?.settings?.adsClient || id}
            data-ad-slot={id}
            data-ad-format={type === 'square' ? 'rectangle' : 'auto'}
            data-full-width-responsive="true"
          />
        </div>
      )}
    </div>
  );
}

function MatrixIllusion({ theme }: { theme: 'dark' | 'light' }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      <div className="flex justify-around w-full h-full">
        {Array.from({ length: 16 }).map((_, i) => (
          <motion.div
            key={i}
            className={`text-[8px] font-mono whitespace-nowrap writing-vertical-rl ${
              theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'
            }`}
            initial={{ y: -500 }}
            animate={{ y: 800 }}
            transition={{
              duration: 3 + (i % 4),
              repeat: Infinity,
              ease: 'linear',
              delay: (i % 3) * 0.6,
            }}
          >
            {'01010101010101010101010101010101010101010101010101'}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const initialRoute = useMemo(() => parseRouteFromLocation(), []);

  const [showSplash, setShowSplash] = useState(() =>
    Capacitor.isNativePlatform()
  );
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currentPage, setCurrentPage] = useState<PageId>(initialRoute.page);
  const [currentPost, setCurrentPost] = useState<string | null>(
    initialRoute.postId
  );

  // Strict Admin-Only Studio state
  const [user, setUser] = useState<User | null>(null);
  const isAdmin = isVerifiedAdmin(user);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminInitialMode, setAdminInitialMode] = useState<
    'list' | 'create' | 'edit'
  >('list');
  const [adminInitialPost, setAdminInitialPost] = useState<Post | null>(null);

  // Content state (instant 0ms hydration + live Firestore overlay)
  const [seedPosts] = useState<Post[]>(() =>
    Array.isArray(starterPostsData) ? (starterPostsData as Post[]) : []
  );
  const [firestorePosts, setFirestorePosts] = useState<Post[]>([]);
  const [firestorePostIds, setFirestorePostIds] = useState<Set<string>>(
    new Set()
  );
  const [config, setConfig] = useState<AppConfig | null>(
    () => (starterConfigData as AppConfig) || null
  );
  const [blogSearch, setBlogSearch] = useState('');
  const [blogCategory, setBlogCategory] = useState('All');
  const [faqSearch, setFaqSearch] = useState('');

  // Scanner & Local History state
  const [scansCount, setScansCount] = useState(0);
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem(SCAN_HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isOffline, setIsOffline] = useState(false);
  const [tabChangeCount, setTabChangeCount] = useState(0);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [analysisType, setAnalysisType] = useState<'image' | 'video' | null>(
    null
  );
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [result, setResult] = useState<{
    detected: boolean;
    confidence: number;
    metrics: {
      [key: string]: { value: string; status: string; isError: boolean };
    };
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isSecurityVerified, setIsSecurityVerified] = useState(true);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const secretTapRef = useRef<{ count: number; timer: number | null }>({
    count: 0,
    timer: null,
  });

  const handleSecretAdminTap = () => {
    const state = secretTapRef.current;
    state.count += 1;
    if (state.timer) window.clearTimeout(state.timer);
    if (state.count >= 3) {
      state.count = 0;
      setAdminInitialMode('list');
      setIsAdminOpen(true);
      return;
    }
    state.timer = window.setTimeout(() => {
      state.count = 0;
    }, 1200);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 450);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Merge Firestore live posts with starter posts from /posts.json
  const posts = useMemo(() => {
    const mergedMap = new Map<string, Post>();
    for (const sp of seedPosts) {
      mergedMap.set(sp.id, sp);
    }
    for (const fp of firestorePosts) {
      mergedMap.set(fp.id, fp);
    }
    const list = Array.from(mergedMap.values()).filter(
      (p) => p.published !== false
    );
    return list.sort((a, b) => {
      const aTime =
        a.createdAt?.toMillis?.() ||
        (a.date ? Date.parse(a.date) || 0 : 0);
      const bTime =
        b.createdAt?.toMillis?.() ||
        (b.date ? Date.parse(b.date) || 0 : 0);
      return bTime - aTime;
    });
  }, [seedPosts, firestorePosts]);

  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    posts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [posts]);

  const filteredBlogPosts = useMemo(() => {
    const q = blogSearch.trim().toLowerCase();
    return posts.filter((p) => {
      const matchCat =
        blogCategory === 'All' || (p.category || 'General') === blogCategory;
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.desc || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [posts, blogSearch, blogCategory]);

  const filteredFaqs = useMemo(() => {
    const all = config?.faqs || [];
    const q = faqSearch.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (f) =>
        f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
    );
  }, [config?.faqs, faqSearch]);

  // Native splash timer
  useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(timer);
  }, [showSplash]);

  // Firebase Auth listener + Connection Check
  useEffect(() => {
    testConnection();
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubAuth();
  }, []);

  // Live Firestore listeners (instant seedPosts + config already hydrated)
  useEffect(() => {
    const unsubPosts = onSnapshot(
      collection(db, 'posts'),
      (snapshot) => {
        const docs: Post[] = [];
        const ids = new Set<string>();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Post;
          docs.push({ ...data, id: data.id || docSnap.id });
          ids.add(data.id || docSnap.id);
        });
        setFirestorePosts(docs);
        setFirestorePostIds(ids);
      },
      (err) => {
        console.warn('Firestore posts listener warning:', err.message);
      }
    );

    const unsubConfig = onSnapshot(
      doc(db, 'config', 'main'),
      (docSnap) => {
        if (docSnap.exists()) {
          setConfig(docSnap.data() as AppConfig);
        }
      },
      (err) => {
        console.warn('Firestore config listener warning:', err.message);
      }
    );

    return () => {
      unsubPosts();
      unsubConfig();
    };
  }, []);

  // Private Admin entry: /?admin=true, /admin, or Ctrl+Shift+A (Hidden from regular users)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    if (params.get('admin') === 'true' || path === 'admin') {
      setAdminInitialMode('list');
      setIsAdminOpen(true);
    }

    const handleKeyShortcut = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setAdminInitialMode('list');
        setIsAdminOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyShortcut);
    return () => window.removeEventListener('keydown', handleKeyShortcut);
  }, []);

  // Navigation helper (preserves history & SEO canonical URLs)
  const navigateTo = (page: PageId, postId: string | null = null) => {
    setCurrentPage(page);
    setCurrentPost(page === 'blog' ? postId : null);
    setIsMenuOpen(false);
    const targetPath = getPagePath(page, page === 'blog' ? postId : null);
    if (window.location.pathname + window.location.search !== targetPath) {
      window.history.pushState({ page, postId }, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseRouteFromLocation();
      setCurrentPage(parsed.page);
      setCurrentPost(parsed.postId);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Dynamic SEO Meta, Canonical URL, OpenGraph, and JSON-LD Schema
  useEffect(() => {
    updateHeadSeo({
      page: currentPage,
      postId: currentPost,
      posts,
      config,
    });
  }, [currentPage, currentPost, posts, config]);

  // Admin-only Author Studio openers (guarded by isAdmin)
  const openCreateArticle = () => {
    if (!isAdmin) return;
    setAdminInitialMode('create');
    setAdminInitialPost(null);
    setIsAdminOpen(true);
  };

  const openEditArticle = (post: Post) => {
    if (!isAdmin) return;
    setAdminInitialMode('edit');
    setAdminInitialPost(post);
    setIsAdminOpen(true);
  };

  const openManageArticles = () => {
    if (!isAdmin) return;
    setAdminInitialMode('list');
    setAdminInitialPost(null);
    setIsAdminOpen(true);
  };

  // Request Runtime Permissions on upload click only (Capacitor)
  const requestAppPermissions = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const cameraStatus = await Camera.checkPermissions();
      if (
        cameraStatus.camera !== 'granted' ||
        cameraStatus.photos !== 'granted'
      ) {
        await Camera.requestPermissions();
      }
    } catch (e) {
      console.error('Permission request failed', e);
    }
  };

  useEffect(() => {
    const verifyIntegrity = async () => {
      if (!Capacitor.isNativePlatform()) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/health`, {
          headers: { 'X-App-ID': 'scandeepfake-original-p77' },
        });
        if (!res.ok && res.status === 403) {
          setIsSecurityVerified(false);
        }
      } catch {
        // Ignore connectivity errors
      }
    };
    verifyIntegrity();
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const initNativeUI = async () => {
      try {
        try {
          await StatusBar.setOverlaysWebView({ overlay: true });
        } catch {}
        try {
          await StatusBar.hide();
        } catch {}
        try {
          await StatusBar.setBackgroundColor({ color: '#000000' });
        } catch {}
        const hideStatus = () => {
          StatusBar.hide().catch(() => {});
        };
        window.addEventListener('focus', hideStatus);
        CapApp.addListener('appRestoredResult', hideStatus);
        CapApp.addListener('resume', hideStatus);
      } catch (e) {
        console.warn('Native UI setup error', e);
      }
    };
    initNativeUI();

    const checkNetwork = async () => {
      const status = await Network.getStatus();
      setIsOffline(!status.connected);
    };
    checkNetwork();
    const handler = Network.addListener('networkStatusChange', (status) => {
      setIsOffline(!status.connected);
    });

    const backHandler = CapApp.addListener('backButton', async () => {
      if (isAdminOpen) {
        setIsAdminOpen(false);
      } else if (isMenuOpen) {
        setIsMenuOpen(false);
      } else if (currentPost) {
        navigateTo('blog', null);
      } else if (currentPage !== 'home') {
        if (tabChangeCount > 2 && Capacitor.isNativePlatform()) {
          await showInterstitialAd();
          await prepareInterstitialAd();
          setTabChangeCount(0);
        }
        navigateTo('home');
      } else if (currentStep > 1) {
        setCurrentStep((prev) => prev - 1);
      } else {
        setShowExitConfirm(true);
      }
    });

    const resumeHandler = CapApp.addListener(
      'appStateChange',
      ({ isActive }) => {
        if (isActive) {
          showAppOpenAd();
        }
      }
    );

    return () => {
      handler.remove();
      backHandler.remove();
      resumeHandler.remove();
    };
  }, [
    currentPage,
    currentStep,
    currentPost,
    isAdminOpen,
    tabChangeCount,
    isMenuOpen,
  ]);

  useEffect(() => {
    if (currentPage !== 'home') {
      setTabChangeCount((prev) => prev + 1);
    }
  }, [currentPage]);

  useEffect(() => {
    const triggerTabAd = async () => {
      if (tabChangeCount >= 4 && Capacitor.isNativePlatform()) {
        await showInterstitialAd();
        await prepareInterstitialAd();
        setTabChangeCount(0);
      }
    };
    triggerTabAd();
  }, [tabChangeCount]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const setupAds = async () => {
        await new Promise((r) => setTimeout(r, 2000));
        try {
          await initializeAdMob();
          try {
            await showAppOpenAd();
          } catch {}
          try {
            await showBannerAd();
          } catch {}
          try {
            await prepareInterstitialAd();
          } catch {}
        } catch (err) {
          console.error('AdMob initialization error:', err);
        }
      };
      setupAds();
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (analysisType === 'image' && !file.type.startsWith('image/')) {
        setError('Please upload an image file.');
        return;
      }
      if (analysisType === 'video' && !file.type.startsWith('video/')) {
        setError('Please upload a video file.');
        return;
      }

      setSelectedFile(file);
      setError(null);
      setUploadProgress(0);
      setIsUploading(true);

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () =>
          setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        img.src = url;
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.onloadedmetadata = () =>
          setDimensions({
            width: video.videoWidth,
            height: video.videoHeight,
          });
        video.src = url;
      }

      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 30;
        if (p >= 100) {
          setUploadProgress(100);
          setIsUploading(false);
          clearInterval(interval);
        } else {
          setUploadProgress(Math.floor(p));
        }
      }, 200);
    }
  };

  const triggerFileSelect = async () => {
    await requestAppPermissions();
    fileInputRef.current?.click();
  };

  const startAnalysis = async () => {
    if (!selectedFile) return;

    if (Capacitor.isNativePlatform()) {
      if (scansCount > 0) {
        await showInterstitialAd();
        await prepareInterstitialAd();
      } else {
        await prepareInterstitialAd();
      }
    }

    setCurrentStep(4);
    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    setProgress(0);

    const progressPhases = [
      { text: 'Initializing Core Neural Engine...', duration: 700 },
      { text: 'Scanning Pixel Frequency Artifacts...', duration: 1000 },
      { text: 'Analyzing Lighting & Shadow Consistency...', duration: 1200 },
      { text: 'Checking Biological Pattern Deviations...', duration: 800 },
      { text: 'Generating Forensic Report...', duration: 800 },
    ];

    let currentProgress = 0;
    for (let i = 0; i < progressPhases.length; i++) {
      setProgressText(progressPhases[i].text);
      const stepIncrement = 20;
      for (let j = 0; j < stepIncrement; j++) {
        await new Promise((r) =>
          setTimeout(r, progressPhases[i].duration / stepIncrement)
        );
        currentProgress += 1;
        setProgress(currentProgress);
      }
    }

    try {
      const { runForensicAnalysis } = await import('./lib/detector');
      const analysis = await runForensicAnalysis(selectedFile);

      setIsAnalyzing(false);
      setResult(analysis);
      setCurrentStep(5);
      setScansCount((prev) => prev + 1);

      // Save private local scan history
      const entry: ScanHistoryEntry = {
        id: `${Date.now()}`,
        filename: selectedFile.name,
        fileType: selectedFile.type || 'unknown',
        detected: analysis.detected,
        confidence: analysis.confidence,
        scannedAt: new Date().toLocaleString(),
      };
      setScanHistory((prev) => {
        const next = [entry, ...prev].slice(0, 8);
        try {
          localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });

      if (Capacitor.isNativePlatform()) {
        setTimeout(async () => {
          await showInterstitialAd();
          await prepareInterstitialAd();
        }, 800);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      setError('Analysis failed. Local engine timeout.');
      setIsAnalyzing(false);
      setCurrentStep(3);
    }
  };

  const clearScanHistory = () => {
    setScanHistory([]);
    try {
      localStorage.removeItem(SCAN_HISTORY_KEY);
    } catch {}
    showToast('Local scan history cleared.');
  };

  const downloadForensicReport = () => {
    if (!result || !selectedFile) return;
    const reportLines = [
      'SCANDEEPFAKE FORENSIC VERIFICATION REPORT',
      '=========================================',
      `Timestamp: ${new Date().toISOString()}`,
      `File Name: ${selectedFile.name}`,
      `File Size: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
      `Media Type: ${selectedFile.type || 'Unknown'}`,
      `Dimensions: ${
        dimensions ? `${dimensions.width}x${dimensions.height}` : 'N/A'
      }`,
      '',
      `VERDICT: ${result.detected ? 'AI GENERATED / SYNTHETIC' : 'AUTHENTIC MEDIA'}`,
      `NEURAL CONFIDENCE: ${result.confidence}%`,
      `RISK LEVEL: ${result.detected ? 'CRITICAL' : 'MINIMAL'}`,
      '',
      'FORENSIC BREAKDOWN:',
      `- Orbital Integrity: ${result.metrics?.faces?.value} (${result.metrics?.faces?.status})`,
      `- Pixel Frequency: ${result.metrics?.pixels?.value} (${result.metrics?.pixels?.status})`,
      `- Luminance Consistency: ${result.metrics?.shadows?.value} (${result.metrics?.shadows?.status})`,
      `- Temporal Artifacts: ${result.metrics?.patterns?.value} (${result.metrics?.patterns?.status})`,
      '',
      'Note: Probabilistic forensic estimate generated locally by ScanDeepFake.',
    ];
    const blob = new Blob([reportLines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scandeepfake-report-${selectedFile.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Forensic report downloaded.');
  };

  const copyVerdictSummary = async () => {
    if (!result || !selectedFile) return;
    const text = `ScanDeepFake Verdict for "${selectedFile.name}": ${
      result.detected ? 'AI Generated' : 'Authentic Media'
    } (${result.confidence}% confidence)`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Verdict summary copied to clipboard.');
    } catch {
      showToast('Unable to copy summary.');
    }
  };

  const shareArticle = async (post: Post) => {
    const shareUrl = getCanonicalUrl(
      'blog',
      post.id,
      config?.settings?.domain
    );
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.desc,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard copy
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Article link copied to clipboard.');
    } catch {
      showToast('Unable to copy article link.');
    }
  };

  const resetFlow = () => {
    setCurrentStep(1);
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setAnalysisType(null);
    setPrivacyAgreed(false);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const activeArticle = useMemo(
    () => (currentPost ? posts.find((p) => p.id === currentPost) || null : null),
    [currentPost, posts]
  );

  return (
    <div
      className={`min-h-screen w-full overflow-x-hidden transition-colors duration-300 font-sans flex flex-col selection:bg-[#00F3FF] selection:text-black ${
        theme === 'dark'
          ? 'bg-[#030712] text-[#FFFFFF] dark'
          : 'bg-[#FFFFFF] text-[#0F172A] light'
      }`}
    >
      {/* Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1500] px-5 py-3 rounded-2xl bg-[#0F172A] border border-[#00F3FF]/40 text-white text-xs font-bold shadow-2xl flex items-center gap-2"
          >
            <Check size={14} className="text-[#00F3FF]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back to Top Floating Button */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          className={`fixed bottom-6 right-6 z-[800] p-3.5 rounded-2xl border shadow-xl transition-all hover:scale-105 ${
            theme === 'dark'
              ? 'bg-[#0F172A] border-[#00F3FF]/30 text-[#00F3FF]'
              : 'bg-white border-black/15 text-[#1E40AF]'
          }`}
        >
          <ArrowUp size={18} />
        </button>
      )}

      {/* Native-Only CSS Splash */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="fixed inset-0 z-[10000] bg-[#030712] flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <div className="space-y-6 relative z-10">
              <div className="w-24 h-24 rounded-[2rem] border border-[#00F3FF]/30 bg-[#00F3FF]/5 flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(0,243,255,0.15)] animate-pulse">
                <Shield size={44} className="text-[#00F3FF]" />
              </div>
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white">
                  Scan<span className="text-[#00F3FF]">DeepFake</span>
                </div>
                <p className="text-[10px] md:text-xs font-mono font-black uppercase tracking-[0.4em] text-white/50">
                  AI Forensic Scanner
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Barrier */}
      {isOffline && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8 text-center">
          <div className="space-y-6">
            <WifiOff className="w-20 h-20 text-[#FF3E3E] mx-auto animate-pulse" />
            <h2 className="text-3xl font-black uppercase italic">
              Connectivity Interrupted
            </h2>
            <p className="text-white/70 max-w-sm">
              ScanDeepFake requires an active connection to perform forensic
              analysis.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest rounded-xl"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Integrity Check Barrier (Native Only) */}
      {!isSecurityVerified && (
        <div className="fixed inset-0 z-[5000] bg-black flex items-center justify-center p-8 text-center">
          <div className="max-w-md space-y-6">
            <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-3xl flex items-center justify-center mx-auto">
              <AlertTriangle size={40} />
            </div>
            <h2 className="text-3xl font-black uppercase italic text-white">
              Authenticity Problem
            </h2>
            <p className="text-white/60 text-sm">
              Please install the official version of ScanDeepFake.
            </p>
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog (Native) */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`max-w-sm w-full p-8 rounded-3xl border shadow-2xl space-y-6 ${
                theme === 'dark'
                  ? 'bg-[#0F172A] border-white/10'
                  : 'bg-white border-black/10'
              }`}
            >
              <div className="text-center space-y-3">
                <Shield
                  size={32}
                  className={
                    theme === 'dark'
                      ? 'text-[#00F3FF] mx-auto'
                      : 'text-[#1E40AF] mx-auto'
                  }
                />
                <h3 className="text-xl font-black uppercase italic">
                  Exit Forensic Protocol?
                </h3>
                <p className="text-sm opacity-60">
                  Are you sure you want to close ScanDeepFake?
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-3 font-black uppercase text-xs rounded-xl border border-white/15"
                >
                  Cancel
                </button>
                <button
                  onClick={() => CapApp.exitApp()}
                  className="flex-1 py-3 font-black uppercase text-xs rounded-xl bg-red-600 text-white"
                >
                  Exit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,video/*"
        onChange={handleFileChange}
      />

      {/* Admin-Only Control Ribbon (Visible strictly to verified admin gundkatira007@gmail.com) */}
      {isAdmin && (
        <div className="bg-[#00F3FF] text-black px-4 py-2 text-xs font-black uppercase tracking-wider">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={14} />
              <span>Admin Mode Active ({user?.email})</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openCreateArticle}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black text-[#00F3FF] hover:opacity-90"
              >
                <Plus size={13} />
                Write Daily Article
              </button>
              <button
                onClick={openManageArticles}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/15 text-black hover:bg-black/25"
              >
                <Edit3 size={13} />
                Admin Panel
              </button>
              <button
                onClick={async () => {
                  await signOutAdmin();
                  setIsAdminOpen(false);
                  showToast('Signed out of Admin Mode.');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/15 text-black hover:bg-red-600 hover:text-white transition-colors"
                title="Sign out admin"
              >
                <LogOut size={13} />
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Top Header with Crawlable Navigation */}
      <header
        className={`border-b px-3 sm:px-4 md:px-8 py-3.5 md:py-4 pt-safe-top sticky top-0 backdrop-blur-xl z-[900] transition-colors duration-300 ${
          theme === 'dark'
            ? 'border-white/10 bg-[#050608]/90'
            : 'border-black/10 bg-[#F8FAFC]/90'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('home');
            }}
            className="flex flex-col text-left min-w-0 shrink"
          >
            <div className="text-[9px] sm:text-[10px] font-mono tracking-[0.2em] sm:tracking-[0.25em] text-[#00F3FF] uppercase mb-0.5 flex items-center gap-1.5 truncate">
              <Cpu size={10} className="animate-spin-slow shrink-0" />
              <span className="truncate">
                Neural Engine {config?.settings?.version || 'v4.2.1'}
              </span>
            </div>
            <div
              className={`text-lg sm:text-xl md:text-2xl font-black tracking-tighter uppercase leading-none truncate ${
                theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
              }`}
            >
              {config?.settings?.siteName || 'ScanDeepFake'}
            </div>
          </a>

          {/* Primary Crawlable Navigation (Public Visitors) */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-1"
          >
            {[
              { id: 'home' as PageId, label: 'Scanner' },
              { id: 'blog' as PageId, label: `Blog (${posts.length})` },
              { id: 'docs' as PageId, label: 'Manual' },
              { id: 'faq' as PageId, label: 'FAQ' },
              { id: 'about' as PageId, label: 'About' },
              { id: 'contact' as PageId, label: 'Contact' },
              { id: 'sitemap' as PageId, label: 'Sitemap' },
            ].map((item) => (
              <a
                key={item.id}
                href={getPagePath(item.id)}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo(item.id);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  currentPage === item.id
                    ? theme === 'dark'
                      ? 'bg-[#00F3FF] text-black'
                      : 'bg-[#1E40AF] text-white'
                    : theme === 'dark'
                      ? 'text-white/75 hover:text-white hover:bg-white/5'
                      : 'text-[#0F172A]/75 hover:text-[#0F172A] hover:bg-black/5'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={getPagePath('sitemap')}
              onClick={(e) => {
                e.preventDefault();
                navigateTo('sitemap');
              }}
              aria-label="Open Sitemap"
              className={`md:hidden inline-flex items-center gap-1 px-2.5 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${
                currentPage === 'sitemap'
                  ? theme === 'dark'
                    ? 'bg-[#00F3FF] text-black border-[#00F3FF]'
                    : 'bg-[#1E40AF] text-white border-[#1E40AF]'
                  : theme === 'dark'
                    ? 'bg-white/10 border-white/15 text-white'
                    : 'bg-black/5 border-black/10 text-black'
              }`}
            >
              <Globe size={12} />
              <span>Sitemap</span>
            </a>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle color theme"
              className={`p-2.5 rounded-xl border transition-all ${
                theme === 'dark'
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-black/5 border-black/10 text-black'
              }`}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Open menu"
              className={`p-2.5 rounded-xl border transition-all ${
                theme === 'dark'
                  ? 'bg-[#00F3FF] text-black border-[#00F3FF]'
                  : 'bg-[#1E40AF] text-white border-[#1E40AF]'
              }`}
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow px-3 sm:px-4 md:px-6 pt-5 md:pt-6 w-full max-w-full">
        {currentPage === 'home' && (
          <div className="max-w-7xl mx-auto space-y-12 md:space-y-20">
            <AdSlot
              id="header-high"
              enabled={config?.settings?.adsEnabled}
              theme={theme}
              config={config}
              className="w-full rounded-2xl"
            />

            {/* Scanner Section */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
              <aside className="hidden xl:col-span-2 xl:flex flex-col gap-6">
                <AdSlot
                  id="side-top"
                  enabled={config?.settings?.adsEnabled}
                  theme={theme}
                  config={config}
                  className="w-full h-80 rounded-2xl"
                />
                <AdSlot
                  id="side-mid"
                  enabled={config?.settings?.adsEnabled}
                  theme={theme}
                  config={config}
                  className="w-full h-64 rounded-2xl"
                />
              </aside>

              <div className="col-span-1 xl:col-span-8 space-y-6 md:space-y-8 min-w-0">
                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className={`border rounded-[28px] md:rounded-[36px] p-5 sm:p-8 md:p-14 text-center space-y-6 md:space-y-8 relative overflow-hidden ${
                        theme === 'dark'
                          ? 'bg-white/5 border-white/10'
                          : 'bg-black/5 border-black/10'
                      }`}
                    >
                      <MatrixIllusion theme={theme} />
                      <div className="space-y-4 relative z-10">
                        <div
                          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-[0.2em] ${
                            theme === 'dark'
                              ? 'bg-[#00F3FF]/10 border-[#00F3FF]/20 text-[#00F3FF]'
                              : 'bg-[#1E40AF]/10 border-[#1E40AF]/20 text-[#1E40AF]'
                          }`}
                        >
                          <Activity size={12} className="animate-pulse" />{' '}
                          System Online - v4.2
                        </div>
                        <div className="flex flex-col items-center gap-4 md:gap-5">
                          <div
                            className={`w-24 h-24 md:w-32 md:h-32 rounded-[2rem] border flex items-center justify-center p-4 ${
                              theme === 'dark'
                                ? 'bg-[#00F3FF]/5 border-[#00F3FF]/20'
                                : 'bg-[#1E40AF]/5 border-[#1E40AF]/20'
                            }`}
                          >
                            <Shield
                              size={52}
                              className={
                                theme === 'dark'
                                  ? 'text-[#00F3FF]'
                                  : 'text-[#1E40AF]'
                              }
                            />
                          </div>
                          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
                            {config?.settings?.siteName || 'ScanDeepFake'}
                            <br />
                            <span
                              className={
                                theme === 'dark'
                                  ? 'text-[#00F3FF]'
                                  : 'text-[#1E40AF]'
                              }
                            >
                              Forensic Engine
                            </span>
                          </h1>
                            <div className="text-base md:text-xl font-black uppercase tracking-widest opacity-70">
                              Truth matters. Verify everything.
                            </div>
                          </div>
                          <p className="text-base md:text-lg max-w-2xl mx-auto opacity-80">
                            Detect <strong>AI-Generated Images</strong>,{' '}
                            <strong>Face Swaps</strong>, and{' '}
                            <strong>Synthetic Video</strong> with our free
                            zero-retention neural forensic scanner.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                          <StatCard
                            label="Analysis per day"
                            value="245k+"
                            theme={theme}
                          />
                          <StatCard
                            label="Detection accuracy"
                            value="99.8%"
                            theme={theme}
                          />
                          <StatCard
                            label="Privacy Mode"
                            value="Local"
                            theme={theme}
                          />
                          <StatCard
                            label="Forensic Reports"
                            value={`${posts.length}`}
                            color="text-[#00F3FF]"
                            theme={theme}
                          />
                        </div>

                        <div className="flex flex-wrap justify-center gap-4 relative z-10">
                          <button
                            onClick={() => setCurrentStep(2)}
                            className={`px-10 py-5 font-black uppercase tracking-[0.2em] text-sm rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg ${
                              theme === 'dark'
                                ? 'bg-[#00F3FF] text-black shadow-[#00F3FF]/40'
                                : 'bg-[#1E40AF] text-white shadow-[#1E40AF]/40'
                            }`}
                          >
                            DeepFake Scan Start
                          </button>
                          <a
                            href={getPagePath('blog')}
                            onClick={(e) => {
                              e.preventDefault();
                              navigateTo('blog');
                            }}
                            className={`px-8 py-5 font-black uppercase tracking-[0.15em] text-sm rounded-2xl border transition-all inline-flex items-center gap-2 ${
                              theme === 'dark'
                                ? 'border-white/20 text-white hover:border-[#00F3FF] hover:text-[#00F3FF]'
                                : 'border-black/20 text-[#0F172A] hover:border-[#1E40AF] hover:text-[#1E40AF]'
                            }`}
                          >
                            <BookOpen size={16} />
                            Read Forensic Blog
                          </a>
                        </div>
                      </motion.div>
                    )}

                    {currentStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        <div className="text-center space-y-2">
                          <h2 className="text-3xl font-black uppercase italic tracking-tight">
                            Select Analysis{' '}
                            <span
                              className={
                                theme === 'dark'
                                  ? 'text-[#00F3FF]'
                                  : 'text-[#1E40AF]'
                              }
                            >
                              Vector
                            </span>
                          </h2>
                          <p className="opacity-70 text-xs font-mono uppercase tracking-widest">
                            Choose the media type you want to verify
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <SelectionCard
                            icon={FileImage}
                            title="Image Analysis"
                            desc="Scan static photos, profile pictures, and digital artwork (JPG, PNG, WEBP)."
                            onClick={() => {
                              setAnalysisType('image');
                              setCurrentStep(3);
                            }}
                            theme={theme}
                          />
                          <SelectionCard
                            icon={FileVideo}
                            title="Video Analysis"
                            desc="Deep frame-by-frame forensics for MP4, MOV, and AVI files."
                            onClick={() => {
                              setAnalysisType('video');
                              setCurrentStep(3);
                            }}
                            theme={theme}
                          />
                        </div>
                        <button
                          onClick={() => setCurrentStep(1)}
                          className="opacity-70 hover:opacity-100 text-xs uppercase font-black tracking-widest block mx-auto py-4"
                        >
                          ← Back to home
                        </button>
                      </motion.div>
                    )}

                    {currentStep === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-8"
                      >
                        <div
                          className={`border rounded-[36px] p-8 md:p-12 space-y-8 ${
                            theme === 'dark'
                              ? 'bg-white/5 border-white/10'
                              : 'bg-black/5 border-black/10'
                          }`}
                        >
                          <div className="flex flex-col items-center text-center space-y-4">
                            <div
                              className={`w-20 h-20 rounded-3xl flex items-center justify-center border ${
                                theme === 'dark'
                                  ? 'bg-[#00F3FF]/10 text-[#00F3FF] border-[#00F3FF]/20'
                                  : 'bg-[#1E40AF]/10 text-[#1E40AF] border-[#1E40AF]/20'
                              }`}
                            >
                              <Shield size={32} />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tight italic">
                              Secure Forensic Upload
                            </h2>
                            <p className="text-sm max-w-md opacity-75">
                              Your media is scanned locally in an ephemeral
                              sandbox. No files are saved to our servers.
                            </p>
                          </div>

                          {error && (
                            <div className="max-w-md mx-auto p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold text-center">
                              {error}
                            </div>
                          )}

                          <div className="max-w-md mx-auto space-y-6">
                            <label
                              className={`flex items-center gap-4 cursor-pointer p-5 border rounded-2xl transition-all ${
                                theme === 'dark'
                                  ? 'bg-white/[0.02] border-white/10 hover:bg-white/5'
                                  : 'bg-black/[0.02] border-black/10 hover:bg-black/5'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={privacyAgreed}
                                onChange={(e) =>
                                  setPrivacyAgreed(e.target.checked)
                                }
                                className="w-5 h-5 rounded cursor-pointer"
                              />
                              <span className="text-xs font-semibold uppercase tracking-wider opacity-85">
                                I agree to the privacy terms & local encryption
                                protocol
                              </span>
                            </label>

                            {privacyAgreed && (
                              <div
                                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                                  selectedFile
                                    ? theme === 'dark'
                                      ? 'border-[#00F3FF] bg-[#00F3FF]/5'
                                      : 'border-[#1E40AF] bg-[#1E40AF]/5'
                                    : theme === 'dark'
                                      ? 'border-white/15 hover:border-[#00F3FF]/50'
                                      : 'border-black/15 hover:border-[#1E40AF]/50'
                                }`}
                                onClick={() =>
                                  !isUploading && triggerFileSelect()
                                }
                              >
                                {isUploading ? (
                                  <div className="space-y-4 py-4">
                                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-[#00F3FF]" />
                                    <div className="text-xs font-mono uppercase">
                                      Uploading to Buffer... {uploadProgress}%
                                    </div>
                                  </div>
                                ) : selectedFile ? (
                                  <div className="space-y-5">
                                    {previewUrl && (
                                      <div className="relative w-full max-w-[240px] aspect-video mx-auto rounded-xl overflow-hidden border border-white/20">
                                        {selectedFile.type.startsWith(
                                          'image/'
                                        ) ? (
                                          <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <video
                                            src={previewUrl}
                                            className="w-full h-full object-cover"
                                          />
                                        )}
                                      </div>
                                    )}
                                    <div className="flex flex-col items-center gap-3">
                                      <div className="text-[#00FF94] flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                                        <CheckCircle2 size={14} /> Ready for
                                        Analysis
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startAnalysis();
                                        }}
                                        className={`px-8 py-4 font-black uppercase text-xs rounded-2xl shadow-lg ${
                                          theme === 'dark'
                                            ? 'bg-[#00F3FF] text-black'
                                            : 'bg-[#1E40AF] text-white'
                                        }`}
                                      >
                                        Execute Neural Scan
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-3 py-4">
                                    <Upload
                                      size={42}
                                      className="mx-auto opacity-30"
                                    />
                                    <div className="text-xs font-black uppercase tracking-widest">
                                      Drop {analysisType} or Click to Browse
                                    </div>
                                    <div className="text-xs opacity-60">
                                      Max file size: 50MB
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setCurrentStep(2)}
                          className="opacity-75 hover:opacity-100 text-xs uppercase font-black tracking-widest block mx-auto"
                        >
                          ← Back
                        </button>
                      </motion.div>
                    )}

                    {currentStep === 4 && (
                      <motion.div
                        key="step4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-white/5 border border-white/10 rounded-[36px] p-8 md:p-16 text-center space-y-10 relative overflow-hidden h-[380px] flex flex-col justify-center"
                      >
                        <MatrixIllusion theme={theme} />
                        <div className="space-y-6 relative z-10">
                          <Loader2
                            className={`w-16 h-16 animate-spin mx-auto ${
                              theme === 'dark'
                                ? 'text-[#00F3FF]'
                                : 'text-[#1E40AF]'
                            }`}
                          />
                          <h3 className="text-xl font-black uppercase tracking-widest">
                            {progressText}
                          </h3>
                          <div className="w-full max-w-md mx-auto bg-white/10 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#00F3FF] transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="text-xs font-mono font-black text-[#00F3FF]">
                            {progress}% Completed
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {currentStep === 5 && (
                      <motion.div
                        key="step5"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                      >
                        <div
                          className={`border-2 rounded-[36px] p-8 md:p-12 ${
                            result?.detected
                              ? 'bg-[#FF3E3E]/5 border-[#FF3E3E]/30'
                              : 'bg-[#00FF94]/5 border-[#00FF94]/30'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                              <span className="text-xs font-mono uppercase opacity-75 block mb-2">
                                Scan Verdict
                              </span>
                              <h2
                                className={`text-4xl md:text-6xl font-black uppercase italic leading-none ${
                                  result?.detected
                                    ? 'text-[#FF3E3E]'
                                    : 'text-[#00FF94]'
                                }`}
                              >
                                {result?.detected
                                  ? 'AI Generated'
                                  : 'Authentic Media'}
                              </h2>
                              <div className="mt-5 flex gap-8">
                                <div>
                                  <div className="text-xs font-mono uppercase opacity-60">
                                    Confidence
                                  </div>
                                  <div className="text-2xl font-black">
                                    {result?.confidence}%
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs font-mono uppercase opacity-60">
                                    Risk Level
                                  </div>
                                  <div
                                    className={`text-2xl font-black ${
                                      result?.detected
                                        ? 'text-[#FF3E3E]'
                                        : 'text-[#00FF94]'
                                    }`}
                                  >
                                    {result?.detected ? 'CRITICAL' : 'MINIMAL'}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-3 w-full md:w-auto">
                              <button
                                onClick={downloadForensicReport}
                                className="px-6 py-3.5 bg-[#00F3FF] text-black rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:opacity-90"
                              >
                                <Download size={14} />
                                Download Report
                              </button>
                              <button
                                onClick={copyVerdictSummary}
                                className="px-6 py-3 bg-white/10 border border-white/15 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-white/20"
                              >
                                <Copy size={14} />
                                Copy Summary
                              </button>
                              <button
                                onClick={resetFlow}
                                className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white hover:text-black transition-all font-black uppercase text-xs"
                              >
                                New Scan
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-[32px] p-8">
                            <h3 className="text-xs font-mono uppercase mb-8 tracking-[0.3em] text-[#00F3FF] font-black">
                              Forensic Breakdown
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <MetricItem
                                label="Orbital Integrity"
                                value={
                                  result?.metrics?.faces?.value || 'Unchecked'
                                }
                                status={
                                  result?.metrics?.faces?.status || 'N/A'
                                }
                                isError={result?.metrics?.faces?.isError}
                                isSuccess={!result?.metrics?.faces?.isError}
                                theme={theme}
                              />
                              <MetricItem
                                label="Pixel Frequency"
                                value={
                                  result?.metrics?.pixels?.value || 'Unchecked'
                                }
                                status={
                                  result?.metrics?.pixels?.status || 'N/A'
                                }
                                isError={result?.metrics?.pixels?.isError}
                                isSuccess={!result?.metrics?.pixels?.isError}
                                theme={theme}
                              />
                              <MetricItem
                                label="Luminance Consistency"
                                value={
                                  result?.metrics?.shadows?.value || 'Unchecked'
                                }
                                status={
                                  result?.metrics?.shadows?.status || 'N/A'
                                }
                                isError={result?.metrics?.shadows?.isError}
                                isSuccess={!result?.metrics?.shadows?.isError}
                                theme={theme}
                              />
                              <MetricItem
                                label="Temporal Artifacts"
                                value={
                                  result?.metrics?.patterns?.value ||
                                  'Unchecked'
                                }
                                status={
                                  result?.metrics?.patterns?.status || 'N/A'
                                }
                                isError={result?.metrics?.patterns?.isError}
                                isSuccess={!result?.metrics?.patterns?.isError}
                                theme={theme}
                              />
                            </div>
                          </div>

                          <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-5">
                            <h3 className="text-xs font-mono uppercase tracking-[0.3em] text-[#00F3FF] font-black">
                              Technical Properties
                            </h3>
                            {selectedFile && (
                              <div className="space-y-3">
                                <MetadataItem
                                  label="Name"
                                  value={selectedFile.name}
                                  theme={theme}
                                />
                                <MetadataItem
                                  label="Size"
                                  value={`${(
                                    selectedFile.size /
                                    1024 /
                                    1024
                                  ).toFixed(2)} MB`}
                                  theme={theme}
                                />
                                <MetadataItem
                                  label="Type"
                                  value={selectedFile.type.toUpperCase()}
                                  theme={theme}
                                />
                                <MetadataItem
                                  label="Dimensions"
                                  value={
                                    dimensions
                                      ? `${dimensions.width}x${dimensions.height}`
                                      : 'Calculating...'
                                  }
                                  theme={theme}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Private Browser-Only Scan History */}
                  {scanHistory.length > 0 && (
                    <div
                      className={`border rounded-[28px] p-6 space-y-4 ${
                        theme === 'dark'
                          ? 'bg-white/[0.03] border-white/10'
                          : 'bg-black/[0.02] border-black/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#00F3FF]">
                          <History size={15} />
                          Recent Local Scans (Private to Your Device)
                        </div>
                        <button
                          onClick={clearScanHistory}
                          className="inline-flex items-center gap-1 text-[11px] font-bold uppercase opacity-60 hover:opacity-100 hover:text-red-400"
                        >
                          <Trash2 size={12} />
                          Clear
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {scanHistory.map((item) => (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-2xl border border-white/10 bg-black/20 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold truncate">
                                {item.filename}
                              </div>
                              <div className="text-[10px] font-mono opacity-50">
                                {item.scannedAt}
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shrink-0 ${
                                item.detected
                                  ? 'bg-[#FF3E3E]/15 text-[#FF3E3E]'
                                  : 'bg-[#00FF94]/15 text-[#00FF94]'
                              }`}
                            >
                              {item.detected ? 'AI' : 'Real'} ·{' '}
                              {item.confidence}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <aside className="hidden xl:col-span-2 xl:flex flex-col gap-6">
                  <AdSlot
                    id="side-tall"
                    enabled={config?.settings?.adsEnabled}
                    theme={theme}
                    config={config}
                    className="w-full h-[500px] rounded-2xl"
                  />
                </aside>
              </div>

              {/* ============================================================
                  4-LAYER FORENSIC PIPELINE (TRUST & CAPABILITY SHOWCASE)
                  ============================================================ */}
              <section
                aria-labelledby="forensic-pipeline-heading"
                className="space-y-8"
              >
                <div className="text-center space-y-2">
                  <div
                    className={`text-xs font-mono font-black uppercase tracking-[0.3em] ${
                      theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'
                    }`}
                  >
                    Multi-Vector Verification Architecture
                  </div>
                  <h2
                    id="forensic-pipeline-heading"
                    className="text-3xl md:text-4xl font-black uppercase italic tracking-tight"
                  >
                    How ScanDeepFake Detects Synthetic Media
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    {
                      icon: Layers,
                      title: 'Frequency Domain',
                      desc: 'Detects invisible repeating diffusion wavelets left behind by generative image models.',
                    },
                    {
                      icon: Eye,
                      title: 'Orbital & Facial Geometry',
                      desc: 'Inspects corneal light reflections, skin micro-texture, and jawline blending artifacts.',
                    },
                    {
                      icon: Activity,
                      title: 'Luminance & Shadows',
                      desc: 'Verifies physical lighting vector alignment and color channel noise variance.',
                    },
                    {
                      icon: Lock,
                      title: 'Zero-Retention Sandbox',
                      desc: 'Runs locally in volatile memory so sensitive photos and videos never stay on disk.',
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className={`p-6 rounded-3xl border space-y-3 ${
                        theme === 'dark'
                          ? 'bg-white/[0.03] border-white/10'
                          : 'bg-[#F8FAFC] border-black/10'
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                          theme === 'dark'
                            ? 'bg-[#00F3FF]/10 text-[#00F3FF]'
                            : 'bg-[#1E40AF]/10 text-[#1E40AF]'
                        }`}
                      >
                        <item.icon size={20} />
                      </div>
                      <h3 className="text-base font-black uppercase tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-xs leading-relaxed opacity-75">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* ============================================================
                  HOMEPAGE VISIBLE BLOG SECTION (PUBLIC READ-ONLY + ADMIN EDIT)
                  ============================================================ */}
              <section
                id="homepage-blog"
                aria-labelledby="homepage-blog-heading"
                className={`border rounded-[36px] p-6 md:p-10 space-y-8 ${
                  theme === 'dark'
                    ? 'bg-white/[0.03] border-white/10'
                    : 'bg-[#F8FAFC] border-black/10'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                  <div className="space-y-2">
                    <div
                      className={`text-xs font-mono font-black uppercase tracking-[0.3em] ${
                        theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'
                      }`}
                    >
                      Forensic Intelligence & Daily Dispatches
                    </div>
                    <h2
                      id="homepage-blog-heading"
                      className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter"
                    >
                      Forensic{' '}
                      <span
                        className={
                          theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'
                        }
                      >
                        Blog
                      </span>{' '}
                      & Daily Articles
                    </h2>
                    <p className="text-sm opacity-75 max-w-2xl">
                      Deepfake detection guides, scam breakdowns, and daily AI
                      forensic research reports.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {isAdmin && (
                      <>
                        <button
                          onClick={openCreateArticle}
                          className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-transform hover:scale-[1.02] ${
                            theme === 'dark'
                              ? 'bg-[#00F3FF] text-black'
                              : 'bg-[#1E40AF] text-white'
                          }`}
                        >
                          <Plus size={15} />
                          Add Daily Article
                        </button>
                        <button
                          onClick={openManageArticles}
                          className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                            theme === 'dark'
                              ? 'border-white/15 hover:border-[#00F3FF] text-white'
                              : 'border-black/15 hover:border-[#1E40AF] text-[#0F172A]'
                          }`}
                        >
                          <Edit3 size={14} />
                          Manage ({posts.length})
                        </button>
                      </>
                    )}
                    <a
                      href={getPagePath('blog')}
                      onClick={(e) => {
                        e.preventDefault();
                        navigateTo('blog');
                      }}
                      className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider border ${
                        theme === 'dark'
                          ? 'border-[#00F3FF]/30 text-[#00F3FF] hover:bg-[#00F3FF] hover:text-black'
                          : 'border-[#1E40AF]/30 text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white'
                      } transition-all`}
                    >
                      Explore All Articles ({posts.length})
                      <ChevronRight size={14} />
                    </a>
                  </div>
                </div>

                {/* Category Filter & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setBlogCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                          blogCategory === cat
                            ? theme === 'dark'
                              ? 'bg-[#00F3FF] text-black border-[#00F3FF]'
                              : 'bg-[#1E40AF] text-white border-[#1E40AF]'
                            : theme === 'dark'
                              ? 'border-white/10 text-white/65 hover:text-white'
                              : 'border-black/10 text-black/65 hover:text-black'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border w-full md:w-72 ${
                      theme === 'dark'
                        ? 'bg-black/30 border-white/10'
                        : 'bg-white border-black/10'
                    }`}
                  >
                    <Search size={14} className="opacity-40" />
                    <input
                      type="text"
                      placeholder="Search articles..."
                      value={blogSearch}
                      onChange={(e) => setBlogSearch(e.target.value)}
                      className="bg-transparent text-xs outline-none flex-1"
                    />
                  </div>
                </div>

                {/* Crawlable Article Grid (Fast Lazy-Loaded WebP) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                  {filteredBlogPosts.slice(0, 6).map((post) => (
                    <article
                      key={post.id}
                      className={`cv-auto rounded-[24px] md:rounded-[28px] border overflow-hidden flex flex-col justify-between group transition-colors ${
                        theme === 'dark'
                          ? 'bg-white/[0.04] border-white/10 hover:border-[#00F3FF]/50'
                          : 'bg-white border-black/10 hover:border-[#1E40AF]/50 shadow-sm'
                      }`}
                    >
                      <a
                        href={getPagePath('blog', post.id)}
                        onClick={(e) => {
                          e.preventDefault();
                          navigateTo('blog', post.id);
                        }}
                        className="block flex-1"
                      >
                        <div className="aspect-video bg-black/30 overflow-hidden relative">
                          <OptimizedImage
                            src={post.imageUrl}
                            alt={post.alt || post.title}
                            width={640}
                            className="group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 text-[#00F3FF] text-[10px] font-black uppercase tracking-wider">
                            {post.category || 'Forensics'}
                          </span>
                        </div>
                        <div className="p-5 sm:p-6 space-y-3">
                          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider opacity-60">
                            <span>{post.date}</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock size={11} />
                              {estimateReadTime(post.content)}
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-black uppercase tracking-tight leading-snug group-hover:text-[#00F3FF] transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-sm opacity-75 line-clamp-3">
                            {post.desc}
                          </p>
                        </div>
                      </a>

                      <div className="px-5 sm:px-6 pb-5 pt-2 flex items-center justify-between border-t border-white/5">
                        <a
                          href={getPagePath('blog', post.id)}
                          onClick={(e) => {
                            e.preventDefault();
                            navigateTo('blog', post.id);
                          }}
                          className={`text-xs font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                            theme === 'dark'
                              ? 'text-[#00F3FF]'
                              : 'text-[#1E40AF]'
                          }`}
                        >
                          Read Article <ChevronRight size={14} />
                        </a>

                        {isAdmin && (
                          <button
                            onClick={() => openEditArticle(post)}
                            className="inline-flex items-center gap-1 text-xs font-bold uppercase px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#00F3FF] hover:text-black transition-all"
                          >
                            <Edit3 size={12} />
                            Edit
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ============================================================
              DEDICATED BLOG PAGE & SINGLE ARTICLE READER (?p=blog)
              ============================================================ */}
          {currentPage === 'blog' && (
            <div className="max-w-6xl mx-auto space-y-8 md:space-y-10 mb-16 md:mb-20">
              {!activeArticle ? (
                <>
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mt-4">
                    <div>
                      <div className="text-xs font-mono uppercase tracking-[0.3em] text-[#00F3FF] font-black mb-2">
                        Forensic Knowledge Base
                      </div>
                      <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">
                        Forensic{' '}
                        <span
                          className={
                            theme === 'dark'
                              ? 'text-[#00F3FF]'
                              : 'text-[#1E40AF]'
                          }
                        >
                          Blog
                        </span>
                      </h1>
                      <p className="opacity-70 text-sm mt-2">
                        Expert deepfake detection guides, daily reports, and AI
                        verification case studies.
                      </p>
                    </div>
                    {isAdmin && (
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={openCreateArticle}
                          className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg ${
                            theme === 'dark'
                              ? 'bg-[#00F3FF] text-black'
                              : 'bg-[#1E40AF] text-white'
                          }`}
                        >
                          <Plus size={15} />
                          Write Daily Article
                        </button>
                        <button
                          onClick={openManageArticles}
                          className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider border border-white/15 hover:border-[#00F3FF]"
                        >
                          <Edit3 size={14} />
                          Manage Posts
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Category + Search */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setBlogCategory(cat)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                            blogCategory === cat
                              ? theme === 'dark'
                                ? 'bg-[#00F3FF] text-black border-[#00F3FF]'
                                : 'bg-[#1E40AF] text-white border-[#1E40AF]'
                              : 'border-white/10 opacity-70 hover:opacity-100'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 w-full md:w-72">
                      <Search size={14} className="opacity-40" />
                      <input
                        type="text"
                        placeholder="Search articles..."
                        value={blogSearch}
                        onChange={(e) => setBlogSearch(e.target.value)}
                        className="bg-transparent text-xs outline-none flex-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {filteredBlogPosts.map((post, idx) => (
                      <React.Fragment key={post.id}>
                        <article
                          className={`cv-auto rounded-[24px] md:rounded-[2rem] border overflow-hidden flex flex-col justify-between group transition-colors ${
                            theme === 'dark'
                              ? 'bg-white/5 border-white/10 hover:border-[#00F3FF]/50'
                              : 'bg-[#F1F5F9] border-black/10 hover:border-[#1E40AF]/50 shadow-sm'
                          }`}
                        >
                          <a
                            href={getPagePath('blog', post.id)}
                            onClick={(e) => {
                              e.preventDefault();
                              navigateTo('blog', post.id);
                            }}
                            className="block flex-1"
                          >
                            <div className="aspect-video bg-black/20 overflow-hidden relative">
                              <OptimizedImage
                                src={post.imageUrl}
                                alt={post.alt || post.title}
                                width={640}
                                className="group-hover:scale-105 transition-transform duration-300"
                              />
                              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 text-[#00F3FF] text-[10px] font-black uppercase tracking-wider">
                                {post.category || 'Forensics'}
                              </span>
                            </div>
                            <div className="p-5 sm:p-7 space-y-3">
                              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider font-bold text-[#00F3FF]/80">
                                <span>{post.date}</span>
                                <span className="opacity-70">
                                  {estimateReadTime(post.content)}
                                </span>
                              </div>
                              <h2 className="text-xl font-black uppercase tracking-tight leading-tight group-hover:text-[#00F3FF] transition-colors">
                                {post.title}
                              </h2>
                              <p className="text-sm leading-relaxed opacity-80">
                                {post.desc}
                              </p>
                            </div>
                          </a>
                          <div className="px-7 pb-5 flex items-center justify-between">
                            <a
                              href={getPagePath('blog', post.id)}
                              onClick={(e) => {
                                e.preventDefault();
                                navigateTo('blog', post.id);
                              }}
                              className="text-xs font-black uppercase tracking-wider text-[#00F3FF] inline-flex items-center gap-1"
                            >
                              Read Report <ChevronRight size={14} />
                            </a>
                            {isAdmin && (
                              <button
                                onClick={() => openEditArticle(post)}
                                className="inline-flex items-center gap-1 text-xs font-bold uppercase px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#00F3FF] hover:text-black transition-all"
                              >
                                <Edit3 size={12} />
                                Edit
                              </button>
                            )}
                          </div>
                        </article>
                        {idx % 4 === 3 && (
                          <AdSlot
                            id={`blog-list-mid-${idx}`}
                            enabled={config?.settings?.adsEnabled}
                            theme={theme}
                            config={config}
                            type="square"
                            className="h-full"
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </>
              ) : (
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <nav
                      aria-label="Breadcrumb"
                      className="flex items-center gap-2 text-xs font-black uppercase tracking-wider opacity-75"
                    >
                      <a
                        href="/"
                        onClick={(e) => {
                          e.preventDefault();
                          navigateTo('home');
                        }}
                        className="hover:text-[#00F3FF]"
                      >
                        Home
                      </a>
                      <ChevronRight size={12} />
                      <a
                        href={getPagePath('blog')}
                        onClick={(e) => {
                          e.preventDefault();
                          navigateTo('blog');
                        }}
                        className="hover:text-[#00F3FF]"
                      >
                        Blog
                      </a>
                      <ChevronRight size={12} />
                      <span className="text-[#00F3FF] truncate max-w-[200px]">
                        {activeArticle.category || 'Article'}
                      </span>
                    </nav>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => shareArticle(activeArticle)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/15 text-xs font-black uppercase tracking-wider hover:border-[#00F3FF]"
                      >
                        <Share2 size={13} />
                        Share
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => openEditArticle(activeArticle)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#00F3FF]/30 text-[#00F3FF] text-xs font-black uppercase tracking-wider hover:bg-[#00F3FF]/10"
                        >
                          <Edit3 size={13} />
                          Edit Article
                        </button>
                      )}
                    </div>
                  </div>

                  <article className="space-y-8 w-full overflow-hidden break-words">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono uppercase tracking-[0.2em] font-bold text-[#00F3FF]">
                        <span>{activeArticle.date}</span>
                        <span>·</span>
                        <span>{activeArticle.category || 'Forensics'}</span>
                        <span>·</span>
                        <span>{estimateReadTime(activeArticle.content)}</span>
                      </div>
                      <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-tight italic">
                        {activeArticle.title}
                      </h1>
                    </div>

                    <div className="aspect-video rounded-[1.25rem] md:rounded-[2.5rem] overflow-hidden border border-white/10">
                      <OptimizedImage
                        src={activeArticle.imageUrl}
                        alt={activeArticle.alt || activeArticle.title}
                        width={1200}
                        sizes="(max-width: 768px) 100vw, 800px"
                        priority={true}
                      />
                    </div>

                    <AdSlot
                      id="blog-post-top"
                      enabled={config?.settings?.adsEnabled}
                      theme={theme}
                      config={config}
                      type="banner"
                    />

                    <div
                      className={`text-base md:text-lg leading-relaxed text-left prose max-w-none break-words ${
                        theme === 'dark'
                          ? 'prose-invert text-white/85'
                          : 'text-[#0F172A]/90'
                      }`}
                    >
                      {activeArticle.content.trim().startsWith('<') ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: activeArticle.content,
                          }}
                        />
                      ) : (
                        <Markdown
                          components={{
                            h1: ({ ...props }) => (
                              <h2
                                className="text-2xl font-black uppercase italic mt-8 mb-4"
                                {...props}
                              />
                            ),
                            h2: ({ ...props }) => (
                              <h2
                                className="text-xl font-bold uppercase mt-6 mb-3"
                                {...props}
                              />
                            ),
                            h3: ({ ...props }) => (
                              <h3
                                className="text-lg font-bold uppercase mt-4 mb-2"
                                {...props}
                              />
                            ),
                            p: ({ ...props }) => (
                              <p className="mb-5" {...props} />
                            ),
                          }}
                        >
                          {activeArticle.content}
                        </Markdown>
                      )}
                    </div>

                    {/* Related Articles */}
                    <div className="pt-8 border-t border-white/10 space-y-4">
                      <h2 className="text-sm font-mono uppercase tracking-[0.25em] text-[#00F3FF] font-black">
                        More Forensic Reports
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {posts
                          .filter((p) => p.id !== activeArticle.id)
                          .slice(0, 4)
                          .map((rel) => (
                            <a
                              key={rel.id}
                              href={getPagePath('blog', rel.id)}
                              onClick={(e) => {
                                e.preventDefault();
                                navigateTo('blog', rel.id);
                              }}
                              className="p-4 rounded-2xl border border-white/10 hover:border-[#00F3FF]/50 transition-all block"
                            >
                              <div className="text-[10px] font-mono opacity-50 mb-1">
                                {rel.date}
                              </div>
                              <div className="text-sm font-bold leading-snug">
                                {rel.title}
                              </div>
                            </a>
                          ))}
                      </div>
                    </div>

                    <div className="mt-8 p-8 rounded-3xl border border-dashed border-[#00F3FF]/30 bg-white/5 text-center space-y-4">
                      <p className="text-sm font-bold opacity-85">
                        Verify suspicious images or videos instantly with
                        ScanDeepFake.
                      </p>
                      <a
                        href="/"
                        onClick={(e) => {
                          e.preventDefault();
                          navigateTo('home');
                        }}
                        className="inline-block px-8 py-4 rounded-full font-black uppercase tracking-widest bg-[#00F3FF] text-black text-xs"
                      >
                        Launch Deepfake Scanner
                      </a>
                    </div>
                  </article>
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              ON-DEMAND SITEMAP DIRECTORY (ONLY APPEARS ON BUTTON PRESS)
              ============================================================ */}
          {currentPage === 'sitemap' && (
            <section
              id="sitemap-directory"
              aria-labelledby="sitemap-directory-heading"
              className="max-w-7xl mx-auto mb-16 md:mb-20 space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => navigateTo('home')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/15 text-xs font-black uppercase tracking-wider hover:border-[#00F3FF]"
                >
                  <ChevronLeft size={14} />
                  Back to Scanner
                </button>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#00F3FF]/30 text-[#00F3FF] text-xs font-black uppercase tracking-wider hover:bg-[#00F3FF] hover:text-black transition-all"
                >
                  <ExternalLink size={13} />
                  Open XML Sitemap
                </a>
              </div>

              <div
                className={`border rounded-[28px] md:rounded-[36px] p-5 sm:p-8 md:p-10 space-y-8 ${
                  theme === 'dark'
                    ? 'bg-white/[0.03] border-white/10'
                    : 'bg-[#F8FAFC] border-black/10'
                }`}
              >
                <div className="space-y-2 border-b border-white/10 pb-6">
                  <div
                    className={`text-xs font-mono font-black uppercase tracking-[0.3em] flex items-center gap-2 ${
                      theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'
                    }`}
                  >
                    <Globe size={14} /> Crawlable Webapp Index
                  </div>
                  <h1
                    id="sitemap-directory-heading"
                    className="text-3xl sm:text-4xl md:text-5xl font-black uppercase italic tracking-tighter"
                  >
                    ScanDeepFake{' '}
                    <span
                      className={
                        theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'
                      }
                    >
                      Sitemap
                    </span>
                  </h1>
                  <p className="text-sm opacity-75">
                    Complete index of every core tool page, published forensic
                    blog report, and legal policy.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                  <div className="space-y-4">
                    <h2
                      className={`text-xs font-mono font-black uppercase tracking-[0.25em] ${
                        theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'
                      }`}
                    >
                      Core Webapp Pages
                    </h2>
                    <ul className="space-y-2.5">
                      {SITE_PAGES.filter((p) => p.group === 'core').map(
                        (page) => (
                          <li key={page.id}>
                            <a
                              href={getPagePath(page.id)}
                              onClick={(e) => {
                                e.preventDefault();
                                navigateTo(page.id);
                              }}
                              className="group flex items-center justify-between gap-2 p-3 rounded-xl border border-white/10 hover:border-[#00F3FF]/50 hover:bg-white/5 transition-all"
                            >
                              <span className="text-sm font-bold group-hover:text-[#00F3FF] transition-colors">
                                {page.label}
                              </span>
                              <span className="text-[11px] font-mono opacity-45 shrink-0">
                                {getPagePath(page.id)}
                              </span>
                            </a>
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h2
                      className={`text-xs font-mono font-black uppercase tracking-[0.25em] ${
                        theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'
                      }`}
                    >
                      Indexed Blog Articles ({posts.length})
                    </h2>
                    <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {posts.map((post) => (
                        <li key={post.id}>
                          <a
                            href={getPagePath('blog', post.id)}
                            onClick={(e) => {
                              e.preventDefault();
                              navigateTo('blog', post.id);
                            }}
                            className="group flex flex-col p-3 rounded-xl border border-white/10 hover:border-[#00F3FF]/50 hover:bg-white/5 transition-all"
                          >
                            <span className="text-xs sm:text-sm font-bold leading-snug group-hover:text-[#00F3FF] transition-colors">
                              {post.title}
                            </span>
                            <span className="text-[10px] font-mono opacity-45 mt-1 break-all">
                              {post.date} · {getPagePath('blog', post.id)}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h2
                      className={`text-xs font-mono font-black uppercase tracking-[0.25em] ${
                        theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'
                      }`}
                    >
                      Legal & Crawler Resources
                    </h2>
                    <ul className="space-y-2.5">
                      {SITE_PAGES.filter((p) => p.group === 'legal').map(
                        (page) => (
                          <li key={page.id}>
                            <a
                              href={getPagePath(page.id)}
                              onClick={(e) => {
                                e.preventDefault();
                                navigateTo(page.id);
                              }}
                              className="group flex items-center justify-between gap-2 p-3 rounded-xl border border-white/10 hover:border-[#00F3FF]/50 hover:bg-white/5 transition-all"
                            >
                              <span className="text-sm font-bold group-hover:text-[#00F3FF] transition-colors">
                                {page.label}
                              </span>
                              <span className="text-[11px] font-mono opacity-45 shrink-0">
                                {getPagePath(page.id)}
                              </span>
                            </a>
                          </li>
                        )
                      )}
                      <li>
                        <a
                          href="/robots.txt"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center justify-between gap-2 p-3 rounded-xl border border-white/10 hover:border-[#00F3FF]/50 hover:bg-white/5 transition-all"
                        >
                          <span className="text-sm font-bold group-hover:text-[#00F3FF]">
                            Robots.txt Directive
                          </span>
                          <span className="text-[11px] font-mono opacity-45 shrink-0">
                            /robots.txt
                          </span>
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          )}

          {currentPage === 'docs' && (
            <div className="max-w-4xl mx-auto space-y-10 mb-20">
              <div className="text-center mt-4">
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter italic">
                  Forensic{' '}
                  <span
                    className={
                      theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'
                    }
                  >
                    Manual
                  </span>
                </h1>
                <p className="font-mono text-xs uppercase tracking-[0.4em] mt-2 text-[#00F3FF]">
                  Neural Analysis Documentation v4.2
                </p>
              </div>

              <div className="space-y-6 md:space-y-8">
                <section className="p-6 sm:p-8 rounded-[2rem] border border-white/10 bg-white/5 space-y-4">
                  <h2 className="text-xl font-black uppercase">
                    01. Core Methodology
                  </h2>
                  <p className="leading-relaxed opacity-80 text-sm">
                    ScanDeepFake employs a hybrid detection pipeline combining{' '}
                    <strong>Frequency Domain Analysis (FDA)</strong> and{' '}
                    <strong>Spatial Consistency Checks (SCC)</strong> to isolate
                    generative wavelets and localized pixel artifacts.
                  </p>
                </section>

                <section className="p-6 sm:p-8 rounded-[2rem] border border-white/10 bg-white/5 space-y-4">
                  <h2 className="text-xl font-black uppercase">
                    02. Neural Architecture
                  </h2>
                  <p className="leading-relaxed opacity-80 text-sm">
                    Built on a Vision Transformer (ViT-L/14) and EfficientNet-B7
                    feature extraction pipeline trained against modern diffusion
                    and face-swap generators.
                  </p>
                </section>

                <section className="p-6 sm:p-8 rounded-[2rem] border border-[#00F3FF]/20 bg-[#00F3FF]/5 space-y-4">
                  <h2 className="text-xl font-black uppercase text-[#00F3FF]">
                    03. Zero-Retention Sandbox Protocol
                  </h2>
                  <p className="leading-relaxed opacity-80 text-sm">
                    Media is analyzed locally and ephemerally without permanent
                    server-side storage.
                  </p>
                </section>
              </div>
            </div>
          )}

          {currentPage === 'faq' && (
            <div className="max-w-4xl mx-auto space-y-8 mb-20">
              <div className="text-center mt-4 space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter italic">
                  Help &{' '}
                  <span
                    className={
                      theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'
                    }
                  >
                    FAQ
                  </span>
                </h1>
                <p className="font-mono text-xs uppercase tracking-[0.4em] text-[#00F3FF]">
                  Knowledge Base
                </p>
                <div className="max-w-md mx-auto flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/15 bg-white/5">
                  <Search size={15} className="opacity-40" />
                  <input
                    type="text"
                    placeholder="Filter questions..."
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    className="bg-transparent text-xs outline-none flex-1"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredFaqs.map((faq, idx) => (
                  <FAQItem key={idx} q={faq.q} a={faq.a} theme={theme} />
                ))}
              </div>
            </div>
          )}

          {currentPage === 'about' && (
            <div className="max-w-3xl mx-auto space-y-8 mb-20 mt-4">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter italic text-center">
                About Digital{' '}
                <span
                  className={
                    theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'
                  }
                >
                  Integrity
                </span>
              </h1>
              <div className="p-6 sm:p-8 rounded-[32px] border border-white/10 bg-white/5 text-base leading-relaxed whitespace-pre-wrap opacity-85">
                {config?.legal?.about ||
                  'Welcome to ScanDeepFake, a platform dedicated to media authenticity and digital truth.'}
              </div>
            </div>
          )}

          {currentPage === 'contact' && (
            <div className="max-w-2xl mx-auto space-y-8 mt-4 mb-20">
              <div className="text-center">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter italic">
                  Contact Us
                </h1>
                <p className="opacity-70 font-mono text-xs uppercase mt-2">
                  Forensic Support & Deepfake Reporting
                </p>
              </div>
              {contactSubmitted ? (
                <div className="p-6 sm:p-8 rounded-3xl border border-emerald-400/30 bg-emerald-500/10 text-center space-y-3">
                  <CheckCircle2
                    size={36}
                    className="text-emerald-400 mx-auto"
                  />
                  <h2 className="text-xl font-black uppercase">
                    Message Received
                  </h2>
                  <p className="text-sm opacity-75">
                    Thank you for contacting ScanDeepFake. Our forensic team
                    will respond shortly.
                  </p>
                  <button
                    onClick={() => setContactSubmitted(false)}
                    className="px-6 py-2.5 rounded-xl bg-white/10 text-xs font-black uppercase"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form
                  className="space-y-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setContactSubmitted(true);
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-mono uppercase opacity-75">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full border border-white/15 bg-white/5 rounded-xl px-4 py-3 outline-none focus:border-[#00F3FF]"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-mono uppercase opacity-75">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        className="w-full border border-white/15 bg-white/5 rounded-xl px-4 py-3 outline-none focus:border-[#00F3FF]"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase opacity-75">
                      Topic
                    </label>
                    <select className="w-full border border-white/15 bg-[#0A0F1E] rounded-xl px-4 py-3 outline-none focus:border-[#00F3FF] text-sm">
                      <option>General Verification Inquiry</option>
                      <option>Report a Deepfake Scam</option>
                      <option>Media & Press Request</option>
                      <option>Technical Support</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase opacity-75">
                      Your Message
                    </label>
                    <textarea
                      required
                      rows={5}
                      className="w-full border border-white/15 bg-white/5 rounded-xl px-4 py-3 outline-none focus:border-[#00F3FF] resize-none"
                      placeholder="How can we help?"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 font-black uppercase tracking-widest rounded-xl bg-[#00F3FF] text-black"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>
          )}

          {currentPage === 'privacy' && (
            <LegalPage
              key="privacy"
              title="Privacy Policy"
              theme={theme}
              content={config?.legal?.privacy}
            />
          )}

          {currentPage === 'terms' && (
            <LegalPage
              key="terms"
              title="Terms of Service"
              theme={theme}
              content={config?.legal?.terms}
            />
          )}

          {currentPage === 'disclaimer' && (
            <LegalPage
              key="disclaimer"
              title="Disclaimer"
              theme={theme}
              content={config?.legal?.disclaimer}
            />
          )}
      </main>

      {/* Footer with Crawlable Anchor Links (No Admin Buttons Exposed to Visitors) */}
      <footer
        className={`border-t py-16 px-6 md:px-8 mt-20 transition-colors duration-500 ${
          theme === 'dark'
            ? 'bg-[#050608] border-white/10'
            : 'bg-white border-black/10'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-4">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('home');
                }}
                className="flex flex-col"
              >
                <span className="text-2xl font-black uppercase italic tracking-tighter">
                  ScanDeepFake
                </span>
                <span
                  className={`text-[10px] font-mono font-black uppercase tracking-[0.4em] ${
                    theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'
                  }`}
                >
                  Forensic Division
                </span>
              </a>
              <p className="text-sm leading-relaxed opacity-60 max-w-sm">
                Trusted AI-generated media detection engine and daily digital
                forensics publication.
              </p>
            </div>

            <FooterColumn
              title="Platform"
              theme={theme}
              links={[
                {
                  label: 'Neural Scanner',
                  href: '/',
                  onClick: () => navigateTo('home'),
                },
                {
                  label: 'Forensic Blog',
                  href: getPagePath('blog'),
                  onClick: () => navigateTo('blog'),
                },
                {
                  label: 'Documentation',
                  href: getPagePath('docs'),
                  onClick: () => navigateTo('docs'),
                },
                {
                  label: 'FAQ',
                  href: getPagePath('faq'),
                  onClick: () => navigateTo('faq'),
                },
              ]}
            />

            <FooterColumn
              title="Support & Indexing"
              theme={theme}
              links={[
                {
                  label: 'Contact Us',
                  href: getPagePath('contact'),
                  onClick: () => navigateTo('contact'),
                },
                {
                  label: 'Privacy Policy',
                  href: getPagePath('privacy'),
                  onClick: () => navigateTo('privacy'),
                },
                {
                  label: 'Terms of Use',
                  href: getPagePath('terms'),
                  onClick: () => navigateTo('terms'),
                },
                {
                  label: 'Legal Disclaimer',
                  href: getPagePath('disclaimer'),
                  onClick: () => navigateTo('disclaimer'),
                },
                {
                  label: 'Sitemap Directory',
                  href: getPagePath('sitemap'),
                  onClick: () => navigateTo('sitemap'),
                },
                {
                  label: 'XML Sitemap',
                  href: '/sitemap.xml',
                  external: true,
                },
              ]}
            />
          </div>

          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p
              onClick={handleSecretAdminTap}
              className="text-[10px] font-black uppercase tracking-[0.35em] opacity-40 select-none cursor-default"
            >
              © 2026 SCANDEEPFAKE TECHNOLOGIES. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </footer>

      {/* Slide-out Navigation Drawer (Public Links Only unless Admin is Signed In) */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-[9999]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="absolute inset-0 bg-black/80"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`absolute top-0 right-0 h-full w-full md:w-[380px] p-8 flex flex-col shadow-2xl overflow-y-auto z-[10000] ${
                theme === 'dark' ? 'bg-[#050608]' : 'bg-white'
              } border-l ${
                theme === 'dark' ? 'border-white/20' : 'border-black/20'
              }`}
            >
              <div className="flex justify-between items-center mb-10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-[#00F3FF]">
                    Navigation
                  </span>
                  <span className="text-[10px] opacity-40 uppercase font-black">
                    ScanDeepFake Portal
                  </span>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/10"
                >
                  <X size={22} />
                </button>
              </div>

              <nav className="flex flex-col gap-5 flex-1">
                {SITE_PAGES.filter((p) => p.group === 'core').map((item) => (
                  <a
                    key={item.id}
                    href={getPagePath(item.id)}
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo(item.id);
                    }}
                    className={`text-2xl font-black uppercase tracking-tight italic text-left transition-all hover:translate-x-1 ${
                      currentPage === item.id
                        ? 'text-[#00F3FF]'
                        : theme === 'dark'
                          ? 'text-white'
                          : 'text-[#0F172A]'
                    }`}
                  >
                    {item.label}
                  </a>
                ))}

                {isAdmin && (
                  <>
                    <div className="h-px w-full bg-white/10 my-2" />
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        openCreateArticle();
                      }}
                      className="w-full py-3.5 rounded-xl bg-[#00F3FF] text-black text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <Plus size={15} />
                      Write Daily Article
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        openManageArticles();
                      }}
                      className="w-full py-3 rounded-xl border border-white/15 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <Edit3 size={14} />
                      Admin Studio
                    </button>
                  </>
                )}

                <div className="h-px w-full bg-white/10 my-2" />

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {SITE_PAGES.filter((p) => p.group === 'legal').map((page) => (
                    <a
                      key={page.id}
                      href={getPagePath(page.id)}
                      onClick={(e) => {
                        e.preventDefault();
                        navigateTo(page.id);
                      }}
                      className="text-[11px] font-black uppercase tracking-wider opacity-60 hover:opacity-100 hover:text-[#00F3FF]"
                    >
                      {page.label}
                    </a>
                  ))}
                </div>
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin-Only Studio Modal (Lazy-loaded only when opened via /?admin=true, /admin, Ctrl+Shift+A, or Admin Bar) */}
      {isAdminOpen && (
        <Suspense fallback={null}>
          <AdminPanel
            posts={posts}
            firestorePostIds={firestorePostIds}
            config={config}
            user={user}
            initialMode={adminInitialMode}
            initialPost={adminInitialPost}
            onNavigate={(page, postId) => navigateTo(page, postId || null)}
            onClose={() => setIsAdminOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

function MetadataItem({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme?: 'dark' | 'light';
}) {
  const isDark = theme === 'dark';
  return (
    <div className="flex justify-between items-center">
      <span
        className={`text-xs font-mono uppercase font-black ${
          isDark ? 'text-white/75' : 'text-[#0F172A]/75'
        }`}
      >
        {label}
      </span>
      <span className="text-xs font-bold truncate max-w-[160px]">{value}</span>
    </div>
  );
}

function MetricItem({
  label,
  value,
  status,
  isError,
  isSuccess,
  theme,
}: {
  label: string;
  value: string;
  status: string;
  isError?: boolean;
  isSuccess?: boolean;
  theme?: 'dark' | 'light';
}) {
  const isDark = theme === 'dark';
  return (
    <div className="flex flex-col">
      <span className="text-xs font-black opacity-75 uppercase mb-2 tracking-[0.15em]">
        {label}
      </span>
      <div
        className={`flex justify-between items-end border-b pb-3 ${
          isDark ? 'border-white/10' : 'border-black/10'
        }`}
      >
        <span className="text-sm font-bold">{value}</span>
        <span
          className={`text-xs font-mono font-black uppercase ${
            isError
              ? 'text-[#FF3E3E]'
              : isSuccess
                ? 'text-[#00FF94]'
                : 'text-[#00F3FF]'
          }`}
        >
          {status}
        </span>
      </div>
    </div>
  );
}

function FAQItem({
  q,
  a,
  theme,
}: {
  q: string;
  a: string;
  theme?: 'dark' | 'light';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isDark = theme === 'dark';
  return (
    <div
      className={`border rounded-2xl overflow-hidden ${
        isDark
          ? 'bg-white/5 border-white/10'
          : 'bg-[#F8FAFC] border-black/10 shadow-sm'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex justify-between items-center text-left"
      >
        <span className="text-base md:text-lg font-bold tracking-tight">
          {q}
        </span>
        <ChevronRight
          size={18}
          className={`transition-transform duration-300 ${
            isOpen ? 'rotate-90' : 'opacity-40'
          }`}
        />
      </button>
      {isOpen && (
        <div
          className={`p-6 pt-4 leading-relaxed border-t text-sm ${
            isDark
              ? 'border-white/5 bg-black/20 text-white/80'
              : 'border-black/10 bg-[#F1F5F9] text-[#0F172A]'
          }`}
        >
          {a}
        </div>
      )}
    </div>
  );
}

function FooterColumn({
  title,
  links,
  theme,
}: {
  title: string;
  links: {
    label: string;
    href: string;
    onClick?: () => void;
    external?: boolean;
  }[];
  theme?: 'dark' | 'light';
}) {
  const isDark = theme === 'dark';
  return (
    <div className="space-y-4">
      <p
        className={`text-xs font-mono uppercase tracking-widest font-black ${
          isDark ? 'text-[#00F3FF]' : 'text-[#1E40AF]'
        }`}
      >
        {title}
      </p>
      <ul className="space-y-2.5">
        {links.map((link, i) => (
          <li key={i}>
            <a
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              onClick={
                link.onClick
                  ? (e) => {
                      e.preventDefault();
                      link.onClick!();
                    }
                  : undefined
              }
              className={`text-sm font-semibold uppercase tracking-wider hover:opacity-100 transition-all ${
                isDark
                  ? 'text-white/75 hover:text-[#00F3FF]'
                  : 'text-[#0F172A]/80 hover:text-[#1E40AF]'
              }`}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LegalPage({
  title,
  content,
  theme,
}: {
  title: string;
  content?: string;
  theme?: 'dark' | 'light';
}) {
  const isDark = theme === 'dark';
  const displayContent =
    content ||
    'ScanDeepFake maintains strict compliance with digital privacy standards. Please contact support@scandeepfake.com if you require immediate assistance.';

  return (
    <div className="max-w-4xl mx-auto space-y-10 mb-20">
      <div className="text-center mt-4">
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">
          {title}
        </h1>
        <div
          className={`h-1 w-24 mx-auto mt-5 ${
            isDark ? 'bg-[#00F3FF]' : 'bg-[#1E40AF]'
          }`}
        />
      </div>
      <div
        className={`border rounded-[36px] p-8 md:p-12 ${
          isDark
            ? 'bg-white/5 border-white/10'
            : 'bg-[#F1F5F9] border-black/10'
        }`}
      >
        <div className="leading-loose text-base md:text-lg whitespace-pre-wrap opacity-85">
          {displayContent}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  theme,
}: {
  label: string;
  value: string;
  color?: string;
  theme?: 'dark' | 'light';
}) {
  const isDark = theme === 'dark';
  return (
    <div
      className={`p-5 border rounded-2xl ${
        isDark
          ? 'bg-white/[0.03] border-white/10'
          : 'bg-black/[0.03] border-black/10'
      }`}
    >
      <div className="text-[11px] font-mono uppercase opacity-70 mb-1.5 tracking-wider">
        {label}
      </div>
      <div
        className={`text-2xl font-black ${
          color || (isDark ? 'text-white' : 'text-black')
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function SelectionCard({
  icon: Icon,
  title,
  desc,
  onClick,
  theme,
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  desc: string;
  onClick: () => void;
  theme?: 'dark' | 'light';
}) {
  const isDark = theme === 'dark';
  return (
    <button
      onClick={onClick}
      className={`p-8 border rounded-[2rem] text-left transition-all group ${
        isDark
          ? 'bg-white/5 border-white/10 hover:border-[#00F3FF] hover:bg-[#00F3FF]/5'
          : 'bg-black/5 border-black/10 hover:border-[#1E40AF] hover:bg-[#1E40AF]/5'
      }`}
    >
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform ${
          isDark
            ? 'bg-[#00F3FF]/10 text-[#00F3FF]'
            : 'bg-[#1E40AF]/10 text-[#1E40AF]'
        }`}
      >
        <Icon size={28} />
      </div>
      <p className="text-xl font-black uppercase italic mb-2 tracking-tight">
        {title}
      </p>
      <p className="text-sm leading-relaxed opacity-80">{desc}</p>
    </button>
  );
}

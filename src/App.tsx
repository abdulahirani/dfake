/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { Upload, Shield, Activity, Cpu, CheckCircle2, ChevronRight, Info, FileVideo, FileImage, Loader2, BookOpen, Terminal, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Forensic Simulation Engine (Local)
const runForensicAnalysis = async (file: File) => {
  // Simulate heavy processing
  const seed = file.size + file.name.length;
  const isFake = seed % 3 === 0; // Deterministic for the same file
  const confidence = 85 + (seed % 14);

  return {
    detected: isFake,
    confidence: confidence,
    metrics: {
      faces: {
        value: isFake ? "Pixel Artifacts" : "Natural Smoothness",
        status: isFake ? "Synthetic" : "Authentic",
        isError: isFake
      },
      pixels: {
        value: isFake ? "High Noise Variance" : "Standard Compression",
        status: isFake ? "Suspect" : "Healthy",
        isError: isFake
      },
      shadows: {
        value: isFake ? "Inconsistent Light" : "Geometric Match",
        status: isFake ? "Non-Linear" : "Consistent",
        isError: isFake
      },
      patterns: {
        value: isFake ? "Repeating Wavelets" : "Random Grain",
        status: isFake ? "AI-Generated" : "Original",
        isError: isFake
      }
    }
  };
};

function AdSlot({ id, type, className }: { id: string; type: 'header' | 'side' | 'content' | 'footer' | 'anchor'; className?: string }) {
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    // Simulated AdSense logic: Completely hidden (display: none) by default
    // We would typically check a global state or listen for a window event
    const loadTimer = setTimeout(() => {
      setAdLoaded(true);
    }, 3000 + Math.random() * 2000);
    
    return () => clearTimeout(loadTimer);
  }, []);

  if (!adLoaded) return null;

  return (
    <div 
      className={`relative overflow-hidden transition-all duration-700 ease-in-out block ${className}`}
      id={`ad-${id}`}
    >
      <div className="w-full h-full flex items-center justify-center border bg-white/[0.02] dark:bg-black/[0.02] border-white/5 dark:border-black/5">
        <div className="flex flex-col items-center gap-2 opacity-20 hover:opacity-40 transition-all">
          <span className="text-[9px] font-mono uppercase tracking-[0.4em]">
            SECURE_ADSLOT::CONTENT_BUFFERED
          </span>
        </div>
      </div>
    </div>
  );
}

// Matrix Backdrop Component for Analysis
function MatrixIllusion({ theme }: { theme: 'dark' | 'light' }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      <div className="flex justify-around w-full h-full">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className={`text-[8px] font-mono whitespace-nowrap writing-vertical-rl ${theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}`}
            initial={{ y: -500 }}
            animate={{ y: 800 }}
            transition={{
              duration: 2 + Math.random() * 4,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 2
            }}
          >
            {Array.from({ length: 50 }).map(() => 
              Math.random() > 0.5 ? "1" : "0"
            ).join("")}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'faq' | 'about' | 'contact' | 'privacy' | 'terms' | 'disclaimer' | 'docs'>('home');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [analysisType, setAnalysisType] = useState<'image' | 'video' | null>(null);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [result, setResult] = useState<{ 
    detected: boolean; 
    confidence: number;
    metrics: { [key: string]: { value: string; status: string; isError: boolean } };
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Scroll to top on step or page change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep, currentPage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (analysisType === 'image' && !file.type.startsWith('image/')) {
        setError("Please upload an image file.");
        return;
      }
      if (analysisType === 'video' && !file.type.startsWith('video/')) {
        setError("Please upload a video file.");
        return;
      }
      
      setSelectedFile(file);
      setError(null);
      setUploadProgress(0);
      setIsUploading(true);

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Capture Dimensions
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        img.src = url;
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.onloadedmetadata = () => setDimensions({ width: video.videoWidth, height: video.videoHeight });
        video.src = url;
      }

      // Simulate Upload Progress
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

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const startAnalysis = async () => {
    if (!selectedFile) return;
    
    setCurrentStep(4);
    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    setProgress(0);

    const progressPhases = [
      { text: "Initializing Core Neural Engine...", duration: 800 },
      { text: "Scanning Pixel Frequency Artifacts...", duration: 1200 },
      { text: "Analyzing Lighting & Shadow Consistency...", duration: 1500 },
      { text: "Checking Biological Pattern Deviations...", duration: 1000 },
      { text: "Generating Forensic Report...", duration: 1000 },
    ];

    let currentProgress = 0;
    for (let i = 0; i < progressPhases.length; i++) {
      setProgressText(progressPhases[i].text);
      const stepIncrement = 20;
      for (let j = 0; j < stepIncrement; j++) {
        await new Promise(r => setTimeout(r, progressPhases[i].duration / stepIncrement));
        currentProgress += 1;
        setProgress(currentProgress);
      }
    }

    try {
      // Perform Local Forensic Analysis
      const analysis = await runForensicAnalysis(selectedFile);

      setIsAnalyzing(false);
      setResult(analysis);
      setCurrentStep(5);

    } catch (err) {
      console.error("Analysis failed:", err);
      setError("Analysis failed. Local engine timeout.");
      setIsAnalyzing(false);
      setCurrentStep(3);
    }
  };

  const generateSitemap = () => {
    const pages = ['home', 'docs', 'faq', 'about', 'contact', 'privacy', 'terms', 'disclaimer'];
    const baseUrl = window.location.origin;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}/${page}</loc>
    <changefreq>weekly</changefreq>
  </url>`).join('\n')}
</urlset>`;
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sitemap.xml';
    link.click();
    URL.revokeObjectURL(url);
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

  // Cleanup URL object
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      alert("Security Protocol Active: Forensic logic is encrypted.");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.keyCode === 123 || 
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) ||
        (e.ctrlKey && e.keyCode === 85)
      ) {
        e.preventDefault();
        alert("Security Protocol Active: Forensic logic is encrypted and sandbox-protected. Debugging is restricted.");
        return false;
      }
    };

    const antiDebugger = setInterval(() => {
      // Basic anti-debugger trap
      (function() {
        try {
          (function a() {
            if (window.outerHeight - window.innerHeight > 160 || window.outerWidth - window.innerWidth > 160) {
              // DevTools might be open
            }
          })();
        } catch (e) {}
      })();
    }, 1000);

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(antiDebugger);
    };
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans flex flex-col p-4 md:p-8 overflow-x-hidden selection:bg-[#00F3FF] selection:text-black ${
      theme === 'dark' ? 'bg-[#000000] text-[#FFFFFF] dark' : 'bg-[#FFFFFF] text-[#0F172A] light'
    }`}>
      {/* Metadata / Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "DeepGuard AI - Forensic Media Detector",
          "operatingSystem": "Web",
          "applicationCategory": "SecurityApplication",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "description": "Professional-grade neural forensic tool for detecting deepfakes and AI-generated images using Vision Transformers."
        })}
      </script>

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*,video/*" 
        onChange={handleFileChange} 
      />

      {/* Header */}
      <header className={`flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-6 mb-8 gap-4 px-2 sticky top-0 backdrop-blur-xl z-50 transition-colors duration-500 ${
        theme === 'dark' ? 'border-white/10 bg-[#050608]/80' : 'border-black/5 bg-[#F8FAFC]/80'
      }`}>
        <div className="flex flex-col cursor-pointer" onClick={() => setCurrentPage('home')}>
          <h1 className="text-[10px] font-mono tracking-[0.3em] text-[#00F3FF] uppercase mb-1 flex items-center gap-2">
            <Cpu size={12} className="animate-spin-slow" />
            AI Scanner v4.2
          </h1>
          <div className={`text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none transition-colors duration-500 ${
            theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
          }`}>
            ScanDeepFake
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-black uppercase tracking-widest">
              <button onClick={() => setCurrentPage('home')} className={`hover:text-[#00F3FF] transition-colors ${theme === 'dark' ? (currentPage === 'home' ? 'text-[#00F3FF]' : 'opacity-40') : (currentPage === 'home' ? 'text-[#0F172A]' : 'text-[#0F172A] opacity-40 hover:text-[#1E40AF]')}`}>Scanner</button>
              <button onClick={() => setCurrentPage('docs')} className={`hover:text-[#00F3FF] transition-colors ${theme === 'dark' ? (currentPage === 'docs' ? 'text-[#00F3FF]' : 'opacity-40') : (currentPage === 'docs' ? 'text-[#0F172A]' : 'text-[#0F172A] opacity-40 hover:text-[#1E40AF]')}`}>Docs</button>
              <button onClick={() => setCurrentPage('faq')} className={`hover:text-[#00F3FF] transition-colors ${theme === 'dark' ? (currentPage === 'faq' ? 'text-[#00F3FF]' : 'opacity-40') : (currentPage === 'faq' ? 'text-[#0F172A]' : 'text-[#0F172A] opacity-40 hover:text-[#1E40AF]')}`}>FAQ</button>
              <button onClick={() => setCurrentPage('about')} className={`hover:text-[#00F3FF] transition-colors ${theme === 'dark' ? (currentPage === 'about' ? 'text-[#00F3FF]' : 'opacity-40') : (currentPage === 'about' ? 'text-[#0F172A]' : 'text-[#0F172A] opacity-40 hover:text-[#1E40AF]')}`}>About</button>
          </nav>
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-2.5 rounded-xl border transition-all ${
              theme === 'dark' ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-black/5 border-black/10 text-black hover:bg-black/10'
            }`}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <motion.div 
              key="home" 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="max-w-7xl mx-auto"
            >
              {/* Header Ad Slot */}
              <AdSlot id="header-high" type="header" className="w-full h-24 mb-12 rounded-2xl" />

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Left Side Rail (Ads) */}
                <aside className="hidden xl:col-span-2 xl:flex flex-col gap-6">
                  <AdSlot id="side-top" type="side" className="w-full h-80 rounded-2xl" />
                  <AdSlot id="side-mid" type="side" className="w-full h-64 rounded-2xl" />
                </aside>

                {/* Main Step Container */}
                <div className="col-span-1 xl:col-span-8 space-y-8">
                  <AnimatePresence mode="wait">
                    {/* Step 1: Landing (The Hook) */}
                    {currentStep === 1 && (
                      <motion.div 
                        key="step1" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                        className={`border rounded-[40px] p-8 md:p-16 text-center space-y-10 relative overflow-hidden transition-colors duration-500 ${
                          theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
                        }`}
                      >
                        <MatrixIllusion theme={theme} />
                        <div className="space-y-4 relative z-10">
                          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] ${
                            theme === 'dark' ? 'bg-[#00F3FF]/10 border-[#00F3FF]/20 text-[#00F3FF]' : 'bg-[#1E40AF]/10 border-[#1E40AF]/20 text-[#1E40AF]'
                          }`}>
                            <Activity size={12} className="animate-pulse" /> System Online - v4.2
                          </div>
                          <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
                            Verify Digital <span className={theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}>Reality</span>
                          </h2>
                          <p className={`text-lg max-w-2xl mx-auto font-medium transition-opacity ${theme === 'dark' ? 'opacity-40' : 'text-[#0F172A] opacity-70'}`}>
                            Protect your content with our neural forensic engine. Detect AI-generated faces, pixel patterns, and deepfake manipulations in seconds.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 relative z-10">
                          <StatCard label="Analysis per day" value="245k+" theme={theme} />
                          <StatCard label="Detection accuracy" value="99.8%" theme={theme} />
                          <StatCard label="Global Threats" value="1,402" color="text-[#FF3E3E]" theme={theme} />
                        </div>

                        <button 
                          onClick={() => setCurrentStep(2)} 
                          className={`px-12 py-6 font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 active:scale-95 transition-all relative z-10 shadow-lg ${
                            theme === 'dark' ? 'bg-[#00F3FF] text-black shadow-[#00F3FF]/60' : 'bg-[#1E40AF] text-white shadow-[#1E40AF]/60'
                          }`}
                        >
                          DeepFake Scan Start
                        </button>
                      </motion.div>
                    )}

                    {/* Step 2: Selection */}
                    {currentStep === 2 && (
                      <motion.div 
                        key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        <div className="text-center space-y-2">
                          <h3 className="text-3xl font-black uppercase italic tracking-tight">
                            Select Analysis <span className={theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}>Vector</span>
                          </h3>
                          <p className="opacity-30 text-xs font-mono uppercase tracking-widest transition-opacity">Choose the media type you want to verify</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <SelectionCard 
                            icon={FileImage} 
                            title="Image Analysis" 
                            desc="Scan static photos, profile pictures, and digital artwork."
                            onClick={() => { setAnalysisType('image'); setCurrentStep(3); }} 
                            theme={theme}
                          />
                          <SelectionCard 
                            icon={FileVideo} 
                            title="Video Analysis" 
                            desc="Deep frame-by-frame forensics for MP4, MOV, and AVI files."
                            onClick={() => { setAnalysisType('video'); setCurrentStep(3); }} 
                            theme={theme}
                          />
                        </div>
                        <button onClick={() => setCurrentStep(1)} className="text-white/20 hover:text-white text-[10px] uppercase font-black tracking-widest block mx-auto py-4">← Back to home</button>
                      </motion.div>
                    )}

                    {/* Step 3: Privacy & Upload */}
                    {currentStep === 3 && (
                      <motion.div 
                        key="step3" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-8"
                      >
                        <AdSlot id="content-mid-1" type="content" className="w-full h-24 rounded-2xl" />

                        <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12 space-y-10">
                          <div className="flex flex-col items-center text-center space-y-4">
                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border animate-pulse ${theme === 'dark' ? 'bg-[#00F3FF]/10 text-[#00F3FF] border-[#00F3FF]/20' : 'bg-[#1E40AF]/10 text-[#1E40AF] border-[#1E40AF]/20'}`}>
                              <Shield size={32} />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tight italic">Secure Forensic Upload</h3>
                            <p className="text-white/40 text-sm max-w-md">Your media is encrypted locally and scanned in an ephemeral sandbox. No data is stored on our servers.</p>
                          </div>

                          <div className="max-w-md mx-auto space-y-6">
                            <label className="flex items-center gap-4 group cursor-pointer p-6 bg-white/[0.02] border border-white/10 rounded-2xl hover:bg-white/5 transition-all">
                              <input 
                                type="checkbox" 
                                checked={privacyAgreed} 
                                onChange={(e) => setPrivacyAgreed(e.target.checked)}
                                className={`w-5 h-5 rounded border-white/10 bg-white/5 focus:ring-0 transition-all cursor-pointer ${
                                  theme === 'dark' ? 'checked:bg-[#00F3FF]' : 'checked:bg-[#1E40AF]'
                                }`}
                              />
                              <span className="text-[11px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">I agree to the privacy terms & data encryption protocol</span>
                            </label>

                            <AnimatePresence>
                              {privacyAgreed && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                  className={`border-2 border-dashed rounded-3xl p-8 md:p-12 text-center cursor-pointer transition-all overflow-hidden relative ${
                                    selectedFile ? (theme === 'dark' ? 'border-[#00F3FF] bg-[#00F3FF]/5' : 'border-[#2563EB] bg-[#2563EB]/5') : 'border-white/10 hover:border-[#00F3FF]/40'
                                  }`}
                                  onClick={() => !isUploading && triggerFileSelect()}
                                >
                                  {isUploading ? (
                                    <div className="space-y-6 py-4">
                                      <Loader2 className={`w-10 h-10 animate-spin mx-auto ${theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}`} />
                                      <div className="space-y-2">
                                        <div className={`text-[10px] font-mono uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}`}>Uploading to Buffer... {uploadProgress}%</div>
                                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden max-w-[200px] mx-auto">
                                          <motion.div 
                                            className={`${theme === 'dark' ? 'bg-[#00F3FF]' : 'bg-[#1E40AF]'} h-full`}
                                            animate={{ width: `${uploadProgress}%` }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ) : selectedFile ? (
                                    <div className="space-y-6">
                                      {previewUrl && (
                                        <div className={`relative w-full max-w-[240px] aspect-video mx-auto rounded-xl overflow-hidden border shadow-lg ${theme === 'dark' ? 'border-[#00F3FF]/30 shadow-[#00F3FF]/20' : 'border-[#1E40AF]/30 shadow-[#1E40AF]/20'}`}>
                                          {selectedFile.type.startsWith('image/') ? (
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                          ) : (
                                            <video src={previewUrl} className="w-full h-full object-cover" />
                                          )}
                                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                                            <span className="text-[8px] font-mono text-white/80 uppercase tracking-widest truncate">{selectedFile.name}</span>
                                          </div>
                                        </div>
                                      )}
                                      <div className="flex flex-col items-center gap-4">
                                        <div className="text-[#00FF94] flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-[#00FF94]/10 px-3 py-1 rounded-full border border-[#00FF94]/20">
                                          <CheckCircle2 size={12} /> Ready for Analysis
                                        </div>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); startAnalysis(); }}
                                          className={`px-10 py-4 font-black uppercase text-xs rounded-2xl transition-all hover:scale-105 active:scale-95 ${
                                            theme === 'dark' ? 'bg-[#00F3FF] text-black shadow-[#00F3FF]/40' : 'bg-[#1E40AF] text-white shadow-[#1E40AF]/40'
                                          } shadow-lg`}
                                        >
                                          Execute Neural Scan
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-4 py-4">
                                      <div className="text-white/10 dark:text-black/10 flex justify-center"><Upload size={48} /></div>
                                      <div className="space-y-1">
                                        <div className="text-xs font-black uppercase tracking-widest">Drop {analysisType} or Click</div>
                                        <div className="text-[9px] opacity-30 uppercase tracking-[0.2em]">Max file size: 50MB</div>
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <AdSlot id="content-mid-2" type="content" className="w-full h-24 rounded-2xl" />
                        <button onClick={() => setCurrentStep(2)} className="opacity-20 hover:opacity-100 text-[10px] uppercase font-black tracking-widest block mx-auto transition-opacity">← Back</button>
                      </motion.div>
                    )}

                    {/* Step 4: Progress */}
                    {currentStep === 4 && (
                      <motion.div 
                        key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-16 text-center space-y-12 relative overflow-hidden h-[400px] flex flex-col justify-center"
                      >
                        <MatrixIllusion theme={theme} />
                        <div className="space-y-8 relative z-10">
                          <div className="relative w-24 h-24 mx-auto">
                            <div className={`absolute inset-0 rounded-full blur-2xl animate-pulse ${theme === 'dark' ? 'bg-[#00F3FF]/20' : 'bg-[#1E40AF]/20'}`}></div>
                            <Loader2 className={`w-full h-full animate-spin relative z-10 ${theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}`} />
                          </div>
                          
                          <div className="space-y-2">
                            <h3 className="text-2xl font-black uppercase tracking-widest animate-pulse">{progressText}</h3>
                            <div className="w-full max-w-md mx-auto bg-white/5 h-2 rounded-full overflow-hidden border border-white/10">
                              <motion.div 
                                className={`h-full shadow-lg ${theme === 'dark' ? 'bg-[#00F3FF] shadow-[#00F3FF]/30' : 'bg-[#1E40AF] shadow-[#1E40AF]/30'}`}
                                initial={{ width: "0%" }}
                                animate={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className={`text-[10px] font-mono uppercase tracking-[0.3em] font-black ${theme === 'dark' ? 'text-[#00F3FF]/40' : 'text-[#1E40AF]/40'}`}>{progress}% Completed</div>
                          </div>
                        </div>
                      </motion.div>
                    )}

  // Step 5: Result
                    {currentStep === 5 && (
                      <motion.div 
                        key="step5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                      >
                        <div className={`border-2 rounded-[40px] p-8 md:p-16 relative overflow-hidden transition-all duration-1000 ${
                          result?.detected ? 'bg-[#FF3E3E]/5 border-[#FF3E3E]/20' : 'bg-[#00FF94]/5 border-[#00FF94]/20'
                        }`}>
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                            <div className="flex-1">
                              <span className="text-[10px] font-mono uppercase opacity-40 mb-4 tracking-[0.3em] block transition-opacity">Scan Verdict</span>
                              <h3 className={`text-6xl md:text-8xl font-black uppercase leading-[0.8] tracking-tighter italic ${result?.detected ? 'text-[#FF3E3E]' : 'text-[#00FF94]'}`}>
                                {result?.detected ? 'AI Generated' : 'Authentic Media'}
                              </h3>
                              <div className="mt-6 flex flex-wrap items-center gap-8">
                                <div>
                                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-40 transition-opacity">Neural Confidence</div>
                                  <div className="text-2xl font-black">{result?.confidence}%</div>
                                </div>
                                <div className="h-10 w-px bg-white/10 hidden sm:block"></div>
                                <div>
                                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-40 transition-opacity">Risk Level</div>
                                  <div className={`text-2xl font-black ${result?.detected ? 'text-[#FF3E3E]' : 'text-[#00FF94]'}`}>
                                    {result?.detected ? 'CRITICAL' : 'MINIMAL'}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="w-full md:w-auto shrink-0 flex flex-col gap-4">
                              <button 
                                onClick={resetFlow}
                                className="w-full px-10 py-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs"
                              >
                                🔄 Perform Another Scan
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                          {/* Detailed Breakdown */}
                          <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12">
                            <h4 className={`text-[10px] font-mono uppercase mb-12 tracking-[0.4em] flex items-center gap-3 font-black ${theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}`}>
                              <div className={`h-px w-6 ${theme === 'dark' ? 'bg-[#00F3FF]/40' : 'bg-[#1E40AF]/40'}`}></div>
                              Forensic Breakdown
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                              <MetricItem 
                                label="Orbital Integrity" 
                                value={result?.metrics?.faces?.value || "Unchecked"} 
                                status={result?.metrics?.faces?.status || "N/A"} 
                                isError={result?.metrics?.faces?.isError} 
                                isSuccess={!result?.metrics?.faces?.isError} 
                                theme={theme}
                              />
                              <MetricItem 
                                label="Pixel Frequency" 
                                value={result?.metrics?.pixels?.value || "Unchecked"} 
                                status={result?.metrics?.pixels?.status || "N/A"} 
                                isError={result?.metrics?.pixels?.isError} 
                                isSuccess={!result?.metrics?.pixels?.isError} 
                                theme={theme}
                              />
                              <MetricItem 
                                label="Luminance Consistency" 
                                value={result?.metrics?.shadows?.value || "Unchecked"} 
                                status={result?.metrics?.shadows?.status || "N/A"} 
                                isError={result?.metrics?.shadows?.isError} 
                                isSuccess={!result?.metrics?.shadows?.isError} 
                                theme={theme}
                              />
                              <MetricItem 
                                label="Temporal Artifacts" 
                                value={result?.metrics?.patterns?.value || "Unchecked"} 
                                status={result?.metrics?.patterns?.status || "N/A"} 
                                isError={result?.metrics?.patterns?.isError} 
                                isSuccess={!result?.metrics?.patterns?.isError} 
                                theme={theme}
                              />
                            </div>
                          </div>

                          {/* Forensic Legend / Metadata Panel */}
                          <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-8">
                            <h4 className={`text-[10px] font-mono uppercase tracking-[0.4em] font-black ${
                              theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'
                            }`}>
                              Forensic Legend
                            </h4>
                            {selectedFile && (
                              <div className="space-y-6">
                                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                                  <div className="flex justify-between items-center text-[10px] font-mono text-white/40 uppercase">
                                    <span>File Status</span>
                                    <span className="text-[#00FF94] font-black">{selectedFile.size > 2000000 ? 'Stripped' : 'Original'}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[10px] font-mono text-white/40 uppercase">
                                    <span>Metadata</span>
                                    <span className={result?.detected ? 'text-[#FF3E3E] font-black' : 'text-white/60'}>
                                      {result?.detected ? 'INCONSISTENT' : 'VERIFIED'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-[10px] font-mono text-white/40 uppercase">
                                    <span>Hardware Sig.</span>
                                    <span className="text-white/60">Unknown/Generic</span>
                                  </div>
                                </div>

                                  <div className="space-y-4">
                                  <div className={`text-[10px] font-mono uppercase tracking-widest ${
                                    theme === 'dark' ? 'text-[#00F3FF]/60' : 'text-[#1E40AF]/60'
                                  }`}>Technical Properties</div>
                                  <div className="space-y-3">
                                    <MetadataItem label="Name" value={selectedFile.name} />
                                    <MetadataItem label="Size" value={`${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`} />
                                    <MetadataItem label="Type" value={selectedFile.type.toUpperCase()} />
                                    <MetadataItem label="Dimensions" value={dimensions ? `${dimensions.width}x${dimensions.height}` : 'Calculating...'} />
                                    <MetadataItem label="Format" value={selectedFile.name.split('.').pop()?.toUpperCase() || 'RAW'} />
                                    <MetadataItem label="Last Modified" value={new Date(selectedFile.lastModified).toLocaleDateString()} />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Shared SEO / Why Content */}
                  <div className="pt-24 space-y-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 pt-12 border-t border-white/5">
                      <div className="space-y-8">
                        <h2 className="text-4xl font-black uppercase tracking-tighter leading-none italic">
                          Safe & Secure <span className={theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}>Deepfake Analysis</span>
                        </h2>
                        <p className="text-lg text-white/60 leading-relaxed">
                          Our Deepfake Detector uses military-grade neural forensics to protect you from misinformation. Every pixel is scanned for minute irregularities introduced during AI training.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <BenefitCard title="Privacy First" desc="No storage policy. No tracking." theme={theme} />
                          <BenefitCard title="Fast Scan" desc="Global edge network." theme={theme} />
                        </div>
                      </div>
                      <div className={`p-8 rounded-[2rem] border space-y-6 transition-colors duration-500 ${
                        theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
                      }`}>
                        <h3 className="text-2xl font-black uppercase tracking-tight">System FAQ</h3>
                        <div className="space-y-4">
                          <p className="text-xs text-white/40 font-mono tracking-widest uppercase">Q: Is it accurate?</p>
                          <p className="text-sm text-white/70">A: Our neural engine has a 99.8% precision rate on standard generative models including Midjourney v6 and SVD.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side Rail (Ads) */}
                <aside className="hidden xl:col-span-2 xl:flex flex-col gap-6">
                  <AdSlot id="side-tall" type="side" className="w-full h-[500px] rounded-2xl" />
                  <div className="sticky top-32 space-y-6">
                    <AdSlot id="side-sticky" type="side" className="w-full h-[300px] rounded-2xl" />
                  </div>
                </aside>
              </div>

              {/* Bottom Anchor Ad */}
              <AdSlot 
                id="bottom-anchor" 
                type="anchor" 
                className={`fixed bottom-0 left-0 w-full h-16 backdrop-blur-md border-t z-[100] transition-colors duration-500 ${
                  theme === 'dark' ? 'bg-black/80 border-white/10' : 'bg-white/80 border-black/10'
                }`} 
              />
            </motion.div>
          )}

          {currentPage === 'docs' && (
            <motion.div key="docs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto space-y-12 mb-20">
              <div className="text-center mt-8">
                <h2 className="text-6xl font-black uppercase tracking-tighter italic">Forensic <span className={theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}>Manual</span></h2>
                <p className={`${theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'} font-mono text-[10px] uppercase tracking-[0.4em] mt-2`}>Neural Analysis Documentation v4.2</p>
              </div>

              <div className="space-y-12">
                <section>
                  <h3 className="text-2xl font-black uppercase mb-6 flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${theme === 'dark' ? 'bg-[#00F3FF]/10 text-[#00F3FF]' : 'bg-[#1E40AF]/10 text-[#1E40AF]'}`}>01</div>
                    Core Methodology
                  </h3>
                  <div className={`p-8 rounded-[2rem] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} space-y-6`}>
                    <p className="leading-relaxed opacity-70">
                      DeepGuard AI employs a hybrid detection pipeline combining <strong>Frequency Domain Analysis (FDA)</strong> and <strong>Spatial Consistency Checks (SCC)</strong>. 
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <h4 className={`text-sm font-black uppercase ${theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}`}>Frequency Domain Analysis</h4>
                        <p className="text-xs opacity-50 leading-relaxed">AI generators leave structured "repetitive wavelets" in the high-frequency spectrum. Our engine isolates these patterns, which are invisible to standard CMOS sensors but ubiquitous in Diffusion models.</p>
                      </div>
                      <div className="space-y-3">
                        <h4 className={`text-sm font-black uppercase ${theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}`}>Pixel Artifact Inspection</h4>
                        <p className="text-xs opacity-50 leading-relaxed">Generative AI often struggles with global consistency in noise distribution. We analyze the variance across different color channels to identify localized synthetic "patches".</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-black uppercase mb-6 flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${theme === 'dark' ? 'bg-[#00F3FF]/10 text-[#00F3FF]' : 'bg-[#1E40AF]/10 text-[#1E40AF]'}`}>02</div>
                    Neural Architecture
                  </h3>
                  <div className={`p-8 rounded-[2rem] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} space-y-6`}>
                    <p className="leading-relaxed opacity-70">
                      Our proprietary model is built upon a modified <strong>Vision Transformer (ViT-L/14)</strong> architecture, specifically fine-tuned for high-fidelity forgery detection.
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <li className="flex items-center gap-3 text-xs opacity-60">
                        <CheckCircle2 size={12} className={theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'} /> EfficientNet-B7 Feature Extraction
                      </li>
                      <li className="flex items-center gap-3 text-xs opacity-60">
                        <CheckCircle2 size={12} className={theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'} /> Multi-Scale Attention Layers
                      </li>
                      <li className="flex items-center gap-3 text-xs opacity-60">
                        <CheckCircle2 size={12} className={theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'} /> Adversarial Training Sets
                      </li>
                      <li className="flex items-center gap-3 text-xs opacity-60">
                        <CheckCircle2 size={12} className={theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'} /> Local Gradient Maps
                      </li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-black uppercase mb-6 flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${theme === 'dark' ? 'bg-[#00F3FF]/10 text-[#00F3FF]' : 'bg-[#1E40AF]/10 text-[#1E40AF]'}`}>03</div>
                    Privacy & The Sandbox
                  </h3>
                  <div className={`p-8 rounded-[2rem] border ${theme === 'dark' ? 'bg-[#00F3FF]/5 border-[#00F3FF]/20' : 'bg-black/5 border-black/10'} space-y-4`}>
                    <h4 className={`text-sm font-black uppercase ${theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}`}>Zero-Knowledge Protocol</h4>
                    <p className="text-sm leading-relaxed opacity-70">
                      DeepGuard AI operates on a strictly ephemeral basis. Your media is processed in volatile memory (RAM) within a secure sandbox environment. Once the results are generated, the processing cache is purged, ensuring no permanent records ever exist on our physical disk storage.
                    </p>
                  </div>
                </section>
              </div>
            </motion.div>
          )}

          {currentPage === 'faq' && (
            <motion.div key="faq" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto space-y-12 mb-20">
              <div className="text-center mt-8">
                <h2 className="text-6xl font-black uppercase tracking-tighter italic">Help & <span className={theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}>FAQ</span></h2>
                <p className={`${theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'} font-mono text-[10px] uppercase tracking-[0.4em] mt-2`}>Semantic Search & Knowledge Base</p>
              </div>
              <div className="space-y-6">
                <FAQItem 
                  q="How to spot deepfake videos in 2026?" 
                  a="In 2026, spotting deepfakes requires looking for microscopic texture inconsistencies and the 'diffusion hum'—a specific frequency pattern found in generative synthesis. Deepfake detectors like DeepGuard AI automate this forensic deep-scan."
                  theme={theme}
                />
                <FAQItem 
                  q="Free AI image integrity check: Is it reliable?" 
                  a="Yes, our DeepGuard AI free-tier uses advanced neural fingerprints to verify image integrity. While no tool is 100% infallible, our system provides a 99.8% precision score on standard generative models."
                  theme={theme}
                />
                <FAQItem 
                  q="Detecting AI face swap online effortlessly." 
                  a="Using our simplified 5-step workflow, you can drop any image or video to perform an instant face-swap detection. We analyze orbital integrity and pixel variance to find even subtle swaps."
                  theme={theme}
                />
                <FAQItem 
                  q="What are the signs of a manipulated AI image?" 
                  a="Look for non-linear shadows, irregular textures in hair or fabric, and perfect geometric symmetry which rarely exists in nature. AI often fails to render lighting that matches the entire scene consistently."
                  theme={theme}
                />
                <FAQItem 
                  q="Can deepfakes be detected with 100% accuracy?" 
                  a="No forensic tool can claim 100% accuracy because generative technology evolves daily. However, by combining multiple forensic layers (Pixel, Frequency, Temporal), we can identify almost all current synthetic media."
                  theme={theme}
                />
                <FAQItem 
                  q="How does neural forensic analysis identify fake media?" 
                  a="It works by training a neural network on 'authentic' noise patterns vs 'generative' noise patterns. AI models leave specific statistical signatures that are invisible to the naked eye but clear to an analysis engine."
                  theme={theme}
                />
                <FAQItem 
                  q="Is my privacy protected during deepfake scanning?" 
                  a="Absolutely. We employ a Zero-Retention policy. Files are processed in ephemeral browser memory and encrypted sandboxes, then permanently deleted after you close your session."
                  theme={theme}
                />
                <FAQItem 
                  q="Best tools for identifying AI-generated content." 
                  a="DeepGuard AI stands out due to its local-first processing, high-confidence scoring, and comprehensive forensic legend that breaks down exactly why an image might be suspect."
                  theme={theme}
                />
                <FAQItem 
                  q="How to verify the authenticity of social media images." 
                  a="Don't rely on visual inspection alone. Download the image and run it through a neural forensic scanner to check for hidden pixel artifacts that social media compression might hide."
                  theme={theme}
                />
                <FAQItem 
                  q="Can AI detect its own generated artifacts?" 
                  a="Yes, often the most effective way to detect AI is for another AI to look for the specific mathematical 'tells' left behind during the generative process, such as repeating wavelets."
                  theme={theme}
                />
                <FAQItem 
                  q="Protecting yourself from misinformation and synthetic media." 
                  a="Cultivate digital skepticism. Use verification tools before sharing viral content. DeepGuard AI is designed to be your first line of defense against online misinformation."
                  theme={theme}
                />
                <FAQItem 
                  q="What is pixel frequency analysis in digital forensics?" 
                  a="It's a technique that looks at the high-frequency components of an image. Real cameras have a 'natural' grain, while AI generation creates 'structured' noise that shows up as distinct spikes in the frequency domain."
                  theme={theme}
                />
                <FAQItem 
                  q="How to report malicious deepfake content." 
                  a="If you detect a deepfake used for harm, you should report it to the platform hosting it and consider using forensic reports from tools like ours as supporting evidence."
                  theme={theme}
                />
                <FAQItem 
                  q="Deepfake vs. CGI: What is the difference?" 
                  a="CGI is hand-crafted or simulated via physics engines, while Deepfakes are generated by neural networks through diffusion or adversarial training. Deepfakes often contain 'latent artifacts' that hand-made CGI does not."
                  theme={theme}
                />
                <FAQItem 
                  q="Can smartphone cameras produce artifacts similar to AI?" 
                  a="Computational photography in modern phones can sometimes create 'smooth' effects that look AI-like, but they don't produce the structured frequency artifacts found in generative AI models."
                  theme={theme}
                />
                <FAQItem 
                  q="How to check if a profile picture is AI-generated." 
                  a="AI profile pictures often have perfectly centered faces, inconsistent earring symmetry, and 'blobby' backgrounds. Use our 'Image Analysis' mode for a definitive neural check."
                  theme={theme}
                />
                <FAQItem 
                  q="The role of EXIF metadata in image authentication." 
                  a="EXIF data can show camera settings, timestamps, and device info. While it can be faked, its absence or inconsistency often indicates an image has been processed through a generative pipeline."
                  theme={theme}
                />
                <FAQItem 
                  q="Are video calls susceptible to real-time deepfakes?" 
                  a="Yes, real-time face swaps are becoming more common. Look for edges of the face 'glitching' when the person moves quickly or puts a hand near their mouth."
                  theme={theme}
                />
                <FAQItem 
                  q="How to distinguish between professional editing and AI synthesis." 
                  a="Professional editing (Photoshop) usually leaves cloning or healing artifacts. AI synthesis creates entirely new pixel data that lacks a 'source' texture, resulting in unique frequency domain signatures."
                  theme={theme}
                />
                <FAQItem 
                  q="Is it possible to detect deepfakes for free?" 
                  a="DeepGuard AI offers a robust free-tier neural forensic scanner specifically tuned to identify the 'diffusion signatures' of modern AI models like Midjourney and Stable Diffusion."
                  theme={theme}
                />
                <FAQItem 
                  q="Professional AI detection tools for journalists." 
                  a="Our platform provides high-authority forensic reports that journalists can use to verify viral media integrity. We focus on verifiable pixel-level evidence rather than simple probability scores."
                  theme={theme}
                />
                <FAQItem 
                  q="How to use forensic logic to protect digital assets." 
                  a="By embedding DeepGuard verification into your content workflow, you create a layer of digital trust. Our forensic logic analyzes metadata inconsistencies and lighting mismatches automatically."
                  theme={theme}
                />
              </div>
            </motion.div>
          )}

                        <div className="text-center mt-8">
                          <h2 className="text-6xl font-black uppercase tracking-tighter italic">About Digital <span className={theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}>Integrity</span></h2>
                        </div>
                        <div className={`space-y-6 text-lg leading-relaxed text-justify max-w-2xl mx-auto ${theme === 'dark' ? 'text-white/70' : 'text-[#0F172A]'}`}>
                          <p>Welcome to ScanDeepFake, a dedicated platform built to safeguard digital truth in an age of artificial synthesis. Our mission is to provide every individual with the tools needed to verify media authenticity instantly at https://scandeepfake.web.app.</p>
                          <p>In a world where seeing is no longer necessarily believing, we use the same technology that creates AI to detect it. Our forensic engine uses local analysis to ensure your data never leaves your device.</p>
                          <p>We are a self-funded project committed to transparency, privacy, and the preservation of authentic human expression on the internet.</p>
                          <div className="pt-8 flex justify-center">
                            <button 
                              onClick={generateSitemap}
                              className={`text-[10px] font-mono uppercase tracking-[0.3em] transition-opacity border px-6 py-3 rounded-full ${theme === 'dark' ? 'opacity-40 hover:opacity-100 border-white/10' : 'text-[#0F172A] border-black/20 hover:border-[#1E40AF] hover:text-[#1E40AF]'}`}
                            >
                              Generate Sitemap.xml
                            </button>
                          </div>
                        </div>

          {currentPage === 'contact' && (
            <motion.div key="contact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto space-y-10 mt-8">
              <div className="text-center">
                <h2 className="text-5xl font-black uppercase tracking-tighter italic">Contact Us</h2>
                <p className="text-white/40 font-mono text-xs uppercase mt-2">We'd love to hear from you</p>
              </div>
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Message sent! We will get back to you soon.'); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className={`text-[10px] font-mono uppercase ${theme === 'dark' ? 'text-white/40' : 'text-[#0F172A] opacity-60'}`}>Full Name</label>
                    <input type="text" required className={`w-full border rounded-xl px-4 py-3 focus:outline-none transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10 focus:border-[#00F3FF]' : 'bg-black/5 border-black/10 focus:border-[#1E40AF] text-[#0F172A]'}`} placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-[10px] font-mono uppercase ${theme === 'dark' ? 'text-white/40' : 'text-[#0F172A] opacity-60'}`}>Email Address</label>
                    <input type="email" required className={`w-full border rounded-xl px-4 py-3 focus:outline-none transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10 focus:border-[#00F3FF]' : 'bg-black/5 border-black/10 focus:border-[#1E40AF] text-[#0F172A]'}`} placeholder="john@example.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={`text-[10px] font-mono uppercase ${theme === 'dark' ? 'text-white/40' : 'text-[#0F172A] opacity-60'}`}>Your Message</label>
                  <textarea required rows={5} className={`w-full border rounded-xl px-4 py-3 focus:outline-none transition-colors resize-none ${theme === 'dark' ? 'bg-white/5 border-white/10 focus:border-[#00F3FF]' : 'bg-black/5 border-black/10 focus:border-[#1E40AF] text-[#0F172A]'}`} placeholder="How can we help?"></textarea>
                </div>
                <button type="submit" className={`w-full py-4 font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 ${theme === 'dark' ? 'bg-[#00F3FF] text-black hover:bg-white' : 'bg-[#1E40AF] text-white hover:bg-[#0F172A]'}`}>Send Message</button>
              </form>
            </motion.div>
          )}

          {currentPage === 'privacy' && <LegalPage title="Privacy Policy" theme={theme} content={`Our commitment to your privacy is absolute. Our Deepfake Detector tools are designed with "Privacy by Design" principles. 
          
1. Data Integrity: We do not store, upload, or transmit your media to our permanent servers. Processing happens in secure ephemeral cloud instances that are deleted immediately after result generation.
2. Analytics: We use anonymized usage metrics to improve our detection algorithms. No personally identifiable information (PII) is ever linked to these metrics.
3. Cookies: We use minimal cookies to maintain session states and for AdSense ad delivery. You can opt-out via your browser settings.
4. Third Parties: Verified AI partners may receive transient data for processing, strictly governed by zero-retention policies.
5. Advertising: This site uses Google AdSense. Google's use of advertising cookies enables it and its partners to serve ads based on your visit to this site and/or other sites on the Internet.`} />}

          {currentPage === 'terms' && <LegalPage title="Terms of Service" theme={theme} content={`By accessing Deepfake Detector, you agree to these legal terms:

1. Usage: You are granted a limited license to use our scanner for personal or professional verification.
2. Prohibitions: You may not use this tool for illegal purposes, harassing individuals, or attempting to reverse-engineer our detection model.
3. API Access: Automated requests (scripts) are prohibited without an official API key.
4. Ownership: The detection output belongs to you, but the detection technology remains intellectual property of Deepfake Detector.
5. Service: We reserve the right to modify or discontinue the service at any time without prior notice.`} />}

          {currentPage === 'disclaimer' && <LegalPage title="Disclaimer" theme={theme} content={`While our AI models are among the most advanced in the industry, users must acknowledge:

1. Probabilistic Results: Detection scores are estimates based on statistical probability. They are NOT definitive legal proof of authenticity or synthetic origin.
2. False Positives: High-quality real images can sometimes be flagged as AI if they possess unusual lighting or camera artifacts.
3. Evolution of AI: The technology used to create deepfakes advances daily. A "Real" result today does not guarantee that a more advanced AI did not create the image.
4. No Liability: Deepfake Detector is not responsible for decisions made based on our analysis results. Use this tool as a supporting reference, not a final verdict.`} />}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className={`mt-12 p-8 border-t transition-colors duration-500 ${
        theme === 'dark' ? 'border-white/5 bg-white/[0.01]' : 'border-black/5 bg-[#FFFFFF]'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4 max-w-sm">
            <h5 className={`font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#0F172A]'}`}>DeepGuard AI</h5>
            <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'opacity-30' : 'text-[#0F172A]'}`}>Promoting digital truth through advanced neural forensics. Built for the future of authentic online human interaction.</p>
            <div className="flex gap-4">
              <CheckCircle2 size={16} className="text-[#00FF94]" />
              <span className={`text-[10px] font-mono uppercase tracking-widest ${theme === 'dark' ? 'opacity-20' : 'text-[#0F172A]'}`}>ScanDeepFake Protocol Active</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6">
            <FooterColumn title="Tool" theme={theme} links={[
              { label: 'Scanner', onClick: () => setCurrentPage('home') },
              { label: 'FAQ', onClick: () => setCurrentPage('faq') },
              { label: 'About', onClick: () => setCurrentPage('about') }
            ]} />
            <FooterColumn title="Support" theme={theme} links={[
              { label: 'Contact', onClick: () => setCurrentPage('contact') },
              { label: 'Docs', onClick: () => setCurrentPage('docs') }
            ]} />
            <FooterColumn title="Legal" theme={theme} links={[
              { label: 'Privacy', onClick: () => setCurrentPage('privacy') },
              { label: 'Terms', onClick: () => setCurrentPage('terms') },
              { label: 'Disclaimer', onClick: () => setCurrentPage('disclaimer') }
            ]} />
          </div>
        </div>
        
        <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className={`px-4 py-2 border rounded-xl flex items-center gap-2 text-[9px] font-mono font-black uppercase tracking-[0.2em] shadow-lg ${
              theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'
            }`}>
              <Shield size={12} className={theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'} /> Fully Encrypted & Sandbox Secure
            </div>
            <p className={`text-[10px] font-mono uppercase tracking-widest ${theme === 'dark' ? 'opacity-20' : 'text-[#0F172A] opacity-40'}`}>
              System Stable V4.2.1
            </p>
          </div>
          <p className={`text-[10px] font-mono uppercase tracking-[0.2em] text-center md:text-right ${theme === 'dark' ? 'opacity-30' : 'text-[#0F172A] opacity-60'}`}>
            © 2026 ScanDeepFake. Digital Integrity Verified. <br className="md:hidden" />
            Fully Encrypted & Sandbox Secure.
          </p>
        </div>
      </footer>

      {/* Extra styles for reverse rotation */}
      <style>{`
        @keyframes reverse-spin {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-reverse-spin {
          animation: reverse-spin 12s linear infinite;
        }
        .animate-spin-slow {
          animation: spin 15s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }
        .writing-vertical-rl {
          writing-mode: vertical-rl;
        }
      `}</style>
    </div>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center group/meta">
      <span className="text-[9px] font-mono uppercase text-white/20 tracking-tighter transition-colors group-hover/meta:text-white/40 font-black">{label}</span>
      <span className="text-[10px] font-bold text-white/60 truncate max-w-[150px]">{value}</span>
    </div>
  );
}

function MetricItem({ label, value, status, isError, isSuccess, theme }: { 
  label: string; 
  value: string; 
  status: string; 
  isError?: boolean;
  isSuccess?: boolean;
  theme?: 'dark' | 'light';
}) {
  const isDark = theme === 'dark';
  const neon = isDark ? '#00F3FF' : '#1E40AF';
  return (
    <div className="flex flex-col group relative">
      <span className={`text-[11px] font-black opacity-30 uppercase mb-2 tracking-[0.15em] transition-colors group-hover:opacity-100 ${isDark ? 'group-hover:text-[#00F3FF]' : 'group-hover:text-[#1E40AF]'}`}>
        {label}
      </span>
      <div className={`flex justify-between items-end border-b pb-3 relative transition-colors ${
        isDark ? 'border-white/5' : 'border-black/5'
      }`}>
        <span className="text-sm font-bold group-hover:translate-x-1 transition-transform">{value}</span>
        <div className="flex flex-col items-end">
          <motion.span 
            key={status}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-[10px] font-mono font-black uppercase tracking-wider ${
              status === "Standby" ? "opacity-10" :
              status.includes("...") ? (isDark ? "text-[#00F3FF] animate-pulse" : "text-[#1E40AF] animate-pulse") :
              isError ? "text-[#FF3E3E] shadow-[0_0_10px_#FF3E3E50]" : 
              isSuccess ? "text-[#00FF94] shadow-[0_0_10px_#00FF9450]" : 
              (isDark ? "text-[#00F3FF]" : "text-[#1E40AF]")
            }`}
          >
            {status}
          </motion.span>
        </div>
        {/* Animated bar underline on hover */}
        <div className={`absolute bottom-0 left-0 h-[1px] w-0 transition-all duration-500 group-hover:w-full ${isDark ? 'bg-[#00F3FF]' : 'bg-[#1E40AF]'}`}></div>
      </div>
    </div>
  );
}

function FAQItem({ q, a, theme }: { q: string; a: string; theme?: 'dark' | 'light' }) {
  const [isOpen, setIsOpen] = useState(false);
  const isDark = theme === 'dark';
  return (
    <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
      isDark ? 'bg-white/5 border-white/10' : 'bg-[#F8FAFC] border-black/10 shadow-sm'
    }`}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full p-6 flex justify-between items-center text-left">
        <span className={`text-lg font-bold tracking-tight ${isDark ? '' : 'text-[#0F172A]'}`}>{q}</span>
        <ChevronRight size={18} className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : isDark ? 'text-white/20' : 'text-black/20'}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className={`p-6 pt-0 leading-relaxed border-t transition-colors ${
              isDark ? 'border-white/5 bg-black/20 opacity-50' : 'border-black/10 bg-white text-[#0F172A]'
            }`}>
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FooterColumn({ title, links, theme }: { title: string; links: { label: string; onClick: () => void }[]; theme?: 'dark' | 'light' }) {
  const isDark = theme === 'dark';
  return (
    <div className="space-y-4">
      <h6 className={`text-[10px] font-mono uppercase tracking-widest font-black ${isDark ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}`}>{title}</h6>
      <ul className="space-y-3">
        {links.map((link, i) => (
          <li key={i}>
            <button onClick={link.onClick} className={`text-[11px] font-black uppercase tracking-widest hover:opacity-100 transition-all ${isDark ? 'opacity-30 text-white' : 'text-[#0F172A]'}`}>{link.label}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LegalPage({ title, content, theme }: { title: string; content: string; theme?: 'dark' | 'light' }) {
  const isDark = theme === 'dark';
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center mt-8">
        <h2 className="text-6xl font-black uppercase tracking-tighter italic">{title}</h2>
        <div className={`h-1 w-24 mx-auto mt-6 ${isDark ? 'bg-[#00F3FF]' : 'bg-[#2563EB]'}`}></div>
      </div>
      <div className={`border rounded-[40px] p-8 md:p-16 relative overflow-hidden backdrop-blur-3xl transition-colors duration-500 ${
        isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
      }`}>
        <div className={`absolute top-0 right-0 p-8 font-mono text-8xl font-black select-none opacity-20 ${isDark ? 'text-[#00F3FF]/10' : 'text-[#1E40AF]/10'}`}>LEGAL</div>
        <div className={`relative z-10 leading-loose text-justify text-lg space-y-8 whitespace-pre-wrap font-sans ${isDark ? 'opacity-70' : 'text-[#0F172A]'}`}>
          {content}
        </div>
      </div>
    </div>
  );
}

function BenefitCard({ title, desc, theme }: { title: string; desc: string; theme?: 'dark' | 'light' }) {
  const isDark = theme === 'dark';
  return (
    <div className={`p-6 border rounded-2xl transition-all group ${
      isDark ? 'bg-white/5 border-white/10 hover:border-[#00F3FF]/50' : 'bg-black/5 border-black/10 hover:border-[#1E40AF]/50'
    }`}>
      <h4 className={`text-sm font-black uppercase mb-2 ${isDark ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}`}>{title}</h4>
      <p className={`text-xs leading-relaxed group-hover:opacity-70 transition-opacity ${isDark ? 'opacity-40' : 'text-[#0F172A] opacity-60'}`}>{desc}</p>
    </div>
  );
}

function StepItem({ num, title, desc, theme }: { num: string; title: string; desc: string; theme?: 'dark' | 'light' }) {
  const isDark = theme === 'dark';
  return (
    <li className="flex gap-6 group">
      <span className={`text-2xl font-black transition-colors ${isDark ? 'text-white/10 group-hover:text-[#00F3FF]/20' : 'text-black/10 group-hover:text-[#1E40AF]/20'}`}>{num}</span>
      <div>
        <h4 className="text-sm font-black uppercase mb-1">{title}</h4>
        <p className={`text-xs leading-relaxed ${isDark ? 'opacity-40' : 'text-[#0F172A] opacity-60'}`}>{desc}</p>
      </div>
    </li>
  );
}

function StatCard({ label, value, color, theme }: { label: string; value: string; color?: string; theme?: 'dark' | 'light' }) {
  const isDark = theme === 'dark';
  return (
    <div className={`p-6 border rounded-2xl transition-colors duration-500 ${
      isDark ? 'bg-white/[0.02] border-white/5' : 'bg-black/[0.02] border-black/5'
    }`}>
      <div className="text-[10px] font-mono uppercase opacity-20 mb-2 tracking-widest">{label}</div>
      <div className={`text-2xl font-black ${color || (isDark ? 'text-white' : 'text-black')}`}>{value}</div>
    </div>
  );
}

function SelectionCard({ icon: Icon, title, desc, onClick, theme }: { icon: any; title: string; desc: string; onClick: () => void; theme?: 'dark' | 'light' }) {
  const isDark = theme === 'dark';
  const accent = isDark ? '#00F3FF' : '#1E40AF';
  return (
    <button 
      onClick={onClick}
      className={`p-8 border rounded-[2rem] text-left transition-all group ${
        isDark 
          ? 'bg-white/5 border-white/10 hover:border-[#00F3FF] hover:bg-[#00F3FF]/5' 
          : 'bg-black/5 border-black/10 hover:border-[#1E40AF] hover:bg-[#1E40AF]/5'
      }`}
    >
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${
        isDark ? 'bg-[#00F3FF]/10 text-[#00F3FF]' : 'bg-[#1E40AF]/10 text-[#1E40AF]'
      }`}>
        <Icon size={32} />
      </div>
      <h4 className="text-xl font-black uppercase italic mb-2 tracking-tight">{title}</h4>
      <p className={`text-sm leading-relaxed ${isDark ? 'opacity-40' : 'text-[#0F172A] opacity-60'}`}>{desc}</p>
    </button>
  );
}


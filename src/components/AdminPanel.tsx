import React, { useState, useEffect, useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
  X,
  Save,
  Trash2,
  Plus,
  LogOut,
  ChevronRight,
  Settings,
  Globe,
  FileText,
  Image as ImageIcon,
  Sun,
  Moon,
  HelpCircle,
  Shield,
  Layout,
  Megaphone,
  Download,
  Copy,
  Check,
  ExternalLink,
  UploadCloud,
  AlertCircle,
  Search,
  Sparkles,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import {
  ADMIN_EMAIL,
  type AppConfig,
  type Post,
  deletePostFromFirestore,
  isVerifiedAdmin,
  saveConfigToFirestore,
  savePostToFirestore,
  signInAdminWithGoogle,
  signOutAdmin,
  slugifyPostId,
} from '../lib/firebase';
import { DEFAULT_DOMAIN, generateSitemapXml, getPagePath } from '../lib/seo';
import { optimizeImageUrl } from '../lib/image';

interface AdminPanelProps {
  onClose: () => void;
  posts: Post[];
  firestorePostIds: Set<string>;
  config: AppConfig | null;
  user: User | null;
  initialMode?: 'list' | 'create' | 'edit';
  initialPost?: Post | null;
  onNavigate?: (page: 'blog', postId?: string) => void;
}

const CURATED_COVER_IMAGES = [
  {
    label: 'Cyber Matrix',
    url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b',
  },
  {
    label: 'Neural Core',
    url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995',
  },
  {
    label: 'Data Vault',
    url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3',
  },
  {
    label: 'Audio Wave',
    url: 'https://images.unsplash.com/photo-1589254065878-42c9da997008',
  },
];

const CATEGORIES = [
  'Daily Brief',
  'Deepfake Alert',
  'Forensic Guide',
  'AI News',
  'Security',
  'Case Study',
];

export default function AdminPanel({
  onClose,
  posts,
  firestorePostIds,
  config: externalConfig,
  user,
  initialMode = 'list',
  initialPost = null,
  onNavigate,
}: AdminPanelProps) {
  const isAdmin = isVerifiedAdmin(user);

  const [view, setView] = useState<'list' | 'edit'>(
    initialMode === 'create' || initialMode === 'edit' ? 'edit' : 'list'
  );
  const [mainTab, setMainTab] = useState<
    'posts' | 'faqs' | 'settings' | 'legal' | 'ads' | 'sitemap'
  >('posts');
  const [editingPost, setEditingPost] = useState<Post | null>(() => {
    if (initialMode === 'edit' && initialPost) {
      return { ...initialPost };
    }
    if (initialMode === 'create') {
      return createBlankPost();
    }
    return null;
  });
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(
    initialMode === 'edit'
  );
  const [config, setConfig] = useState<AppConfig | null>(externalConfig);
  const [sidebarTab, setSidebarTab] = useState<'settings' | 'seo'>('settings');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedSitemap, setCopiedSitemap] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (externalConfig) {
      setConfig(externalConfig);
    }
  }, [externalConfig]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  function createBlankPost(): Post {
    const todayFormatted = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
    const dateStamp = new Date().toISOString().split('T')[0];
    return {
      id: `daily-report-${dateStamp}-${Math.floor(Math.random() * 900 + 100)}`,
      title: '',
      desc: '',
      date: todayFormatted,
      imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b',
      alt: 'ScanDeepFake AI forensic report cover',
      content: '<h2>Key Forensic Findings</h2><p>Write your daily forensic analysis or news update here...</p>',
      category: 'Daily Brief',
      metaDesc: '',
      author: 'ScanDeepFake Editorial',
      published: true,
    };
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  const transformDriveUrl = (url: string) => {
    if (!url) return url;
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /id=([a-zA-Z0-9_-]+)/,
      /\/open\?id=([a-zA-Z0-9_-]+)/,
      /\/d\/([a-zA-Z0-9_-]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://lh3.googleusercontent.com/d/${match[1]}`;
      }
    }
    return url;
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    try {
      const result = await signInAdminWithGoogle();
      if (!isVerifiedAdmin(result.user)) {
        showToast(
          'error',
          `Signed in as ${result.user.email || 'unknown'}, but only ${ADMIN_EMAIL} is authorized to publish.`
        );
      } else {
        showToast('success', 'Authorized as ScanDeepFake Editor.');
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      showToast('error', err?.message || 'Google Sign-In failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOutAdmin();
    showToast('success', 'Signed out of Author Studio.');
  };

  const handleEdit = (post: Post) => {
    setEditingPost({ ...post });
    setIsSlugManuallyEdited(true);
    setView('edit');
  };

  const handleCreateNew = () => {
    setEditingPost(createBlankPost());
    setIsSlugManuallyEdited(false);
    setView('edit');
  };

  const handleTitleChange = (title: string) => {
    setEditingPost((prev) => {
      if (!prev) return null;
      const next: Post = { ...prev, title };
      if (!isSlugManuallyEdited && !firestorePostIds.has(prev.id)) {
        const autoSlug = slugifyPostId(title);
        if (autoSlug && title.trim().length > 2) {
          next.id = autoSlug;
        }
      }
      return next;
    });
  };

  const handleDelete = async (postId: string) => {
    setSaving(true);
    try {
      await deletePostFromFirestore(postId);
      setConfirmDeleteId(null);
      showToast('success', 'Article deleted from Firestore.');
    } catch (err: any) {
      console.error(err);
      showToast('error', err?.message || 'Failed to delete article.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!editingPost) return;
    if (!editingPost.title.trim()) {
      showToast('error', 'Please enter an article title before publishing.');
      return;
    }
    if (!editingPost.content.trim() || editingPost.content === '<p><br></p>') {
      showToast('error', 'Article body cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      const slug = slugifyPostId(editingPost.id);
      const existsInFirestore = firestorePostIds.has(slug);
      await savePostToFirestore({ ...editingPost, id: slug }, existsInFirestore);
      showToast('success', 'Article published live to Firestore!');
      setView('list');
      setEditingPost(null);
    } catch (err: any) {
      console.error(err);
      showToast('error', err?.message || 'Failed to publish article.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await saveConfigToFirestore(config);
      showToast('success', 'Site configuration saved to Firestore.');
    } catch (err: any) {
      console.error(err);
      showToast('error', err?.message || 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  const unseededPosts = useMemo(
    () => posts.filter((p) => !firestorePostIds.has(p.id)),
    [posts, firestorePostIds]
  );

  const handleSeedStarterPosts = async () => {
    if (unseededPosts.length === 0) return;
    setSeeding(true);
    try {
      for (const post of unseededPosts) {
        await savePostToFirestore(post, false);
      }
      showToast(
        'success',
        `Imported ${unseededPosts.length} starter article(s) into Firestore.`
      );
    } catch (err: any) {
      console.error(err);
      showToast('error', err?.message || 'Failed to import starter articles.');
    } finally {
      setSeeding(false);
    }
  };

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
    );
  }, [posts, searchQuery]);

  const liveSitemapXml = useMemo(
    () =>
      generateSitemapXml(
        posts,
        config?.settings?.domain || DEFAULT_DOMAIN
      ),
    [posts, config?.settings?.domain]
  );

  const handleDownloadSitemap = () => {
    const blob = new Blob([liveSitemapXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sitemap.xml';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySitemap = async () => {
    try {
      await navigator.clipboard.writeText(liveSitemapXml);
      setCopiedSitemap(true);
      setTimeout(() => setCopiedSitemap(false), 2000);
    } catch {
      showToast('error', 'Clipboard copy failed.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-[1200] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl">
        <div className="max-w-md w-full bg-[#0F172A] border border-white/10 p-8 rounded-[32px] space-y-6 shadow-2xl">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#00F3FF]/10 border border-[#00F3FF]/30 text-[#00F3FF] flex items-center justify-center mx-auto">
              <Sparkles size={26} />
            </div>
            <h2 className="text-2xl font-black uppercase italic text-white">
              Author <span className="text-[#00F3FF]">Studio</span>
            </h2>
            <p className="text-white/60 text-xs leading-relaxed">
              Sign in with your verified Google account (
              <span className="text-[#00F3FF] font-mono">{ADMIN_EMAIL}</span>)
              to add, edit, and publish daily blog articles directly to
              Firestore.
            </p>
          </div>

          {user && !isAdmin && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-3">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                Signed in as <strong className="text-white">{user.email}</strong>.
                Please switch to <strong className="text-white">{ADMIN_EMAIL}</strong> to edit articles.
              </div>
            </div>
          )}

          {toast && (
            <div
              className={`p-3 rounded-xl text-xs font-medium ${
                toast.type === 'error'
                  ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {toast.message}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={authLoading}
              className="w-full py-4 bg-[#00F3FF] text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:opacity-95 active:scale-95 transition-all shadow-[0_0_25px_rgba(0,243,255,0.25)] disabled:opacity-50"
            >
              {authLoading ? 'Authenticating...' : 'Continue with Google'}
            </button>
            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-3 bg-white/5 border border-white/10 text-white/70 text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all"
              >
                Sign Out Current Account
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-white/40 text-[11px] font-black uppercase tracking-[0.25em] hover:text-white transition-all"
            >
              Back to Webapp
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'posts', label: 'Daily Articles', icon: FileText },
    { id: 'sitemap', label: 'Sitemap XML', icon: Globe },
    { id: 'faqs', label: 'FAQs', icon: HelpCircle },
    { id: 'settings', label: 'Identity & SEO', icon: Shield },
    { id: 'legal', label: 'Legal', icon: Layout },
    { id: 'ads', label: 'Ads', icon: Megaphone },
  ] as const;

  return (
    <div
      className={`fixed inset-0 z-[1200] flex flex-col font-sans transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-[#0A0F1E] text-white'
          : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}
    >
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[1500] px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-400/40 text-emerald-200'
              : 'bg-red-950/95 border-red-400/40 text-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <Check size={15} className="text-emerald-400" />
          ) : (
            <AlertCircle size={15} className="text-red-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[1400] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-[#0F172A] border border-white/10 rounded-3xl p-6 space-y-5 text-white shadow-2xl">
            <h3 className="text-lg font-black uppercase tracking-tight">
              Delete Article?
            </h3>
            <p className="text-xs text-white/60 leading-relaxed">
              This will permanently remove{' '}
              <span className="font-mono text-[#00F3FF]">{confirmDeleteId}</span>{' '}
              from Firestore.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-wider hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-wider hover:bg-red-500 disabled:opacity-50"
              >
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header
        className={`h-16 border-b flex items-center justify-between px-4 md:px-6 ${
          theme === 'dark'
            ? 'bg-[#0F172A] border-white/10'
            : 'bg-white border-black/5 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              theme === 'dark' ? 'bg-[#00F3FF]' : 'bg-[#1E40AF]'
            }`}
          >
            <Settings
              size={18}
              className={theme === 'dark' ? 'text-black' : 'text-white'}
            />
          </div>
          <h1 className="text-sm md:text-base font-black uppercase tracking-tighter italic whitespace-nowrap">
            ScanDeepFake{' '}
            <span
              className={
                theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'
              }
            >
              Author Studio
            </span>
          </h1>

          <div className="h-6 w-px bg-white/10 mx-2 hidden lg:block" />

          <nav className="hidden lg:flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setMainTab(tab.id);
                  setView('list');
                }}
                className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  mainTab === tab.id
                    ? theme === 'dark'
                      ? 'bg-[#00F3FF] text-black'
                      : 'bg-[#1E40AF] text-white'
                    : theme === 'dark'
                      ? 'text-white/50 hover:text-white hover:bg-white/5'
                      : 'text-black/50 hover:text-black hover:bg-black/5'
                }`}
              >
                <tab.icon size={12} />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden md:inline-block text-[11px] font-mono opacity-50 mr-2">
            {user?.email}
          </span>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle studio theme"
            className={`p-2 rounded-xl border transition-all ${
              theme === 'dark'
                ? 'bg-white/5 border-white/15 text-white hover:bg-white/15'
                : 'bg-black/5 border-black/10 text-black hover:bg-black/10'
            }`}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={14} />
          </button>
          <button
            onClick={onClose}
            title="Close studio"
            className={`p-2 rounded-xl transition-all ${
              theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Mobile Tab Strip */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto px-4 py-2 border-b border-white/10 bg-black/20">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setMainTab(tab.id);
              setView('list');
            }}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
              mainTab === tab.id
                ? 'bg-[#00F3FF] text-black'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <tab.icon size={11} />
            {tab.label}
          </button>
        ))}
      </div>

      {view === 'list' ? (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
          {mainTab === 'posts' && (
            <>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">
                    Daily Blog{' '}
                    <span
                      className={
                        theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'
                      }
                    >
                      Articles
                    </span>
                  </h2>
                  <p className="opacity-50 font-mono text-xs uppercase tracking-widest">
                    {firestorePostIds.size} saved in Firestore · {posts.length}{' '}
                    total live
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {unseededPosts.length > 0 && (
                    <button
                      onClick={handleSeedStarterPosts}
                      disabled={seeding}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#00F3FF]/30 text-[#00F3FF] text-xs font-black uppercase tracking-wider hover:bg-[#00F3FF]/10 transition-all disabled:opacity-50"
                    >
                      <UploadCloud size={15} />
                      {seeding
                        ? 'Importing...'
                        : `Sync ${unseededPosts.length} Starter Posts`}
                    </button>
                  )}
                  <button
                    onClick={handleCreateNew}
                    className={`flex items-center gap-2 px-6 py-3 font-black uppercase text-xs tracking-widest rounded-xl hover:scale-[1.02] transition-all shadow-lg ${
                      theme === 'dark'
                        ? 'bg-[#00F3FF] text-black shadow-[#00F3FF]/20'
                        : 'bg-[#1E40AF] text-white shadow-[#1E40AF]/20'
                    }`}
                  >
                    <Plus size={16} />
                    Write Daily Article
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
                  theme === 'dark'
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white border-black/10'
                }`}
              >
                <Search size={16} className="opacity-40" />
                <input
                  type="text"
                  placeholder="Search articles by title, category, or slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none"
                />
              </div>

              <div className="grid gap-4">
                {filteredPosts.map((post) => {
                  const isSynced = firestorePostIds.has(post.id);
                  return (
                    <div
                      key={post.id}
                      className={`group border p-4 md:p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                        theme === 'dark'
                          ? 'bg-white/5 border-white/10 hover:bg-white/[0.08]'
                          : 'bg-white border-black/10 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1 w-full overflow-hidden">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-black/40 flex-shrink-0">
                          <img
                            src={optimizeImageUrl(post.imageUrl, 320)}
                            alt={post.alt}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-1 overflow-hidden flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                isSynced
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-amber-500/15 text-amber-400'
                              }`}
                            >
                              {isSynced ? 'Firestore Live' : 'Starter Seed'}
                            </span>
                            <span className="text-[10px] font-mono opacity-50 uppercase">
                              {post.date}
                            </span>
                            <span
                              className={`text-[10px] font-mono uppercase ${
                                theme === 'dark'
                                  ? 'text-[#00F3FF]'
                                  : 'text-[#1E40AF]'
                              }`}
                            >
                              {post.category || 'General'}
                            </span>
                          </div>
                          <h3 className="text-base md:text-lg font-bold truncate">
                            {post.title}
                          </h3>
                          <div className="text-[11px] font-mono opacity-40 truncate">
                            {getPagePath('blog', post.id)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto md:justify-end">
                        {onNavigate && (
                          <a
                            href={getPagePath('blog', post.id)}
                            onClick={(e) => {
                              e.preventDefault();
                              onNavigate('blog', post.id);
                              onClose();
                            }}
                            className="p-2.5 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                            title="View live article"
                          >
                            <ExternalLink size={15} />
                          </a>
                        )}
                        <button
                          onClick={() => handleEdit(post)}
                          className={`flex-1 md:flex-none px-5 py-2.5 border font-black uppercase text-[10px] tracking-widest rounded-xl transition-all ${
                            theme === 'dark'
                              ? 'border-[#00F3FF]/30 text-[#00F3FF] hover:bg-[#00F3FF]/10'
                              : 'border-blue-600/30 text-blue-600 hover:bg-blue-600/5'
                          }`}
                        >
                          Edit Article
                        </button>
                        {isSynced && (
                          <button
                            onClick={() => setConfirmDeleteId(post.id)}
                            className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                            title="Delete from Firestore"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {mainTab === 'sitemap' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                    Sitemap &{' '}
                    <span
                      className={
                        theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'
                      }
                    >
                      Indexing
                    </span>
                  </h2>
                  <p className="opacity-50 font-mono text-xs uppercase tracking-widest">
                    Auto-generated XML for all {posts.length} articles & 9 core
                    pages
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCopySitemap}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/15 text-xs font-black uppercase tracking-wider hover:bg-white/10"
                  >
                    {copiedSitemap ? <Check size={14} /> : <Copy size={14} />}
                    {copiedSitemap ? 'Copied XML' : 'Copy XML'}
                  </button>
                  <button
                    onClick={handleDownloadSitemap}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#00F3FF] text-black text-xs font-black uppercase tracking-wider"
                  >
                    <Download size={14} />
                    Download sitemap.xml
                  </button>
                </div>
              </div>

              <div
                className={`p-5 rounded-2xl border text-xs space-y-2 ${
                  theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-white/70'
                    : 'bg-white border-black/10 text-black/70'
                }`}
              >
                <p className="font-bold">
                  Google Search Console Indexing Checklist:
                </p>
                <ul className="list-disc list-inside space-y-1 opacity-80">
                  <li>
                    All pages and blog links on the homepage now use crawlable{' '}
                    <code>&lt;a href=&quot;/?p=...&quot;&gt;</code> tags and a
                    visible Homepage Sitemap section.
                  </li>
                  <li>
                    Each page and blog article now sets its own unique{' '}
                    <code>&lt;link rel=&quot;canonical&quot;&gt;</code> and{' '}
                    <code>BlogPosting</code> JSON-LD schema.
                  </li>
                  <li>
                    Submit{' '}
                    <code>
                      {(config?.settings?.domain || DEFAULT_DOMAIN).replace(
                        /\/$/,
                        ''
                      )}
                      /sitemap.xml
                    </code>{' '}
                    in Google Search Console.
                  </li>
                </ul>
              </div>

              <pre
                className={`p-5 rounded-2xl border font-mono text-xs overflow-x-auto leading-relaxed ${
                  theme === 'dark'
                    ? 'bg-black/60 border-white/10 text-[#00F3FF]/90'
                    : 'bg-slate-900 border-black/10 text-cyan-300'
                }`}
              >
                {liveSitemapXml}
              </pre>
            </div>
          )}

          {mainTab === 'faqs' && config && (
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                    Support{' '}
                    <span
                      className={
                        theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'
                      }
                    >
                      FAQs
                    </span>
                  </h2>
                  <p className="opacity-50 font-mono text-xs uppercase tracking-widest">
                    Managing {config.faqs.length} FAQ entries
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      setConfig({
                        ...config,
                        faqs: [
                          ...config.faqs,
                          { q: 'New Question', a: 'Answer...' },
                        ],
                      })
                    }
                    className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/15 text-xs font-black uppercase tracking-wider"
                  >
                    <Plus size={15} />
                    Add FAQ
                  </button>
                  <button
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#00F3FF] text-black text-xs font-black uppercase tracking-wider disabled:opacity-50"
                  >
                    <Save size={15} />
                    {saving ? 'Saving...' : 'Save FAQs'}
                  </button>
                </div>
              </div>

              <div className="grid gap-4">
                {config.faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className={`border p-6 rounded-3xl space-y-3 ${
                      theme === 'dark'
                        ? 'bg-white/5 border-white/10'
                        : 'bg-white border-black/10 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase opacity-40">
                        FAQ #{idx + 1}
                      </span>
                      <button
                        onClick={() =>
                          setConfig({
                            ...config,
                            faqs: config.faqs.filter((_, i) => i !== idx),
                          })
                        }
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <input
                      className="w-full bg-transparent text-lg font-bold border-b border-white/10 pb-2 focus:border-[#00F3FF] outline-none"
                      value={faq.q}
                      onChange={(e) => {
                        const next = [...config.faqs];
                        next[idx] = { ...next[idx], q: e.target.value };
                        setConfig({ ...config, faqs: next });
                      }}
                    />
                    <textarea
                      className="w-full bg-transparent text-sm opacity-80 min-h-[80px] outline-none"
                      value={faq.a}
                      onChange={(e) => {
                        const next = [...config.faqs];
                        next[idx] = { ...next[idx], a: e.target.value };
                        setConfig({ ...config, faqs: next });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {mainTab === 'settings' && config && (
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                    Identity &{' '}
                    <span
                      className={
                        theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'
                      }
                    >
                      SEO Config
                    </span>
                  </h2>
                  <p className="opacity-50 font-mono text-xs uppercase tracking-widest">
                    Global site title, domain, and metadata
                  </p>
                </div>
                <button
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#00F3FF] text-black text-xs font-black uppercase tracking-wider disabled:opacity-50"
                >
                  <Save size={15} />
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>

              <div
                className={`border p-6 md:p-8 rounded-3xl space-y-6 ${
                  theme === 'dark'
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white border-black/10 shadow-sm'
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest opacity-50">
                      Website Title
                    </label>
                    <input
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-[#00F3FF]"
                      value={config.settings.siteName || ''}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          settings: {
                            ...config.settings,
                            siteName: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest opacity-50">
                      Primary Domain (Sitemap & Canonical)
                    </label>
                    <input
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-[#00F3FF]"
                      placeholder="https://scandeepfake.web.app"
                      value={config.settings.domain || ''}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          settings: {
                            ...config.settings,
                            domain: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest opacity-50">
                    Website Description (SEO)
                  </label>
                  <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#00F3FF] min-h-[100px]"
                    value={config.settings.siteDescription || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        settings: {
                          ...config.settings,
                          siteDescription: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {mainTab === 'legal' && config && (
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                    Legal{' '}
                    <span
                      className={
                        theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'
                      }
                    >
                      Pages
                    </span>
                  </h2>
                </div>
                <button
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#00F3FF] text-black text-xs font-black uppercase tracking-wider disabled:opacity-50"
                >
                  <Save size={15} />
                  {saving ? 'Saving...' : 'Update Legal Pages'}
                </button>
              </div>
              <div className="grid gap-5">
                {Object.entries(config.legal).map(([key, value]) => (
                  <div
                    key={key}
                    className={`border p-6 rounded-3xl space-y-3 ${
                      theme === 'dark'
                        ? 'bg-white/5 border-white/10'
                        : 'bg-white border-black/10 shadow-sm'
                    }`}
                  >
                    <label className="text-base font-black uppercase italic">
                      {key}
                    </label>
                    <textarea
                      className="w-full bg-transparent p-4 rounded-2xl border border-white/10 min-h-[160px] outline-none focus:border-[#00F3FF] text-sm opacity-85"
                      value={value}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          legal: { ...config.legal, [key]: e.target.value },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {mainTab === 'ads' && config && (
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                  Monetization{' '}
                  <span
                    className={
                      theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'
                    }
                  >
                    Ads
                  </span>
                </h2>
                <button
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#00F3FF] text-black text-xs font-black uppercase tracking-wider disabled:opacity-50"
                >
                  <Save size={15} />
                  {saving ? 'Saving...' : 'Save Ad Settings'}
                </button>
              </div>
              <div
                className={`border p-6 rounded-3xl space-y-6 ${
                  theme === 'dark'
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white border-black/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">Ad Delivery</h3>
                    <p className="text-xs opacity-50">
                      Enable or disable global ad slots
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setConfig({
                        ...config,
                        settings: {
                          ...config.settings,
                          adsEnabled: !config.settings.adsEnabled,
                        },
                      })
                    }
                    className={`w-14 h-7 rounded-full relative transition-all ${
                      config.settings.adsEnabled
                        ? 'bg-[#00F3FF]'
                        : 'bg-white/15'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                        config.settings.adsEnabled ? 'left-8' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase opacity-50">
                    AdSense Publisher ID
                  </label>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-sm outline-none focus:border-[#00F3FF]"
                    value={config.settings.adsClient}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        settings: {
                          ...config.settings,
                          adsClient: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Main Editor Section */}
          <div className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest opacity-50">
                <button
                  onClick={() => setView('list')}
                  className="hover:opacity-100"
                >
                  Articles List
                </button>
                <ChevronRight size={14} />
                <span className="text-[#00F3FF]">
                  {firestorePostIds.has(editingPost?.id || '')
                    ? 'Edit Article'
                    : 'New Daily Article'}
                </span>
              </div>
            </div>

            <div className="space-y-5">
              <input
                type="text"
                placeholder="Enter Daily Article Headline..."
                className={`w-full bg-transparent text-3xl md:text-5xl font-black uppercase italic tracking-tighter outline-none ${
                  theme === 'dark'
                    ? 'placeholder:text-white/20'
                    : 'placeholder:text-black/20'
                }`}
                value={editingPost?.title || ''}
                onChange={(e) => handleTitleChange(e.target.value)}
              />

              <div
                className={`border rounded-2xl overflow-hidden min-h-[420px] ${
                  theme === 'dark'
                    ? 'bg-[#0F172A] border-white/10'
                    : 'bg-white border-black/10 shadow-sm'
                }`}
              >
                <ReactQuill
                  theme="snow"
                  value={editingPost?.content || ''}
                  onChange={(val) =>
                    setEditingPost((prev) =>
                      prev ? { ...prev, content: val } : null
                    )
                  }
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['link', 'image', 'blockquote'],
                      ['clean'],
                    ],
                  }}
                  className={`quill-editor ${
                    theme === 'light' ? 'quill-light' : ''
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Sidebar Settings */}
          <div
            className={`w-full lg:w-88 border-t lg:border-t-0 lg:border-l flex flex-col ${
              theme === 'dark'
                ? 'border-white/10 bg-[#0F172A]'
                : 'border-black/10 bg-white shadow-xl'
            }`}
          >
            <div className="flex border-b border-white/10 p-2">
              <button
                onClick={() => setSidebarTab('settings')}
                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                  sidebarTab === 'settings'
                    ? theme === 'dark'
                      ? 'bg-white/10 text-white'
                      : 'bg-black/5 text-black'
                    : 'opacity-40 hover:opacity-100'
                }`}
              >
                Article Details
              </button>
              <button
                onClick={() => setSidebarTab('seo')}
                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                  sidebarTab === 'seo'
                    ? theme === 'dark'
                      ? 'bg-white/10 text-white'
                      : 'bg-black/5 text-black'
                    : 'opacity-40 hover:opacity-100'
                }`}
              >
                Cover & SEO
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {sidebarTab === 'settings' ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#00F3FF]">
                      URL Slug
                    </label>
                    <div className="flex items-center gap-2 border border-white/10 bg-white/5 rounded-xl px-3 py-2">
                      <Globe size={12} className="opacity-40" />
                      <input
                        type="text"
                        className="bg-transparent text-xs outline-none flex-1 font-mono"
                        value={editingPost?.id || ''}
                        onChange={(e) => {
                          setIsSlugManuallyEdited(true);
                          setEditingPost((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  id: e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9_-]/g, '-'),
                                }
                              : null
                          );
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#00F3FF]">
                      Category
                    </label>
                    <select
                      className="w-full border border-white/10 bg-[#0A0F1E] rounded-xl px-3 py-2 text-xs outline-none"
                      value={editingPost?.category || 'Daily Brief'}
                      onChange={(e) =>
                        setEditingPost((prev) =>
                          prev ? { ...prev, category: e.target.value } : null
                        )
                      }
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#00F3FF]">
                      Publish Date
                    </label>
                    <input
                      type="text"
                      className="w-full border border-white/10 bg-white/5 rounded-xl px-3 py-2 text-xs outline-none"
                      value={editingPost?.date || ''}
                      onChange={(e) =>
                        setEditingPost((prev) =>
                          prev ? { ...prev, date: e.target.value } : null
                        )
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#00F3FF]">
                      Author
                    </label>
                    <input
                      type="text"
                      className="w-full border border-white/10 bg-white/5 rounded-xl px-3 py-2 text-xs outline-none"
                      value={editingPost?.author || ''}
                      onChange={(e) =>
                        setEditingPost((prev) =>
                          prev ? { ...prev, author: e.target.value } : null
                        )
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#00F3FF]">
                      Card Summary (Short Excerpt)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="1-2 sentence summary for blog cards..."
                      className="w-full border border-white/10 bg-white/5 rounded-xl px-3 py-2 text-xs outline-none resize-none"
                      value={editingPost?.desc || ''}
                      onChange={(e) =>
                        setEditingPost((prev) =>
                          prev ? { ...prev, desc: e.target.value } : null
                        )
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#00F3FF]">
                      Featured Image URL
                    </label>
                    <div className="flex items-center gap-2 border border-white/10 bg-white/5 rounded-xl px-3 py-2">
                      <ImageIcon size={12} className="opacity-40" />
                      <input
                        type="text"
                        className="bg-transparent text-xs outline-none flex-1 font-mono"
                        value={editingPost?.imageUrl || ''}
                        onChange={(e) =>
                          setEditingPost((prev) =>
                            prev ? { ...prev, imageUrl: e.target.value } : null
                          )
                        }
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {CURATED_COVER_IMAGES.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() =>
                            setEditingPost((prev) =>
                              prev ? { ...prev, imageUrl: preset.url } : null
                            )
                          }
                          className="text-[10px] px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-[#00F3FF]/50"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    {editingPost?.imageUrl && (
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black/30 border border-white/10">
                        <img
                          src={optimizeImageUrl(editingPost.imageUrl, 640)}
                          alt="Preview"
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#00F3FF]">
                      Image Alt Text
                    </label>
                    <input
                      type="text"
                      className="w-full border border-white/10 bg-white/5 rounded-xl px-3 py-2 text-xs outline-none"
                      value={editingPost?.alt || ''}
                      onChange={(e) =>
                        setEditingPost((prev) =>
                          prev ? { ...prev, alt: e.target.value } : null
                        )
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#00F3FF]">
                      Google Search Meta Description
                    </label>
                    <textarea
                      rows={4}
                      placeholder="120-160 character SEO summary for Google indexing..."
                      className="w-full border border-white/10 bg-white/5 rounded-xl px-3 py-2 text-xs outline-none resize-none"
                      value={editingPost?.metaDesc || ''}
                      onChange={(e) =>
                        setEditingPost((prev) =>
                          prev ? { ...prev, metaDesc: e.target.value } : null
                        )
                      }
                    />
                    <div className="flex justify-between text-[10px] font-mono opacity-40">
                      <span>Recommended: 120-160 chars</span>
                      <span>{editingPost?.metaDesc?.length || 0}/160</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-black/20">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full flex items-center justify-center gap-2 py-4 font-black uppercase tracking-widest text-xs rounded-xl hover:scale-[1.01] active:scale-95 transition-all shadow-lg disabled:opacity-50 ${
                  theme === 'dark'
                    ? 'bg-[#00F3FF] text-black shadow-[#00F3FF]/20'
                    : 'bg-[#1E40AF] text-white shadow-[#1E40AF]/20'
                }`}
              >
                <Save size={16} />
                {saving ? 'Publishing to Firestore...' : 'Publish Live Article'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .quill-editor .ql-toolbar {
          border: none !important;
          border-bottom: 1px solid rgba(255,255,255,0.1) !important;
          background: rgba(0,0,0,0.2);
          padding: 12px !important;
        }
        .quill-editor .ql-container {
          border: none !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 16px !important;
          min-height: 380px;
        }
        .quill-editor .ql-editor {
          padding: 24px !important;
          color: rgba(255,255,255,0.88);
          min-height: 380px;
        }
        .quill-editor .ql-snow .ql-stroke { stroke: rgba(255,255,255,0.65); }
        .quill-editor .ql-snow .ql-fill { fill: rgba(255,255,255,0.65); }
        .quill-editor .ql-snow .ql-picker { color: rgba(255,255,255,0.65); }
        .quill-light .ql-toolbar { background: #f1f5f9 !important; border-bottom: 1px solid rgba(0,0,0,0.1) !important; }
        .quill-light .ql-snow .ql-stroke { stroke: #0f172a !important; }
        .quill-light .ql-snow .ql-fill { fill: #0f172a !important; }
        .quill-light .ql-snow .ql-picker { color: #0f172a !important; }
        .quill-light .ql-editor { color: #0f172a !important; }
      `}</style>
    </div>
  );
}

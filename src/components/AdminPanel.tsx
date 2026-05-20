import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { X, Save, Trash2, Plus, LogOut, ChevronRight, Settings, Globe, FileText, Image as ImageIcon, Sun, Moon, HelpCircle, Shield, Layout, MessageSquare, Megaphone } from 'lucide-react';
import { API_BASE_URL } from '../lib/config';

interface Post {
  id: string;
  title: string;
  desc: string;
  date: string;
  imageUrl: string;
  alt: string;
  content: string;
  category?: string;
  metaDesc?: string;
}

interface FAQ {
  q: string;
  a: string;
}

interface AppConfig {
  faqs: FAQ[];
  settings: {
    siteName?: string;
    siteDescription?: string;
    faviconUrl: string;
    adsEnabled: boolean;
    adsClient: string;
    customAdCode?: string;
  };
  legal: {
    privacy: string;
    terms: string;
    disclaimer: string;
    about: string;
    docs: string;
  };
}

interface AdminPanelProps {
  onClose: () => void;
  posts: Post[];
  setPosts: (posts: Post[]) => void;
}

export default function AdminPanel({ onClose, posts, setPosts }: AdminPanelProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [mainTab, setMainTab] = useState<'posts' | 'faqs' | 'settings' | 'legal' | 'ads'>('posts');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'settings' | 'seo'>('settings');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const THEME_BLUE = '#00F3FF';

  useEffect(() => {
    const fetchConfig = async () => {
      setLoadingConfig(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/config`);
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        }
      } catch (err) {
        console.error('Failed to load config', err);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  const transformDriveUrl = (url: string) => {
    if (!url) return url;
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /id=([a-zA-Z0-9_-]+)/,
      /\/open\?id=([a-zA-Z0-9_-]+)/,
      /\/d\/([a-zA-Z0-9_-]+)/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://lh3.googleusercontent.com/d/${match[1]}`;
      }
    }
    return url;
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('scandeepfake_admin_token');
    if (savedToken === 'scandeepfake2026') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (token === 'scandeepfake2026') {
      setIsLoggedIn(true);
      localStorage.setItem('scandeepfake_admin_token', token);
    } else {
      alert('Invalid security token');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('scandeepfake_admin_token');
  };

  const handleEdit = React.useCallback((post: Post) => {
    setEditingPost({ ...post });
    setTimeout(() => setView('edit'), 0);
  }, []);

  const handleCreateNew = React.useCallback(() => {
    const newPost: Post = {
      id: `post-${Date.now()}`,
      title: 'New Forensic Report',
      desc: 'Enter a short summary for the card view...',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b',
      alt: 'Forensic security visualization',
      content: '<h1>Start writing...</h1>',
      category: 'General',
      metaDesc: ''
    };
    setEditingPost(newPost);
    setTimeout(() => setView('edit'), 0);
  }, []);

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Token': 'scandeepfake2026' }
      });
      if (res.ok) {
        setPosts(posts.filter(p => p.id !== postId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!editingPost) return;

    const method = posts.some(p => p.id === editingPost.id) ? 'PUT' : 'POST';
    const url = method === 'PUT' ? `${API_BASE_URL}/api/posts/${editingPost.id}` : `${API_BASE_URL}/api/posts`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'X-Admin-Token': 'scandeepfake2026'
        },
        body: JSON.stringify(editingPost)
      });

      if (res.ok) {
        const savedPost = await res.json();
        if (method === 'POST') {
          setPosts([savedPost, ...posts]);
        } else {
          setPosts(posts.map(p => p.id === savedPost.id ? savedPost : p));
        }
        alert('Post published successfully!');
        setView('list');
        setEditingPost(null);
      } else {
        const errData = await res.json();
        alert(`Failed to save: ${errData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error or server offline');
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/config`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Admin-Token': 'scandeepfake2026'
        },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        alert('Configuration saved successfully!');
      } else {
        const errData = await res.json();
        alert(`Failed to save config: ${errData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error while saving config');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl">
        <div className="max-w-md w-full bg-[#0F172A] border border-white/10 p-8 rounded-[32px] space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black uppercase italic text-white">Command <span style={{ color: THEME_BLUE }}>Access</span></h2>
            <p className="text-white/50 text-xs font-bold tracking-widest uppercase">ScanDeepFake Digital Identity Vault</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              placeholder="ENTER SECURITY TOKEN" 
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-mono focus:outline-none focus:border-[#00F3FF] transition-all"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <button 
              type="submit"
              className="w-full py-4 bg-[#00F3FF] text-black font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(0,243,255,0.3)]"
            >Authorize System</button>
            <button type="button" onClick={onClose} className="w-full text-white/30 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white transition-all">Abort Access</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[300] flex flex-col font-sans transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0A0F1E] text-white' : 'bg-[#F8FAFC] text-[#0F172A]'}`}>
      {/* Header */}
      <header className={`h-20 md:h-16 border-b flex items-center justify-between px-4 md:px-6 transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0F172A] border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${theme === 'dark' ? 'bg-[#00F3FF]' : 'bg-[#1E40AF]'}`}>
            <Settings size={18} className={theme === 'dark' ? 'text-black' : 'text-white'} />
          </div>
          <h1 className="text-sm md:text-lg font-black uppercase tracking-tighter italic whitespace-nowrap">ScanDeepFake <span className={theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}>CMS</span></h1>
          
          <div className="h-6 w-px bg-white/10 mx-2 hidden lg:block" />
          
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { id: 'posts', label: 'Reports', icon: FileText },
              { id: 'faqs', label: 'FAQ', icon: HelpCircle },
              { id: 'settings', label: 'Identity', icon: Shield },
              { id: 'legal', label: 'Legal', icon: FileText },
              { id: 'ads', label: 'Ads', icon: Megaphone }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setMainTab(tab.id as any); setView('list'); }}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  mainTab === tab.id 
                    ? (theme === 'dark' ? 'bg-[#00F3FF] text-black' : 'bg-[#1E40AF] text-white')
                    : (theme === 'dark' ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-black/40 hover:text-black hover:bg-black/5')
                }`}
              >
                <tab.icon size={12} />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile Toolbar (Visible only on md and smaller when side menu is hidden) */}
        <div className="flex items-center gap-2">
          <div className="lg:hidden relative group">
            <button className="p-2 bg-white/5 border border-white/10 rounded-xl">
              <Layout size={18} />
            </button>
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all p-2 z-[400] scale-95 group-hover:scale-100 origin-top-right">
              {[
                { id: 'posts', label: 'Reports', icon: FileText },
                { id: 'faqs', label: 'FAQ', icon: HelpCircle },
                { id: 'settings', label: 'Identity', icon: Shield },
                { id: 'legal', label: 'Legal', icon: FileText },
                { id: 'ads', label: 'Ads', icon: Megaphone }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setMainTab(tab.id as any); setView('list'); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    mainTab === tab.id 
                      ? 'bg-[#00F3FF] text-black' 
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon size={12} />
                  {tab.label}
                </button>
              ))}
              <div className="h-px bg-white/10 my-2" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={12} />
                Logout System
              </button>
            </div>
          </div>

          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-2 rounded-xl border transition-all ${
              theme === 'dark' ? 'bg-white/5 border-white/20 text-white hover:bg-white/20' : 'bg-black/5 border-black/10 text-black hover:bg-black/10'
            }`}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-all ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {view === 'list' ? (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8 no-scrollbar">
          {loadingConfig ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-12 h-12 border-4 border-[#00F3FF] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Synchronizing Local Config...</p>
            </div>
          ) : (
            <>
              {mainTab === 'posts' && (
            <>
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Content <span className={theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}>Dashboard</span></h2>
                  <p className={`${theme === 'dark' ? 'text-white/40' : 'text-black/40'} font-mono text-xs uppercase tracking-widest`}>Managing {posts.length} published reports</p>
                </div>
                <button 
                  onClick={handleCreateNew}
                  className={`flex items-center gap-3 px-6 py-3 font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg ${
                    theme === 'dark' ? 'bg-[#00F3FF] text-black shadow-[#00F3FF]/20' : 'bg-[#1E40AF] text-white shadow-[#1E40AF]/20'
                  }`}
                >
                  <Plus size={18} />
                  New Entry
                </button>
              </div>

              <div className="grid gap-4">
                {[...posts].map((post) => (
                  <div 
                    key={post.id}
                    className={`group border p-4 md:p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                      theme === 'dark' 
                        ? 'bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-white/10' 
                        : 'bg-white border-black/5 hover:border-black/10 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-4 md:gap-6 flex-1 w-full overflow-hidden">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl overflow-hidden bg-black/40 flex-shrink-0">
                        <img 
                          src={transformDriveUrl(post.imageUrl).includes('?') ? transformDriveUrl(post.imageUrl) : `${transformDriveUrl(post.imageUrl)}?auto=format&fit=crop&q=40&w=200`} 
                          alt={post.alt} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                        />
                      </div>
                      <div className="space-y-1 overflow-hidden flex-1">
                        <h3 className={`text-base md:text-lg font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>{post.title}</h3>
                        <div className="flex gap-4 text-[10px] font-mono uppercase tracking-widest opacity-40">
                          <span>{post.date}</span>
                          <span className={theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}>{post.category || 'General'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto md:justify-end">
                      <button 
                        onClick={() => handleEdit(post)}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 md:px-4 md:py-2 border font-black uppercase text-[10px] tracking-widest rounded-xl transition-all ${
                          theme === 'dark' 
                            ? 'border-blue-400/20 text-blue-400 hover:bg-blue-400/10' 
                            : 'border-blue-600/20 text-blue-600 hover:bg-blue-600/5 shadow-sm'
                        }`}
                      >
                        Edit Report
                      </button>
                      <button 
                        onClick={() => handleDelete(post.id)}
                        className={`p-3 md:p-3 rounded-xl transition-all ${
                          theme === 'dark' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {mainTab === 'faqs' && config && (
            <div className="space-y-8">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Support <span className={theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}>Center</span></h2>
                  <p className={`${theme === 'dark' ? 'text-white/40' : 'text-black/40'} font-mono text-xs uppercase tracking-widest`}>Managing {config.faqs.length} FAQ entries</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setConfig({...config, faqs: [...config.faqs, { q: 'New Question', a: 'Answer...' }]})}
                    className={`flex items-center gap-3 px-6 py-3 font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg ${
                      theme === 'dark' ? 'bg-[#00F3FF] text-black shadow-[#00F3FF]/20' : 'bg-[#1E40AF] text-white shadow-[#1E40AF]/20'
                    }`}
                  >
                    <Plus size={18} />
                    Add FAQ
                  </button>
                  <button 
                    onClick={handleSaveConfig}
                    className={`flex items-center gap-3 px-6 py-3 font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg ${
                      theme === 'dark' ? 'bg-white/10 text-white' : 'bg-black/10 text-black'
                    }`}
                  >
                    <Save size={18} />
                    Save Changes
                  </button>
                </div>
              </div>

              <div className="grid gap-6">
                {config.faqs.map((faq, idx) => (
                  <div key={idx} className={`border p-6 rounded-3xl space-y-4 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase opacity-30">Entry #{idx + 1}</span>
                      <button 
                        onClick={() => setConfig({...config, faqs: config.faqs.filter((_, i) => i !== idx)})}
                        className="p-1 opacity-20 hover:opacity-100 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <input 
                      className="w-full bg-transparent text-xl font-bold border-b border-white/10 pb-2 focus:border-[#00F3FF] outline-none"
                      value={faq.q}
                      onChange={(e) => {
                        const newFaqs = [...config.faqs];
                        newFaqs[idx].q = e.target.value;
                        setConfig({...config, faqs: newFaqs});
                      }}
                    />
                    <textarea 
                      className="w-full bg-transparent text-sm opacity-70 min-h-[80px] outline-none"
                      value={faq.a}
                      onChange={(e) => {
                        const newFaqs = [...config.faqs];
                        newFaqs[idx].a = e.target.value;
                        setConfig({...config, faqs: newFaqs});
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {mainTab === 'settings' && config && (
            <div className="space-y-8">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">System <span className={theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}>Config</span></h2>
                  <p className={`${theme === 'dark' ? 'text-white/40' : 'text-black/40'} font-mono text-xs uppercase tracking-widest`}>Managing global application parameters</p>
                </div>
                <button 
                  onClick={handleSaveConfig}
                  className={`flex items-center gap-3 px-6 py-3 font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg ${
                    theme === 'dark' ? 'bg-[#00F3FF] text-black shadow-[#00F3FF]/20' : 'bg-[#1E40AF] text-white shadow-[#1E40AF]/20'
                  }`}
                >
                  <Save size={18} />
                  Persist Settings
                </button>
              </div>

              <div className={`border p-8 rounded-3xl space-y-8 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest opacity-40">Website Title</label>
                    <input 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-[#00F3FF]"
                      placeholder="ScanDeepFake"
                      value={config.settings.siteName || ''}
                      onChange={(e) => setConfig({...config, settings: {...config.settings, siteName: e.target.value}})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest opacity-40">System Favicon URL</label>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 p-2 overflow-hidden flex items-center justify-center shrink-0">
                        <img src={transformDriveUrl(config.settings.faviconUrl)} alt="Favicon" className="max-w-full max-h-full" />
                      </div>
                      <input 
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-[#00F3FF]"
                        value={config.settings.faviconUrl}
                        onChange={(e) => setConfig({...config, settings: {...config.settings, faviconUrl: e.target.value}})}
                      />
                    </div>
                  </div>
                </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest opacity-40">Primary Domain (for Sitemap/SEO)</label>
                    <input 
                      className={`w-full border rounded-xl px-4 py-2 outline-none focus:border-[#00F3FF] ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
                      placeholder="https://scandeepfake.web.app"
                      value={config.settings.domain || ''}
                      onChange={(e) => setConfig({...config, settings: {...config.settings, domain: e.target.value}})}
                    />
                  </div>

                  <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest opacity-40">Website Description (SEO)</label>
                  <textarea 
                    className={`w-full border rounded-xl px-4 py-3 outline-none focus:border-[#00F3FF] min-h-[100px] ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
                    placeholder="Professional deepfake detection tools..."
                    value={config.settings.siteDescription || ''}
                    onChange={(e) => setConfig({...config, settings: {...config.settings, siteDescription: e.target.value}})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest opacity-40">AdSense Publisher ID (ca-pub-xxx)</label>
                    <input 
                      className={`w-full border rounded-xl px-4 py-2 outline-none focus:border-[#00F3FF] font-mono ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
                      value={config.settings.adsClient}
                      onChange={(e) => setConfig({...config, settings: {...config.settings, adsClient: e.target.value}})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest opacity-40">System Version Tag</label>
                    <input 
                      className={`w-full border rounded-xl px-4 py-2 outline-none focus:border-[#00F3FF] ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
                      placeholder="ENGINE V4.2.1"
                      value={config.settings.version || ''}
                      onChange={(e) => setConfig({...config, settings: {...config.settings, version: e.target.value}})}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {mainTab === 'legal' && config && (
            <div className="space-y-8">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Legal <span className={theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}>Framework</span></h2>
                  <p className={`${theme === 'dark' ? 'text-white/40' : 'text-black/40'} font-mono text-xs uppercase tracking-widest`}>Authorized policy documentation</p>
                </div>
                <button 
                  onClick={handleSaveConfig}
                  className={`flex items-center gap-3 px-6 py-3 font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg ${
                    theme === 'dark' ? 'bg-[#00F3FF] text-black shadow-[#00F3FF]/20' : 'bg-[#1E40AF] text-white shadow-[#1E40AF]/20'
                  }`}
                >
                  <Save size={18} />
                  Update Policies
                </button>
              </div>

              <div className="grid gap-6">
                {Object.entries(config.legal).map(([key, value]) => (
                  <div key={key} className={`border p-8 rounded-3xl space-y-4 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                    <label className="text-lg font-black uppercase tracking-tighter italic">{key}</label>
                    <textarea 
                      className="w-full bg-transparent p-4 rounded-2xl border border-white/5 min-h-[200px] outline-none focus:border-[#00F3FF] text-sm opacity-80"
                      value={value}
                      onChange={(e) => setConfig({
                        ...config, 
                        legal: { ...config.legal, [key]: e.target.value }
                      })}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {mainTab === 'ads' && config && (
            <div className="space-y-8">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Monetization <span className={theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}>Engine</span></h2>
                  <p className={`${theme === 'dark' ? 'text-white/40' : 'text-black/40'} font-mono text-xs uppercase tracking-widest`}>Google AdSense Control System</p>
                </div>
                <button 
                  onClick={handleSaveConfig}
                  className={`flex items-center gap-3 px-6 py-3 font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg ${
                    theme === 'dark' ? 'bg-[#00F3FF] text-black shadow-[#00F3FF]/20' : 'bg-[#1E40AF] text-white shadow-[#1E40AF]/20'
                  }`}
                >
                  <Save size={18} />
                  Push to Live
                </button>
              </div>

              <div className={`border p-8 rounded-3xl space-y-8 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5">
                  <div>
                    <h3 className="text-xl font-bold">Ad Delivery State</h3>
                    <p className="text-xs opacity-50 uppercase tracking-widest font-mono">Enable or Disable global commercial placements</p>
                  </div>
                  <button 
                    onClick={() => setConfig({...config, settings: {...config.settings, adsEnabled: !config.settings.adsEnabled}})}
                    className={`w-16 h-8 rounded-full relative transition-all ${config.settings.adsEnabled ? 'bg-[#00F3FF]' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${config.settings.adsEnabled ? 'left-9' : 'left-1'}`} />
                  </button>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest opacity-40">AdSense Publisher ID (ca-pub-xxx)</label>
                  <input 
                    className={`w-full border rounded-2xl px-6 py-4 outline-none focus:border-[#00F3FF] font-mono ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`}
                    value={config.settings.adsClient}
                    onChange={(e) => setConfig({...config, settings: {...config.settings, adsClient: e.target.value}})}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest opacity-40">Custom Ad Unit / Script Code (HTML/JS)</label>
                  <textarea 
                    className={`w-full border rounded-2xl px-6 py-4 outline-none focus:border-[#00F3FF] font-mono min-h-[150px] text-xs ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`}
                    placeholder="<script>...</script> or <ins>...</ins>"
                    value={config.settings.customAdCode || ''}
                    onChange={(e) => setConfig({...config, settings: {...config.settings, customAdCode: e.target.value}})}
                  />
                  <p className="text-[10px] opacity-30 italic">Note: If custom code is provided, it will override the simple AdSense ID for standard slots.</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
    ) : (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Main Editor Section */}
          <div className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto space-y-8 no-scrollbar">
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-white/40">
              <button 
                onClick={() => setView('list')}
                className="hover:text-white"
              >Dashboard</button>
              <ChevronRight size={14} />
              <span className="text-white">Editor</span>
            </div>

            <div className="space-y-6">
              <input 
                type="text" 
                placeholder="Entry Title..." 
                className={`w-full bg-transparent text-5xl font-black uppercase italic tracking-tighter outline-none ${theme === 'dark' ? 'placeholder:text-white/10' : 'placeholder:text-black/10'}`}
                value={editingPost?.title || ''}
                onChange={(e) => setEditingPost(prev => prev ? { ...prev, title: e.target.value } : null)}
              />
              
              <div className={`border rounded-2xl overflow-hidden min-h-[400px] transition-colors ${theme === 'dark' ? 'bg-[#0F172A] border-white/10' : 'bg-white border-black/10 shadow-sm'}`}>
                <ReactQuill 
                  theme="snow"
                  value={editingPost?.content || ''}
                  onChange={(val) => setEditingPost(prev => prev ? { ...prev, content: val } : null)}
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link', 'image'],
                      ['clean']
                    ],
                  }}
                  className={`quill-editor ${theme === 'light' ? 'quill-light' : ''}`}
                />
              </div>
            </div>
          </div>

          {/* Sidebar Settings */}
          <div className={`w-full lg:w-80 border-t lg:border-t-0 lg:border-l flex flex-col transition-colors ${theme === 'dark' ? 'border-white/10 bg-[#0F172A]' : 'border-black/5 bg-white shadow-xl'}`}>
            <div className="flex border-b border-white/10 p-2">
              <button 
                onClick={() => setSidebarTab('settings')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${sidebarTab === 'settings' ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-black/5 text-black') : 'opacity-30 hover:opacity-100'}`}
              >Settings</button>
              <button 
                onClick={() => setSidebarTab('seo')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${sidebarTab === 'seo' ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-black/5 text-black') : 'opacity-30 hover:opacity-100'}`}
              >SEO & Social</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {sidebarTab === 'settings' ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}`}>Permalink Slug</label>
                    <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                      <Globe size={12} className="opacity-30" />
                      <input 
                        type="text" 
                        className="bg-transparent text-xs outline-none flex-1 font-mono"
                        value={editingPost?.id || ''}
                        onChange={(e) => setEditingPost(prev => prev ? { ...prev, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') } : null)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}`}>Category / Labels</label>
                    <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                      <FileText size={12} className="opacity-30" />
                      <input 
                        type="text" 
                        className="bg-transparent text-xs outline-none flex-1"
                        value={editingPost?.category || ''}
                        placeholder="General, Security, AI..."
                        onChange={(e) => setEditingPost(prev => prev ? { ...prev, category: e.target.value } : null)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}`}>Post Date</label>
                    <input 
                      type="text" 
                      className={`w-full border rounded-xl px-3 py-2 text-xs outline-none ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white/70' : 'bg-black/5 border-black/10 text-black/70'}`}
                      value={editingPost?.date || ''}
                      onChange={(e) => setEditingPost(prev => prev ? { ...prev, date: e.target.value } : null)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}`}>Short Description</label>
                    <textarea 
                      rows={3}
                      className={`w-full border rounded-xl px-3 py-2 text-xs outline-none resize-none ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
                      value={editingPost?.desc || ''}
                      onChange={(e) => setEditingPost(prev => prev ? { ...prev, desc: e.target.value } : null)}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}`}>Featured Image URL</label>
                    <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                      <ImageIcon size={12} className="opacity-30" />
                      <input 
                        type="text" 
                        className="bg-transparent text-xs outline-none flex-1 font-mono"
                        value={editingPost?.imageUrl || ''}
                        onChange={(e) => setEditingPost(prev => prev ? { ...prev, imageUrl: e.target.value } : null)}
                      />
                    </div>
                    {editingPost?.imageUrl && (
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black/20 border border-white/10">
                        <img 
                          src={transformDriveUrl(editingPost.imageUrl)} 
                          alt="Preview" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}`}>Meta Description</label>
                    <textarea 
                      rows={4}
                      placeholder="Snippet for search engines..."
                      className={`w-full border rounded-xl px-3 py-2 text-xs outline-none resize-none ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
                      value={editingPost?.metaDesc || ''}
                      onChange={(e) => setEditingPost(prev => prev ? { ...prev, metaDesc: e.target.value } : null)}
                    />
                    <div className="flex justify-between text-[8px] font-black uppercase opacity-20">
                      <span>{editingPost?.metaDesc?.length || 0}/160</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={`p-4 border-t ${theme === 'dark' ? 'border-white/10 bg-black/20' : 'border-black/5 bg-black/5'}`}>
              <button 
                onClick={handleSave}
                className={`w-full flex items-center justify-center gap-3 py-4 font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg ${
                  theme === 'dark' ? 'bg-[#00F3FF] text-black shadow-[#00F3FF]/20' : 'bg-[#1E40AF] text-white shadow-[#1E40AF]/20'
                }`}
              >
                <Save size={18} />
                Publish System
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
          min-height: 400px;
        }
        .quill-editor .ql-editor {
          padding: 24px !important;
          color: rgba(255,255,255,0.8);
        }
        .quill-editor .ql-snow .ql-stroke { stroke: rgba(255,255,255,0.6); }
        .quill-editor .ql-snow .ql-fill { fill: rgba(255,255,255,0.6); }
        .quill-editor .ql-snow .ql-picker { color: rgba(255,255,255,0.6); }
        .quill-editor .ql-editor h1 { font-family: 'Inter', sans-serif; font-weight: 900; text-transform: uppercase; font-style: italic; }
        
        .quill-light .ql-toolbar { background: #f1f5f9 !important; border-bottom: 1px solid rgba(0,0,0,0.1) !important; }
        .quill-light .ql-snow .ql-stroke { stroke: #0f172a !important; }
        .quill-light .ql-snow .ql-fill { fill: #0f172a !important; }
        .quill-light .ql-snow .ql-picker { color: #0f172a !important; }
        .quill-light .ql-editor { color: #0f172a !important; }
      `}</style>
    </div>
  );
}

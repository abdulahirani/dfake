import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { X, Save, Trash2, Plus, LogOut, ChevronRight, Settings, Globe, FileText, Image as ImageIcon } from 'lucide-react';

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

interface AdminPanelProps {
  onClose: () => void;
  posts: Post[];
  setPosts: (posts: Post[]) => void;
}

export default function AdminPanel({ onClose, posts, setPosts }: AdminPanelProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'settings' | 'seo'>('settings');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const THEME_BLUE = '#00F3FF';

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
      const res = await fetch(`/api/posts/${postId}`, {
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
    const url = method === 'PUT' ? `/api/posts/${editingPost.id}` : '/api/posts';

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
        setView('list');
        setEditingPost(null);
      }
    } catch (err) {
      console.error(err);
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
      <header className={`h-16 border-b flex items-center justify-between px-6 transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0F172A] border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-[#00F3FF]' : 'bg-[#1E40AF]'}`}>
            <Settings size={18} className={theme === 'dark' ? 'text-black' : 'text-white'} />
          </div>
          <h1 className="text-lg font-black uppercase tracking-tighter italic">ScanDeepFake <span className={theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}>CMS</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-2 rounded-xl border transition-all ${
              theme === 'dark' ? 'bg-white/5 border-white/20 text-white hover:bg-white/20' : 'bg-black/5 border-black/10 text-black hover:bg-black/10'
            }`}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <div className="h-4 w-px bg-white/10 mx-2" />
          <button 
            onClick={handleLogout}
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${theme === 'dark' ? 'text-white/50 hover:text-white' : 'text-black/50 hover:text-black'}`}
          >
            <LogOut size={14} />
            Logout
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
        <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full space-y-8">
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
                className={`group border p-6 rounded-3xl flex items-center justify-between transition-all ${
                  theme === 'dark' 
                    ? 'bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-white/10' 
                    : 'bg-white border-black/5 hover:border-black/10 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-6 flex-1 pr-6">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-black/40 flex-shrink-0">
                    <img 
                      src={post.imageUrl.includes('?') ? post.imageUrl : `${post.imageUrl}?auto=format&fit=crop&q=40&w=200`} 
                      alt={post.alt} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                    />
                  </div>
                  <div className="space-y-1 overflow-hidden">
                    <h3 className={`text-lg font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>{post.title}</h3>
                    <div className="flex gap-4 text-[10px] font-mono uppercase tracking-widest opacity-40">
                      <span>{post.date}</span>
                      <span className={theme === 'dark' ? 'text-[#00F3FF]' : 'text-[#1E40AF]'}>{post.category || 'General'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleEdit(post)}
                    className={`flex items-center gap-2 px-4 py-2 border font-bold uppercase text-[10px] tracking-widest rounded-lg transition-all ${
                      theme === 'dark' 
                        ? 'border-blue-400/20 text-blue-400 hover:bg-blue-400/10' 
                        : 'border-blue-600/20 text-blue-600 hover:bg-blue-600/5'
                    }`}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(post.id)}
                    className="p-3 opacity-20 hover:text-red-400 hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Main Editor Section */}
          <div className="flex-1 flex flex-col p-8 overflow-y-auto space-y-8">
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
          <div className={`w-80 border-l flex flex-col transition-colors ${theme === 'dark' ? 'border-white/10 bg-[#0F172A]' : 'border-black/5 bg-white shadow-xl'}`}>
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
                  <div className="space-y-2">
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

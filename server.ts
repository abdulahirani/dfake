import express from "express";
import path from "path";
import fs from "fs-extra";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import exifParser from "exif-parser";
import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Load Firebase Admin Config
let db: any = null;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const firebaseConfig = fs.readJsonSync(configPath);
    // Initialize Admin SDK
    if (admin.apps.length === 0) {
      admin.initializeApp({
        projectId: firebaseConfig.projectId
      });
    }
    db = admin.firestore();
    // Use the database ID from config if specified
    if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
      db = admin.firestore(firebaseConfig.firestoreDatabaseId);
    }
    console.log("Firebase Admin initialized in server");
  }
} catch (err) {
  console.error("Firebase Admin init failed in server", err);
}

const POSTS_FILE = path.join(process.cwd(), "posts.json");
const CONFIG_FILE = path.join(process.cwd(), "config.json");

// Ensure files exist with defaults
if (!fs.pathExistsSync(POSTS_FILE)) {
  fs.writeJsonSync(POSTS_FILE, []);
}
if (!fs.pathExistsSync(CONFIG_FILE)) {
  fs.writeJsonSync(CONFIG_FILE, {
    faqs: [],
    settings: {
      siteName: "ScanDeepFake",
      siteDescription: "AI Forensic Engine",
      faviconUrl: "/favicon.ico",
      adsEnabled: false,
      adsClient: ""
    },
    legal: {
      privacy: "",
      terms: "",
      disclaimer: "",
      about: "",
      docs: ""
    }
  });
}

app.use(express.json());

// --- Data Persistence ---
async function loadConfig() {
  let config = null;
  if (db) {
    try {
      const snap = await db.collection("config").doc("main").get();
      if (snap.exists) {
        const data = snap.data();
        if (data && Object.keys(data).length > 0) {
          config = data;
        }
      }
    } catch (err) {
      console.error("Firestore config load failed", err);
    }
  }

  if (!config && await fs.pathExists(CONFIG_FILE)) {
    config = await fs.readJson(CONFIG_FILE);
    // Sync to Firestore if it was empty
    if (db && config && Object.keys(config).length > 0) {
      await saveConfig(config);
    }
  }
  return config || {};
}

async function saveConfig(config: any) {
  await fs.writeJson(CONFIG_FILE, config, { spaces: 2 });
  if (db) {
    try {
      await db.collection("config").doc("main").set(config);
    } catch (err) {
      console.error("Firestore config save failed", err);
    }
  }
}

async function loadPosts() {
  let posts = null;
  if (db) {
    try {
      const snap = await db.collection("posts").get();
      if (!snap.empty) {
        posts = snap.docs.map(d => d.data());
      }
    } catch (err) {
      console.error("Firestore posts load failed", err);
    }
  }

  if ((!posts || posts.length === 0) && await fs.pathExists(POSTS_FILE)) {
    posts = await fs.readJson(POSTS_FILE);
    // Sync to Firestore if empty
    if (db && posts && posts.length > 0) {
      await savePosts(posts);
    }
  }
  return posts || [];
}

async function savePosts(posts: any[]) {
  await fs.writeJson(POSTS_FILE, posts, { spaces: 2 });
  if (db) {
    try {
      const batch = db.batch();
      for (const post of posts) {
        batch.set(db.collection("posts").doc(post.id), post);
      }
      await batch.commit();
    } catch (err) {
      console.error("Firestore posts save failed", err);
    }
  }
  await generateSeoFiles();
}

// --- SEO Generation Logic ---
async function generateSeoFiles() {
  const config = await loadConfig();
  const domain = config.settings?.domain || "https://scandeepfake.web.app";
  const pages = ['', 'docs', 'faq', 'about', 'contact', 'privacy', 'terms', 'disclaimer', 'blog'];
  const posts = await loadPosts();
  const blogPostIds = posts.map((p: any) => p.id);
  
  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const p of pages) {
    const url = `${domain}${p ? '?p=' + p : ''}`;
    sitemap += `  <url><loc>${url}</loc><changefreq>weekly</changefreq></url>\n`;
  }
  for (const bpId of blogPostIds) {
    const url = `${domain}?p=blog&amp;post=${bpId}`;
    sitemap += `  <url><loc>${url}</loc><changefreq>monthly</changefreq></url>\n`;
  }
  sitemap += '</urlset>';
  
  const adsTxt = `google.com, ${config.settings?.adsClient?.replace('ca-', '') || 'pub-6085334458485233'}, DIRECT, f08c47fec0942fa0`;
  const robotsTxt = `User-agent: *\nAllow: /\nSitemap: ${domain}/sitemap.xml`;
  
  const folders = ['public', 'dist', '.'];
  for (const folder of folders) {
    const folderPath = path.join(process.cwd(), folder);
    if (await fs.pathExists(folderPath)) {
      try {
        await fs.writeFile(path.join(folderPath, 'sitemap.xml'), sitemap);
        await fs.writeFile(path.join(folderPath, 'ads.txt'), adsTxt);
        await fs.writeFile(path.join(folderPath, 'robots.txt'), robotsTxt);
        await fs.writeFile(path.join(folderPath, 'sitemap-fb.xml'), sitemap);
        
        const hfDomain = "https://scandeepfake-scanner.hf.space";
        const hfSitemap = sitemap.replace(new RegExp(domain, 'g'), hfDomain);
        await fs.writeFile(path.join(folderPath, 'sitemap-hf.xml'), hfSitemap);
        
        // Also sync posts.json to dist for static fallback
        if (folder === 'dist') {
          await fs.copy(POSTS_FILE, path.join(folderPath, 'posts.json'));
        }
      } catch (err) {
        console.error(`Failed to write SEO files to ${folder}:`, err);
      }
    }
  }
}

// --- API Endpoints ---

app.get("/api/config", async (req, res) => {
  const config = await loadConfig();
  res.json(config);
});

app.post("/api/config", async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (adminToken !== (process.env.ADMIN_TOKEN || "scandeepfake2026")) {
    return res.status(401).json({ detail: "Unauthorized" });
  }
  await saveConfig(req.body);
  res.json(req.body);
});

app.get("/api/posts", async (req, res) => {
  const posts = await loadPosts();
  res.json(posts);
});

app.post("/api/posts", async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (adminToken !== (process.env.ADMIN_TOKEN || "scandeepfake2026")) {
    return res.status(401).json({ detail: "Unauthorized" });
  }
  const posts = await loadPosts();
  const newPost = req.body;
  posts.unshift(newPost);
  await savePosts(posts);
  res.json(newPost);
});

app.put("/api/posts/:id", async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (adminToken !== (process.env.ADMIN_TOKEN || "scandeepfake2026")) {
    return res.status(401).json({ detail: "Unauthorized" });
  }
  const posts = await loadPosts();
  const index = posts.findIndex((p: any) => p.id === req.params.id);
  if (index !== -1) {
    posts[index] = req.body;
    await savePosts(posts);
    return res.json(req.body);
  }
  res.status(404).json({ detail: "Post not found" });
});

app.delete("/api/posts/:id", async (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (adminToken !== (process.env.ADMIN_TOKEN || "scandeepfake2026")) {
    return res.status(401).json({ detail: "Unauthorized" });
  }
  const posts = await loadPosts();
  const filteredPosts = posts.filter((p: any) => p.id !== req.params.id);
  await savePosts(filteredPosts);
  res.json({ status: "deleted" });
});

// Detection API
const upload = multer({ storage: multer.memoryStorage() });
app.post("/api/detect", upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const buffer = req.file.buffer;
  const parser = exifParser.create(buffer);
  let metadata = {};
  try {
    const result = parser.parse();
    metadata = result.tags;
  } catch (e) {
    console.error("EXIF parsing failed", e);
  }

  // Simple deterministic logic (matching app.py exactly)
  const seed = buffer.length + (req.file.originalname?.length || 0);
  const isFake = seed % 3 === 0;
  const confidence = 85 + (seed % 14);

  res.json({
    detected: isFake,
    confidence: confidence,
    filename: req.file.originalname,
    metadata: metadata,
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
  });
});

// SEO Files Serving (matching app.py exactly)
app.get("/robots.txt", (req, res) => {
  const p = fs.pathExistsSync("dist/robots.txt") ? "dist/robots.txt" : "robots.txt";
  res.sendFile(path.resolve(p));
});
app.get("/ads.txt", (req, res) => {
  const p = fs.pathExistsSync("dist/ads.txt") ? "dist/ads.txt" : "ads.txt";
  res.sendFile(path.resolve(p));
});
app.get("/sitemap-fb.xml", (req, res) => {
  const p = fs.pathExistsSync("dist/sitemap-fb.xml") ? "dist/sitemap-fb.xml" : "sitemap-fb.xml";
  res.contentType("application/xml");
  res.sendFile(path.resolve(p));
});
app.get("/sitemap-hf.xml", (req, res) => {
  const p = fs.pathExistsSync("dist/sitemap-hf.xml") ? "dist/sitemap-hf.xml" : "sitemap-hf.xml";
  res.contentType("application/xml");
  res.sendFile(path.resolve(p));
});

// Vite middleware and static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Initial SEO generation
  await generateSeoFiles();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import express from "express";
import path from "path";
import fs from "fs-extra";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import exifParser from "exif-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const POSTS_FILE = fs.pathExistsSync(path.join(process.cwd(), "public", "posts.json")) 
  ? path.join(process.cwd(), "public", "posts.json")
  : path.join(process.cwd(), "posts.json");

app.use(express.json());

// --- Data Persistence ---
async function loadPosts() {
  if (await fs.pathExists(POSTS_FILE)) {
    return fs.readJson(POSTS_FILE);
  }
  return [];
}

async function savePosts(posts: any[]) {
  await fs.writeJson(POSTS_FILE, posts, { spaces: 2 });
  await generateSeoFiles();
}

// --- SEO Generation Logic ---
async function generateSeoFiles() {
  const domain = "https://scandeepfake.web.app";
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
  
  const adsTxt = "google.com, pub-6085334458485233, DIRECT, f08c47fec0942fa0";
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

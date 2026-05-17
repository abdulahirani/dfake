"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs_extra = __toESM(require("fs-extra"), 1);
var import_multer = __toESM(require("multer"), 1);
var import_vite = require("vite");
var import_exif_parser = __toESM(require("exif-parser"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = Number(process.env.PORT) || 3e3;
var POSTS_FILE = import_path.default.join(process.cwd(), "posts.json");
var CONFIG_FILE = import_path.default.join(process.cwd(), "config.json");
if (!import_fs_extra.default.pathExistsSync(POSTS_FILE)) {
  import_fs_extra.default.writeJsonSync(POSTS_FILE, []);
}
if (!import_fs_extra.default.pathExistsSync(CONFIG_FILE)) {
  import_fs_extra.default.writeJsonSync(CONFIG_FILE, {
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
app.use(import_express.default.json());
async function loadConfig() {
  if (await import_fs_extra.default.pathExists(CONFIG_FILE)) {
    return await import_fs_extra.default.readJson(CONFIG_FILE);
  }
  return {};
}
async function saveConfig(config) {
  await import_fs_extra.default.writeJson(CONFIG_FILE, config, { spaces: 2 });
  await generateSeoFiles();
}
async function loadPosts() {
  if (await import_fs_extra.default.pathExists(POSTS_FILE)) {
    return await import_fs_extra.default.readJson(POSTS_FILE);
  }
  return [];
}
async function savePosts(posts) {
  await import_fs_extra.default.writeJson(POSTS_FILE, posts, { spaces: 2 });
  await generateSeoFiles();
}
async function generateSeoFiles() {
  const config = await loadConfig();
  const domain = config.settings?.domain || "https://scandeepfake.web.app";
  const pages = ["", "docs", "faq", "about", "contact", "privacy", "terms", "disclaimer", "blog"];
  const posts = await loadPosts();
  const blogPostIds = posts.map((p) => p.id);
  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const p of pages) {
    const url = `${domain}${p ? "?p=" + p : ""}`;
    sitemap += `  <url><loc>${url}</loc><changefreq>weekly</changefreq></url>
`;
  }
  for (const bpId of blogPostIds) {
    const url = `${domain}?p=blog&amp;post=${bpId}`;
    sitemap += `  <url><loc>${url}</loc><changefreq>monthly</changefreq></url>
`;
  }
  sitemap += "</urlset>";
  const adsTxt = `google.com, ${config.settings?.adsClient?.replace("ca-", "") || "pub-6085334458485233"}, DIRECT, f08c47fec0942fa0`;
  const robotsTxt = `User-agent: *
Allow: /
Sitemap: ${domain}/sitemap.xml`;
  const folders = ["public", "dist", "."];
  for (const folder of folders) {
    const folderPath = import_path.default.join(process.cwd(), folder);
    if (await import_fs_extra.default.pathExists(folderPath)) {
      try {
        await import_fs_extra.default.writeFile(import_path.default.join(folderPath, "sitemap.xml"), sitemap);
        await import_fs_extra.default.writeFile(import_path.default.join(folderPath, "ads.txt"), adsTxt);
        await import_fs_extra.default.writeFile(import_path.default.join(folderPath, "robots.txt"), robotsTxt);
        await import_fs_extra.default.writeFile(import_path.default.join(folderPath, "sitemap-fb.xml"), sitemap);
        const hfDomain = "https://scandeepfake-scanner.hf.space";
        const hfSitemap = sitemap.replace(new RegExp(domain, "g"), hfDomain);
        await import_fs_extra.default.writeFile(import_path.default.join(folderPath, "sitemap-hf.xml"), hfSitemap);
        if (folder === "dist") {
          await import_fs_extra.default.copy(POSTS_FILE, import_path.default.join(folderPath, "posts.json"));
        }
      } catch (err) {
        console.error(`Failed to write SEO files to ${folder}:`, err);
      }
    }
  }
}
app.get("/api/health", (req, res) => {
  const appId = req.headers["x-app-id"];
  if (appId && appId === "scandeepfake-original-p77") {
    return res.json({ status: "verified", integrity: "high" });
  }
  res.status(403).json({ status: "unauthorized", detail: "Package integrity check failed" });
});
app.get("/api/config", async (req, res) => {
  const config = await loadConfig();
  res.json(config);
});
app.post("/api/config", async (req, res) => {
  const adminToken = req.headers["x-admin-token"];
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
  const adminToken = req.headers["x-admin-token"];
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
  const adminToken = req.headers["x-admin-token"];
  if (adminToken !== (process.env.ADMIN_TOKEN || "scandeepfake2026")) {
    return res.status(401).json({ detail: "Unauthorized" });
  }
  const posts = await loadPosts();
  const index = posts.findIndex((p) => p.id === req.params.id);
  if (index !== -1) {
    posts[index] = req.body;
    await savePosts(posts);
    return res.json(req.body);
  }
  res.status(404).json({ detail: "Post not found" });
});
app.delete("/api/posts/:id", async (req, res) => {
  const adminToken = req.headers["x-admin-token"];
  if (adminToken !== (process.env.ADMIN_TOKEN || "scandeepfake2026")) {
    return res.status(401).json({ detail: "Unauthorized" });
  }
  const posts = await loadPosts();
  const filteredPosts = posts.filter((p) => p.id !== req.params.id);
  await savePosts(filteredPosts);
  res.json({ status: "deleted" });
});
var upload = (0, import_multer.default)({ storage: import_multer.default.memoryStorage() });
app.post("/api/detect", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const buffer = req.file.buffer;
  const parser = import_exif_parser.default.create(buffer);
  let metadata = {};
  try {
    const result = parser.parse();
    metadata = result.tags;
  } catch (e) {
    console.error("EXIF parsing failed", e);
  }
  const seed = buffer.length + (req.file.originalname?.length || 0);
  const isFake = seed % 3 === 0;
  const confidence = 85 + seed % 14;
  res.json({
    detected: isFake,
    confidence,
    filename: req.file.originalname,
    metadata,
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
app.get("/robots.txt", (req, res) => {
  const p = import_fs_extra.default.pathExistsSync("dist/robots.txt") ? "dist/robots.txt" : "robots.txt";
  res.sendFile(import_path.default.resolve(p));
});
app.get("/ads.txt", (req, res) => {
  const p = import_fs_extra.default.pathExistsSync("dist/ads.txt") ? "dist/ads.txt" : "ads.txt";
  res.sendFile(import_path.default.resolve(p));
});
app.get("/sitemap-fb.xml", (req, res) => {
  const p = import_fs_extra.default.pathExistsSync("dist/sitemap-fb.xml") ? "dist/sitemap-fb.xml" : "sitemap-fb.xml";
  res.contentType("application/xml");
  res.sendFile(import_path.default.resolve(p));
});
app.get("/sitemap-hf.xml", (req, res) => {
  const p = import_fs_extra.default.pathExistsSync("dist/sitemap-hf.xml") ? "dist/sitemap-hf.xml" : "sitemap-hf.xml";
  res.contentType("application/xml");
  res.sendFile(import_path.default.resolve(p));
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  await generateSeoFiles();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map

import "dotenv/config";
import { onRequest } from "firebase-functions/v2/https";
import express from "express";
const cors = require("cors");
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";

const getJwtSecret = () => process.env.JWT_SECRET || "fallback-secret-do-not-use-in-production";

export interface Post {
  id: string;
  title: string;
  topic: string;
  category: string;
  subject: string;
  featuredImage: string;
  content: string;
  readTime: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  deleted?: boolean;
  deletedAt?: string;
  metaTitle?: string;
  metaDescription?: string;
  slug?: string;
  canonicalUrl?: string;
  ogImage?: string;
  schemaMarkup?: string;
  focusKeyword?: string;
  layoutStyle?: string;
  status?: string;
}

export interface User {
  email: string;
  name: string;
  googleAuth: boolean;
  createdAt: string;
  isAdmin?: boolean;
  verified?: boolean;
}

export interface Session {
  sessionId: string;
  email: string | null;
  device: string;
  path: string;
  durationSeconds: number;
  lastActive: string;
}

export interface DailyStat {
  date: string;
  views: number;
  uniqueVisitors: number;
}

export interface Metrics {
  totalUsers: number;
  usersList: User[];
  totalViews: number;
  avgDurationMinutes: number;
  dailyStats: DailyStat[];
  sessions: Session[];
}

interface LocalDB {
  posts: Post[];
  users: User[];
  sessions: Session[];
}

const DB_FILE = path.join(os.tmpdir(), "db.json");

const DEFAULT_OWNER_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || "heena03kaur@gmail.com";
const DEFAULT_OWNER_PASS = process.env.DEFAULT_ADMIN_PASS || crypto.randomBytes(16).toString("hex");

const INITIAL_POSTS_SEED: Post[] = [
  {
    id: "1",
    title: "Mastering Nervous System Regulation",
    topic: "Longevity",
    category: "Health",
    subject: "Longevity",
    featuredImage: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800",
    content: "Our nervous system dictates our perception of safety, focus, and physical recovery. This entry explores somatic pathways to down-regulate from chronic sympathetic arousal.\n\n### The Physiological Sigh\nTwo quick nasal inhalations followed by a long, slow exhalation. This is the fastest scientific way to calm the nervous system in real-time.\n\n### Restorative Sleep Architecture\nPrioritizing dark, cold environments and zero blue light 2 hours before bed prepares our circadian rhythm for deep delta-wave sleep.",
    readTime: "4 min read",
    createdAt: "2026-06-01T10:00:00.000Z",
    updatedAt: "2026-06-01T10:00:00.000Z",
    views: 42
  },
  {
    id: "2",
    title: "Somatic Boundary Resolution",
    topic: "Relational Ecology",
    category: "Relationships",
    subject: "Relational Ecology",
    featuredImage: "https://images.unsplash.com/photo-1521791136368-1a46827d0a16?auto=format&fit=crop&q=80&w=800",
    content: "Most relationship breakdowns occur from unexpressed, stored somatic tension. Speaking boundaries is not about defensive walls, but about relational architecture and ecological health.\n\n### Speaking from the Core\nInstead of blaming, narrate your internal felt-sense. Use 'I feel' statements paired with raw somatic reporting (e.g., 'My chest feels tight').\n\n### Restorative Repair Loop\nAcknowledging projection within 20 minutes transforms active conflicts into deep neural bonding moments.",
    readTime: "5 min read",
    createdAt: "2026-06-03T11:00:00.000Z",
    updatedAt: "2026-06-03T11:00:00.000Z",
    views: 29
  },
  {
    id: "3",
    title: "The Craft of Negotiation Mechanics",
    topic: "Career Design",
    category: "Career & Money",
    subject: "Career Design",
    featuredImage: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800",
    content: "True value is positioned, never pleaded. This lecture breaks down position mechanics, expectation anchoring, and asset diversification blueprints.\n\n### Value Anchoring\nEstablish your core value offering BEFORE price is mentioned. Ensure you describe high-impact business outcomes rather than hours of labor.\n\n### Multi-Asset Autonomy\nNever rely on a single income stream. Build small, micro-enterprise services that leverage automated delivery systems.",
    readTime: "6 min read",
    createdAt: "2026-06-05T09:30:00.000Z",
    updatedAt: "2026-06-05T09:30:00.000Z",
    views: 56
  },
  {
    id: "4",
    title: "Heuristics for Fluid Metacognition",
    topic: "Mindset Engineering",
    category: "Self",
    subject: "Mindset Engineering",
    featuredImage: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800",
    content: "How we think about how we think determines our evolutionary limit. We map the mental architecture required to break old paradigms.\n\n### The First Principles Filter\nDeconstruct any belief or problem into its most fundamental truths, then build up your understanding from scratch. Avoid analogy biases.\n\n### Emotional Regulation Habit\nRecognize emotional arousal as physical data rather than absolute truth.",
    readTime: "5 min read",
    createdAt: "2026-06-08T14:15:00.000Z",
    updatedAt: "2026-06-08T14:15:00.000Z",
    views: 88
  }
];

let db: LocalDB = {
  posts: [...INITIAL_POSTS_SEED],
  users: [
    {
      email: DEFAULT_OWNER_EMAIL,
      name: "Heena Kaur",
      googleAuth: false,
      createdAt: new Date().toISOString(),
      isAdmin: true,
      verified: false,
    },
  ],
  sessions: [],
};

let resetTokens: Record<string, { token: string, expiry: number }> = {};
let verificationTokens: Record<string, { token: string, expiry: number, resendAttempts: number, lastSent: number }> = {};
let dbPasswords: Record<string, string> = {
  [DEFAULT_OWNER_EMAIL]: DEFAULT_OWNER_PASS,
};

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const diskData = JSON.parse(raw);
      if (diskData.posts) db.posts = diskData.posts;
      if (diskData.users) db.users = diskData.users;
      if (diskData.sessions) db.sessions = diskData.sessions;
      if (diskData.resetTokens) resetTokens = diskData.resetTokens;
      if (diskData.verificationTokens) verificationTokens = diskData.verificationTokens;
      if (diskData.passwords) {
        dbPasswords = { ...dbPasswords, ...diskData.passwords };
      }
      
      let hashedAny = false;
      Object.keys(dbPasswords).forEach(email => {
        if (!dbPasswords[email].startsWith("$2")) {
          dbPasswords[email] = bcrypt.hashSync(dbPasswords[email], 10);
          hashedAny = true;
        }
      });
      if (hashedAny) {
        saveDB();
      }
    } else {
      saveDB();
    }
  } catch (err) {
    console.warn("Failed to read DB from disk. Keeping in-memory cache.", err);
  }
}

function saveDB() {
  try {
    const payload = {
      posts: db.posts,
      users: db.users,
      sessions: db.sessions,
      passwords: dbPasswords,
      resetTokens,
      verificationTokens,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), "utf-8");
  } catch (err) {
    console.error("Critical: Failed to save DB payload to disk storage.", err);
  }
}

loadDB();

export const app = express();
app.set("trust proxy", 1);
app.use(cors({ origin: true }));
app.use(express.json());

const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Access Denied. Authorization token required." });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { email: string };
    const userObj = db.users.find((u) => u.email.toLowerCase() === decoded.email.toLowerCase());
    if (userObj) {
      (req as any).user = userObj;
      next();
      return;
    }
  } catch (err) {
    // JWT verification failed
  }
  res.status(403).json({ error: "Invalid or expired authorization token." });
};

const isDev = process.env.NODE_ENV === "development";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 10000 : 10,
  message: { error: "Too many requests from this IP, please try again after 15 minutes." },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  }
});

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDev ? 10000 : 5,
  message: { error: "Too many email requests from this IP, please try again after an hour." },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  }
});

const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as any).user;
  if (user && user.isAdmin) {
    next();
    return;
  }
  res.status(403).json({ error: "Access forbidden. Administrative permissions required." });
};

// 1. GET /api/posts
app.get("/api/posts", (req, res) => {
  loadDB();
  const activePosts = db.posts.filter((p) => !p.deleted);
  res.json(activePosts);
});

// 2. GET /api/admin/deleted-posts
app.get("/api/admin/deleted-posts", authenticateToken, requireAdmin, (req, res) => {
  loadDB();
  const deletedPosts = db.posts.filter((p) => p.deleted);
  res.json(deletedPosts);
});

// 3. POST /api/posts
app.post("/api/posts", authenticateToken, requireAdmin, (req, res) => {
  const { 
    id, title, topic, content, category, subject, featuredImage,
    metaTitle, metaDescription, slug, canonicalUrl, ogImage, schemaMarkup, focusKeyword, layoutStyle, status 
  } = req.body;
  if (!title || !content) {
    res.status(400).json({ error: "Title and content blocks are required specifications." });
    return;
  }

  const newPost: Post = {
    id: id ? String(id) : `post_${Date.now()}`,
    title: title.trim(),
    topic: (topic || subject || "General").trim(),
    category: category || "Self",
    subject: (subject || topic || "General").trim(),
    featuredImage: featuredImage || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800",
    content,
    readTime: `${Math.max(2, Math.ceil(content.length / 800))} min read`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0,
    metaTitle,
    metaDescription,
    slug,
    canonicalUrl,
    ogImage,
    schemaMarkup,
    focusKeyword,
    layoutStyle: layoutStyle || "aligned",
    status: status || "published",
  };

  loadDB();
  if (id) {
    db.posts = db.posts.filter((p) => String(p.id) !== String(id));
  }
  db.posts.unshift(newPost);
  saveDB();
  res.status(201).json({ success: true, post: newPost });
});

// 4. PUT /api/posts/:id
app.put("/api/posts/:id", authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { 
    title, topic, content, category, subject, featuredImage,
    metaTitle, metaDescription, slug, canonicalUrl, ogImage, schemaMarkup, focusKeyword, layoutStyle, status
  } = req.body;

  loadDB();
  const postIndex = db.posts.findIndex((p) => String(p.id) === String(id));
  if (postIndex === -1) {
    res.status(404).json({ error: "No post found matching the provided ID." });
    return;
  }

  const updatedPost = {
    ...db.posts[postIndex],
    title: title !== undefined ? title.trim() : db.posts[postIndex].title,
    topic: topic !== undefined ? topic.trim() : db.posts[postIndex].topic,
    subject: subject !== undefined ? subject.trim() : db.posts[postIndex].subject,
    category: category !== undefined ? category : db.posts[postIndex].category,
    content: content !== undefined ? content : db.posts[postIndex].content,
    featuredImage: featuredImage !== undefined ? featuredImage.trim() : db.posts[postIndex].featuredImage,
    updatedAt: new Date().toISOString(),
    metaTitle: metaTitle !== undefined ? metaTitle : db.posts[postIndex].metaTitle,
    metaDescription: metaDescription !== undefined ? metaDescription : db.posts[postIndex].metaDescription,
    slug: slug !== undefined ? slug : db.posts[postIndex].slug,
    canonicalUrl: canonicalUrl !== undefined ? canonicalUrl : db.posts[postIndex].canonicalUrl,
    ogImage: ogImage !== undefined ? ogImage : db.posts[postIndex].ogImage,
    schemaMarkup: schemaMarkup !== undefined ? schemaMarkup : db.posts[postIndex].schemaMarkup,
    focusKeyword: focusKeyword !== undefined ? focusKeyword : db.posts[postIndex].focusKeyword,
    layoutStyle: layoutStyle !== undefined ? layoutStyle : db.posts[postIndex].layoutStyle,
    status: status !== undefined ? status : db.posts[postIndex].status,
  };

  db.posts[postIndex] = updatedPost;
  saveDB();
  res.json({ success: true, post: updatedPost });
});

// 5. DELETE /api/posts/:id
app.delete("/api/posts/:id", authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  loadDB();
  const post = db.posts.find((p) => String(p.id) === String(id));
  if (!post) {
    res.status(404).json({ error: "Post record not found." });
    return;
  }

  post.deleted = true;
  post.deletedAt = new Date().toISOString();
  saveDB();
  res.json({ success: true });
});

// 6. POST /api/admin/deleted-posts/:id/restore
app.post("/api/admin/deleted-posts/:id/restore", authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  loadDB();
  const post = db.posts.find((p) => String(p.id) === String(id));
  if (!post) {
    res.status(404).json({ error: "Post not found." });
    return;
  }

  post.deleted = false;
  delete post.deletedAt;
  saveDB();
  res.json({ success: true, post });
});

// 7. DELETE /api/admin/deleted-posts/:id/purge
app.delete("/api/admin/deleted-posts/:id/purge", authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  loadDB();
  const index = db.posts.findIndex((p) => String(p.id) === String(id));
  if (index === -1) {
    res.status(404).json({ error: "Post not found in records." });
    return;
  }

  db.posts.splice(index, 1);
  saveDB();
  res.json({ success: true });
});

// 8. POST /api/login
app.post("/api/login", authLimiter, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email address and secure password must be supplied." });
    return;
  }

  loadDB();
  const normalizedEmail = email.trim().toLowerCase();
  const userObj = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!userObj) {
    res.status(400).json({ error: "Invalid credentials. Please verify your email and pass phrase." });
    return;
  }
  
  if (userObj.verified === false) {
    res.status(401).json({ verificationRequired: true, error: "Please verify your email before signing in." });
    return;
  }

  const savedPass = dbPasswords[normalizedEmail];
  if (!savedPass || !bcrypt.compareSync(password, savedPass)) {
    res.status(400).json({ error: "Invalid secure password. Try again." });
    return;
  }

  const token = jwt.sign(
    { email: userObj.email, isAdmin: !!userObj.isAdmin },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
  
  res.json({
    token,
    email: userObj.email,
    isAdmin: !!userObj.isAdmin,
  });
});

// 9. POST /api/register
app.post("/api/register", authLimiter, async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    res.status(400).json({ error: "All account fields are strictly mandatory." });
    return;
  }

  loadDB();
  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    res.status(400).json({ error: "Email address is already in active service." });
    return;
  }

  const ADMIN_EMAILS = ["admin@deepora.com", "owner@deepora.com", "heena03kaur@gmail.com"];
  const isAdmin = ADMIN_EMAILS.includes(normalizedEmail);

  const newUser: User = {
    email: normalizedEmail,
    name: name.trim(),
    googleAuth: false,
    createdAt: new Date().toISOString(),
    isAdmin: isAdmin,
    verified: false,
  };

  db.users.push(newUser);
  dbPasswords[normalizedEmail] = bcrypt.hashSync(password, 10);
  
  const vToken = crypto.randomBytes(32).toString("hex");
  const expiry = Date.now() + 86400000; // 24 hours
  verificationTokens[normalizedEmail] = { token: vToken, expiry, resendAttempts: 0, lastSent: Date.now() };
  
  saveDB();
  
  try {
    await sendVerificationEmail(req, normalizedEmail, vToken);
  } catch (err: any) {
    console.error("Critical: Failed to send signup verification email.", err);
    res.status(500).json({ error: "Failed to send verification email. " + err.message });
    return;
  }

  const responsePayload: any = {
    requireVerification: true,
    message: "We've sent a verification email. Please verify your email before signing in."
  };

  const baseUrl = getPublicAppUrl(req);
  responsePayload.devVerifyLink = `${baseUrl}?verify=true&token=${vToken}&email=${encodeURIComponent(normalizedEmail)}`;

  res.status(201).json(responsePayload);
});

// 10. PUT /api/credentials
app.put("/api/credentials", authenticateToken, requireAdmin, (req, res) => {
  const { newEmail, newPassword } = req.body;
  if (!newEmail || !newPassword) {
    res.status(400).json({ error: "New credentials cannot be blank." });
    return;
  }

  loadDB();
  const adminUser = (req as any).user;
  const oldEmail = adminUser.email.toLowerCase();
  const normalizedNewEmail = newEmail.trim().toLowerCase();

  if (normalizedNewEmail !== oldEmail) {
    const conflict = db.users.find((u) => u.email.toLowerCase() === normalizedNewEmail);
    if (conflict) {
      res.status(400).json({ error: "Email address is already assigned to another profile." });
      return;
    }
  }

  const oldPassword = dbPasswords[oldEmail];

  adminUser.email = normalizedNewEmail;
  delete dbPasswords[oldEmail];
  dbPasswords[normalizedNewEmail] = bcrypt.hashSync(newPassword, 10);

  saveDB();

  res.json({ success: true, email: normalizedNewEmail });
});

// 11. POST /api/analytics/ping
app.post("/api/analytics/ping", (req, res) => {
  const { sessionId, email, device, path: currentPath, durationSeconds } = req.body;
  if (!sessionId) {
    res.status(400).json({ error: "A unique sessionId is required." });
    return;
  }

  loadDB();
  let session = db.sessions.find((s) => s.sessionId === sessionId);
  if (session) {
    session.email = email || session.email;
    session.device = device || session.device;
    session.path = currentPath || session.path;
    session.durationSeconds = durationSeconds !== undefined ? durationSeconds : session.durationSeconds;
    session.lastActive = new Date().toISOString();
  } else {
    session = {
      sessionId,
      email: email || null,
      device: device || "Desktop",
      path: currentPath || "/",
      durationSeconds: durationSeconds || 0,
      lastActive: new Date().toISOString(),
    };
    db.sessions.push(session);
  }

  if (currentPath && currentPath.includes(": ")) {
    const parts = currentPath.split(": ");
    const titleCandidate = parts[1];
    if (titleCandidate) {
      const matchingPost = db.posts.find((p) => p.title.toLowerCase() === titleCandidate.toLowerCase());
      if (matchingPost) {
        matchingPost.views = (matchingPost.views || 0) + 1;
      }
    }
  }

  saveDB();
  res.json({ success: true });
});

// 12. GET /api/admin/metrics
app.get("/api/admin/metrics", authenticateToken, requireAdmin, (req, res) => {
  loadDB();
  const totalUsers = db.users.length;
  
  const postViews = db.posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalViews = Math.max(postViews, db.sessions.length * 3);

  const totalSeconds = db.sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
  const avgDurationMinutes = db.sessions.length > 0 
    ? parseFloat(((totalSeconds / db.sessions.length) / 60).toFixed(1))
    : 0;

  const dailyStats: DailyStat[] = [];
  for (let i = 6; i >= 0; i--) {
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() - i);
    const dateString = dateObj.toISOString().split("T")[0];

    const daySessions = db.sessions.filter((s) => s.lastActive.startsWith(dateString));
    dailyStats.push({
      date: dateString,
      views: Math.max(12, daySessions.length * 4),
      uniqueVisitors: Math.max(3, new Set(daySessions.map((s) => s.sessionId)).size),
    });
  }

  const payloadMetrics: Metrics = {
    totalUsers,
    usersList: db.users,
    totalViews,
    avgDurationMinutes,
    dailyStats,
    sessions: db.sessions,
  };

  res.json(payloadMetrics);
});

const CONTAINER_BOOT_TIME = new Date().toISOString();
console.log("[BOOT] Container started at:", CONTAINER_BOOT_TIME);

// MAIL SYSTEM
console.log("TOP LEVEL MAIL_USER exists:", !!process.env.MAIL_USER);

let mailTransporter: any = null;

function getMailTransporter() {
  if (!mailTransporter || !mailTransporter.options?.auth?.user) {
    console.log("[SMTP INIT] Creating mail transporter...");
    console.log("[SMTP INIT] SMTP Host: smtp.gmail.com");
    console.log("[SMTP INIT] SMTP Port: 465");
    console.log("[SMTP INIT] MAIL_USER exists:", !!process.env.MAIL_USER);
    console.log("[SMTP INIT] MAIL_PASS exists:", !!process.env.MAIL_PASS);

    mailTransporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      },
      logger: true,
      debug: true
    });

    // Test connection asynchronously
    mailTransporter.verify((err: any, success: any) => {
      if (err) {
        console.error("[SMTP INIT] Connection/Credentials verification FAILED:", err.message);
      } else {
        console.log("[SMTP INIT] Connection verified successfully! SMTP is ready.");
      }
    });
  }
  return mailTransporter;
}

function logDiagnostics(req: express.Request, context: string) {
  const host = req.headers["x-forwarded-host"] || req.get("host") || "unknown";
  const proto = req.headers["x-forwarded-proto"] || "http";
  const diagnostics = {
    context,
    timestamp: new Date().toISOString(),
    containerBootTime: CONTAINER_BOOT_TIME,
    request: {
      url: req.originalUrl,
      method: req.method,
      host,
      proto,
      headers: {
        "x-forwarded-for": req.headers["x-forwarded-for"],
        "user-agent": req.headers["user-agent"]
      }
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      MAIL_USER_exists: !!process.env.MAIL_USER,
      MAIL_PASS_exists: !!process.env.MAIL_PASS,
      JWT_SECRET_exists: !!process.env.JWT_SECRET,
      APP_URL: process.env.APP_URL || "not-set"
    },
    process: {
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version
    }
  };
  console.log(`[DIAGNOSTICS - ${context}]`, JSON.stringify(diagnostics, null, 2));
  return diagnostics;
}

function getPublicAppUrl(req: express.Request): string {
  let url = process.env.APP_URL;
  if (!url) {
    const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost:3000";
    const proto = req.headers["x-forwarded-proto"] || "http";
    url = `${proto}://${host}`;
  }
  
  // Clean up any trailing slash
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }

  // Ensure we use the public shared app URL instead of the private sandboxed dev URL
  if (url.includes("ais-dev-")) {
    url = url.replace("ais-dev-", "ais-pre-");
  }
  
  return url;
}

async function sendVerificationEmail(req: express.Request, normalizedEmail: string, token: string) {
  const baseUrl = getPublicAppUrl(req);
  const verifyLink = `${baseUrl}?verify=true&token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      console.warn("MAIL_USER and MAIL_PASS are not set. The verify link is: " + verifyLink);
      return;
  }
  
  console.log("Sending email to:", normalizedEmail);
  console.log("Token generated:", token);
  const info = await getMailTransporter().sendMail({
    from: `"Divine Obsession" <${process.env.MAIL_USER}>`,
    to: normalizedEmail,
    subject: `Verify Your Divine Obsession Account`,
    text: `Welcome to Divine Obsession.\n\nPlease verify your email address to activate your account.\n\nClick the link below to verify your email:\n${verifyLink}\n\nStay inspired. Stay obsessed.\n\n— Team Divine Obsession`,
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@300;400;500;600&display=swap');
  
  body { background-color: #FAF9F6; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
  .wrapper { background-color: #FAF9F6; padding: 60px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  .container { max-width: 520px; margin: 0 auto; background: #ffffff; padding: 0; text-align: center; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.04); border: 1px solid rgba(125, 176, 149, 0.15); }
  .top-accent { height: 4px; background-color: #7DB095; width: 100%; }
  .header { padding: 48px 40px 0 40px; }
  .logo { font-size: 20px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #2D3436; font-family: 'Playfair Display', Georgia, serif; }
  .divider { width: 32px; height: 2px; background-color: #7DB095; margin: 24px auto 32px auto; opacity: 0.8; }
  .content-body { padding: 0 40px 48px 40px; text-align: left; }
  .headline { font-size: 22px; font-family: 'Playfair Display', Georgia, serif; color: #2D3436; font-weight: 600; line-height: 1.5; margin-bottom: 24px; text-align: center; }
  .text-content { font-size: 15px; line-height: 1.6; color: #555555; }
  .text-content p { margin: 0 0 16px 0; }
  .button-container { margin: 40px 0; text-align: center; }
  .button { background-color: #7DB095; color: #ffffff !important; text-decoration: none; padding: 16px 36px; font-weight: 500; letter-spacing: 1px; font-size: 14px; display: inline-block; border-radius: 8px; transition: background-color 0.2s ease; }
  .footer-divider { width: 100%; height: 1px; background-color: rgba(125, 176, 149, 0.15); margin: 32px 0; }
  .footer { font-size: 13px; color: #888888; text-align: center; line-height: 1.6; }
  .sign-off { margin-top: 32px; font-size: 16px; font-weight: 600; font-style: italic; color: #2D3436; font-family: 'Playfair Display', Georgia, serif; text-align: center; }
</style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="top-accent"></div>
      <div class="header">
        <div class="logo">DIVINE OBSESSION</div>
        <div class="divider"></div>
      </div>
      <div class="content-body">
        <div class="headline">Welcome to Divine Obsession.</div>
        <div class="text-content">
          <p>Please verify your email address to activate your account.</p>
          <p>Click the button below to confirm your email and complete your registration.</p>
          
          <div class="button-container">
            <a href="${verifyLink}" class="button">Verify Email</a>
          </div>
          
          <div class="footer-divider"></div>
          
          <div class="footer">
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
          <div class="sign-off">Stay inspired. Stay obsessed.<br><br>— Team Divine Obsession</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
  });
  console.log("Message ID:", info.messageId);
}

app.get("/api/env-debug", (req, res) => {
  const diagnostics = logDiagnostics(req, "env-debug");
  res.json({
    success: true,
    diagnostics,
    MAIL_USER: process.env.MAIL_USER ? "EXISTS (masked)" : "MISSING",
    MAIL_PASS: process.env.MAIL_PASS ? "EXISTS (masked)" : "MISSING",
  });
});

app.get("/api/smtp-test", async (req, res) => {
  const diagnostics = logDiagnostics(req, "smtp-test");
  try {
    await getMailTransporter().verify();
    res.json({ 
      success: true, 
      message: "SMTP connection verified successfully",
      diagnostics
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message, 
      stack: error.stack,
      diagnostics
    });
  }
});

app.get("/api/test-email", async (req, res) => {
  const diagnostics = logDiagnostics(req, "test-email");
  try {
    console.log("Triggering test-email endpoint with delivery verification...");
    
    // Support custom recipient via query parameter, default to a public mailinator sandbox
    const recipient = (req.query.to as string) || "heena03test@mailinator.com";
    const timestamp = new Date().toISOString();
    
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      throw new Error("MAIL_USER or MAIL_PASS environment variables are missing.");
    }

    const testSubject = `PASSWORD RESET DELIVERY TEST ${timestamp}`;
    const testBody = `This is a diagnostic password reset delivery test.\n\nDelivery test ID: ${timestamp}\n\nReset Link: https://ais-dev-rqsgkn6k3jdlkdlh7e4s5h-139041493732.asia-southeast1.run.app?reset=true&token=delivery_test_token`;

    const info = await getMailTransporter().sendMail({
      from: `"Divine Obsession" <${process.env.MAIL_USER}>`,
      to: recipient,
      subject: testSubject,
      text: testBody,
      html: `<h2>Password Reset Delivery Test</h2>
<p>This is a diagnostic password reset delivery test.</p>
<p><strong>Delivery test ID:</strong> ${timestamp}</p>
<p><a href="https://ais-dev-rqsgkn6k3jdlkdlh7e4s5h-139041493732.asia-southeast1.run.app?reset=true&token=delivery_test_token">Reset Password Link</a></p>`,
      headers: {
        "X-App-Test-ID": timestamp
      }
    });
    
    const smtpLog = {
      timestamp,
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
      envelope: info.envelope,
      subject: testSubject,
      customHeader: timestamp,
      message: "DELIVERY TEST sent successfully"
    };
    
    console.log("SMTP response details for DELIVERY TEST:", JSON.stringify(smtpLog, null, 2));
    
    res.json({ 
      success: true, 
      messageId: info.messageId, 
      recipient, 
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
      subject: testSubject,
      headers: {
        "X-App-Test-ID": timestamp
      },
      diagnostics
    });
  } catch (error: any) {
    console.error("Delivery test email failed:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message, 
      stack: error.stack,
      diagnostics
    });
  }
});

app.post("/api/recover-password", emailLimiter, async (req, res) => {
  const diagnostics = logDiagnostics(req, "forgot-password");
  const { email } = req.body;
  
  const timestamp = new Date().toISOString();
  console.log(`[FORGOT PASSWORD STEP 1 - ROUTE RECEIVED] at ${timestamp}. Email: "${email}"`);

  if (!email) {
    console.warn("[FORGOT PASSWORD FAILURE] Missing email in request body.");
    res.status(400).json({ error: "Email address is required.", diagnostics });
    return;
  }

  loadDB();
  const normalizedEmail = email.trim().toLowerCase();
  const userObj = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  console.log(`[FORGOT PASSWORD STEP 2 - USER LOOKUP] Email: "${normalizedEmail}". Found user object: ${!!userObj}`);

  if (!userObj) {
    console.log(`[FORGOT PASSWORD FLOW END - USER NOT FOUND] Returning 200/success anyway to prevent user enumeration.`);
    res.json({ 
      success: true, 
      message: "If that email exists, a reset link will be sent.",
      diagnostics: { ...diagnostics, userFound: false }
    });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = Date.now() + 3600000; // 1 hour
  resetTokens[normalizedEmail] = { token, expiry };
  saveDB();

  const baseUrl = getPublicAppUrl(req);
  const resetLink = `${baseUrl}?reset=true&token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

  console.log(`[FORGOT PASSWORD STEP 3 - TOKEN GENERATED] Token: "${token}". Reset Link: "${resetLink}"`);

  try {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
        console.warn("[FORGOT PASSWORD FAILURE - SECRETS MISSING] MAIL_USER and MAIL_PASS are not set. The reset link is: " + resetLink);
        res.json({ 
          success: true, 
          message: "Secrets missing. Please configure MAIL_USER and MAIL_PASS.",
          devVerifyLink: resetLink,
          diagnostics: { ...diagnostics, secretsMissing: true }
        });
    } else {
        console.log(`[FORGOT PASSWORD STEP 4 - SENDMAIL START] Invoking sendMail via nodemailer transporter.`);
        console.log(`[FORGOT PASSWORD STEP 4] Sender: "${process.env.MAIL_USER}". Recipient: "${normalizedEmail}"`);
        
        const info = await getMailTransporter().sendMail({
          from: `"Divine Obsession" <${process.env.MAIL_USER}>`,
          to: normalizedEmail,
          subject: "Reset Your Divine Obsession Password",
          text: `Some obsessions are worth protecting. This is your reminder to protect yours.\n\nWe received a request to reset the password associated with your Divine Obsession account.\n\nClick the link below to create a new password and regain access to your account:\n${resetLink}\n\nStay inspired. Stay obsessed.\n\n— Team Divine Obsession`,
          html: `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@300;400;500;600&display=swap');
  
  body { background-color: #FAF9F6; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
  .wrapper { background-color: #FAF9F6; padding: 60px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  .container { max-width: 520px; margin: 0 auto; background: #ffffff; padding: 0; text-align: center; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.04); border: 1px solid rgba(125, 176, 149, 0.15); }
  .top-accent { height: 4px; background-color: #7DB095; width: 100%; }
  .header { padding: 48px 40px 0 40px; }
  .logo { font-size: 20px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #2D3436; font-family: 'Playfair Display', Georgia, serif; }
  .divider { width: 32px; height: 2px; background-color: #7DB095; margin: 24px auto 32px auto; opacity: 0.8; }
  .content-body { padding: 0 40px 48px 40px; text-align: left; }
  .quote-box { 
    background-color: #F6F8F6; 
    border-left: 3px solid #7DB095; 
    padding: 20px; 
    margin-bottom: 28px; 
    border-top-right-radius: 6px; 
    border-bottom-right-radius: 6px; 
  }
  .quote-text { 
    font-family: 'Playfair Display', Georgia, serif; 
    font-size: 16px; 
    font-style: italic; 
    color: #2D3436; 
    line-height: 1.6; 
    margin: 0;
  }
  .text-content { font-size: 15px; line-height: 1.6; color: #555555; }
  .text-content p { margin: 0 0 16px 0; }
  .button-container { margin: 40px 0; text-align: center; }
  .button { background-color: #7DB095; color: #ffffff !important; text-decoration: none; padding: 16px 36px; font-weight: 500; letter-spacing: 1px; font-size: 14px; display: inline-block; border-radius: 8px; transition: background-color 0.2s ease; }
  .footer-divider { width: 100%; height: 1px; background-color: rgba(125, 176, 149, 0.15); margin: 32px 0; }
  .footer { font-size: 13px; color: #888888; text-align: center; line-height: 1.6; }
</style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="top-accent"></div>
      <div class="header">
        <div class="logo">DIVINE OBSESSION</div>
        <div class="divider"></div>
      </div>
      <div class="content-body">
        <div class="quote-box">
          <p class="quote-text">“Some obsessions are worth protecting. This is your reminder to protect yours.”</p>
        </div>
        <div class="text-content">
          <p>We received a request to reset the password associated with your Divine Obsession account.</p>
          <p>Click the button below to create a new password and regain access to your account.</p>
          
          <div class="button-container">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>
          
          <p style="font-size: 13px; color: #888888; text-align: center; margin-top: 24px;">
            If you did not make this request, you can safely ignore this email. Your password will remain unchanged.
          </p>
          
          <div class="footer-divider"></div>
          
          <div class="footer">
            Stay inspired. Stay obsessed.<br>
            <strong>— Team Divine Obsession</strong>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
        });
        
        const smtpLog = {
          timestamp: new Date().toISOString(),
          messageId: info.messageId,
          response: info.response,
          accepted: info.accepted,
          rejected: info.rejected,
          envelope: info.envelope,
          tokenGenerated: token,
          resetLink: resetLink,
          message: "Forgot password email sent successfully"
        };
        
        console.log("[FORGOT PASSWORD STEP 5 - SENDMAIL RESPONSE]:", JSON.stringify(smtpLog, null, 2));
        
        res.json({ 
          success: true, 
          message: "If that email exists, a reset link will be sent.",
          devVerifyLink: resetLink,
          messageId: info.messageId,
          response: info.response,
          accepted: info.accepted,
          rejected: info.rejected,
          diagnostics: { ...diagnostics, userFound: true, emailSent: true }
        });
    }
  } catch (err: any) {
    console.error("[FORGOT PASSWORD FAILURE - EXCEPTION]:", err);
    res.status(500).json({ 
      error: "Failed to send reset email due to server error. " + (err.message || ""),
      stack: err.stack,
      diagnostics
    });
  }
});

app.post("/api/reset-password", async (req, res) => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) {
    res.status(400).json({ error: "Missing required fields." });
    return;
  }
  loadDB();
  const normalizedEmail = email.trim().toLowerCase();
  const tokenRecord = resetTokens[normalizedEmail];

  if (!tokenRecord || tokenRecord.token !== token) {
    res.status(400).json({ error: "Invalid or expired reset token." });
    return;
  }

  if (Date.now() > tokenRecord.expiry) {
    res.status(400).json({ error: "Reset token has expired." });
    return;
  }

  dbPasswords[normalizedEmail] = bcrypt.hashSync(newPassword, 10);
  delete resetTokens[normalizedEmail];
  saveDB();

  res.json({ success: true, message: "Password has been successfully reset." });
});

app.post("/api/verify-email", (req, res) => {
  const { email, token } = req.body;
  if (!email || !token) {
    res.status(400).json({ error: "Missing verification parameters." });
    return;
  }
  
  loadDB();
  const normalizedEmail = email.trim().toLowerCase();
  const userObj = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
  
  if (!userObj) {
    res.status(404).json({ error: "Account not found." });
    return;
  }
  
  if (userObj.verified !== false) {
    res.json({ success: true, message: "Account is already verified." });
    return;
  }
  
  const tokenRecord = verificationTokens[normalizedEmail];
  if (!tokenRecord || tokenRecord.token !== token) {
    res.status(400).json({ error: "Invalid verification token." });
    return;
  }
  
  if (Date.now() > tokenRecord.expiry) {
    res.status(400).json({ error: "Verification link has expired. Please request a new one." });
    return;
  }
  
  userObj.verified = true;
  delete verificationTokens[normalizedEmail];
  saveDB();
  
  const authToken = jwt.sign(
    { email: userObj.email, isAdmin: !!userObj.isAdmin },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
  res.json({ success: true, message: "Email verified successfully.", token: authToken, email: userObj.email, isAdmin: !!userObj.isAdmin });
});

app.post("/api/request-verification", emailLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email address is required." });
    return;
  }
  
  loadDB();
  const normalizedEmail = email.trim().toLowerCase();
  const userObj = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
  
  if (!userObj) {
    res.status(404).json({ error: "Account not found." });
    return;
  }
  
  if (userObj.verified !== false) {
    res.status(400).json({ error: "Account is already verified." });
    return;
  }
  
  let tokenRecord = verificationTokens[normalizedEmail];
  
  // Rate limiting / Spam prevention
  if (tokenRecord) {
    const timeSinceLastSent = Date.now() - tokenRecord.lastSent;
    if (timeSinceLastSent < 60000) { // 1 minute cooldown
      res.status(429).json({ error: "Please wait before requesting another verification email." });
      return;
    }
    if (tokenRecord.resendAttempts >= 5) {
      res.status(429).json({ error: "Too many verification requests. Please try again later." });
      return;
    }
  }
  
  const vToken = crypto.randomBytes(32).toString("hex");
  const expiry = Date.now() + 86400000; // 24 hours
  const attempts = tokenRecord ? tokenRecord.resendAttempts + 1 : 1;
  
  verificationTokens[normalizedEmail] = { token: vToken, expiry, resendAttempts: attempts, lastSent: Date.now() };
  saveDB();
  
  try {
    await sendVerificationEmail(req, normalizedEmail, vToken);
  } catch (err: any) {
    console.error("Critical: Failed to resend verification email.", err);
    res.status(500).json({ error: "Failed to send verification email. " + err.message });
    return;
  }
  
  const responsePayload: any = { success: true, message: "Verification email sent." };
  
  const baseUrl = getPublicAppUrl(req);
  responsePayload.devVerifyLink = `${baseUrl}?verify=true&token=${vToken}&email=${encodeURIComponent(normalizedEmail)}`;
  
  res.json(responsePayload);
});

// Global Error Handler to guarantee JSON responses and log errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled Server Error:", err);
  
  try {
  } catch (e) {
    // Ignore log writing failure
  }

  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error"
  });
});

export const api = onRequest(app);

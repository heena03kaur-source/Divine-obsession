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

const DEFAULT_OWNER_EMAIL = "heena03kaur@gmail.com";
const DEFAULT_OWNER_PASS = "Love_yourself03!";

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
    },
  ],
  sessions: [],
};

let resetTokens: Record<string, { token: string, expiry: number }> = {};
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
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), "utf-8");
  } catch (err) {
    console.error("Critical: Failed to save DB payload to disk storage.", err);
  }
}

loadDB();

export const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Access Denied. Authorization token required." });
    return;
  }

  if (token.startsWith("token-") || token.startsWith("oauth-token-")) {
    const parts = token.split("-");
    const email = token.startsWith("oauth-token-") ? parts[2] : parts[1];
    if (!email) {
      res.status(401).json({ error: "Access Denied: Invalid Token." });
      return;
    }
    
    const targetEmail = email;
    const userObj = db.users.find((u) => u.email.toLowerCase() === targetEmail.toLowerCase());
    if (userObj) {
      (req as any).user = userObj;
      next();
      return;
    }
  }
  res.status(403).json({ error: "Invalid or expired authorization token." });
};

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
app.post("/api/login", (req, res) => {
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

  const savedPass = dbPasswords[normalizedEmail];
  if (!savedPass || !bcrypt.compareSync(password, savedPass)) {
    res.status(400).json({ error: "Invalid secure password. Try again." });
    return;
  }

  const token = `token-${userObj.email}-${Date.now()}`;
  res.json({
    token,
    email: userObj.email,
    isAdmin: !!userObj.isAdmin,
  });
});

// 9. POST /api/register
app.post("/api/register", (req, res) => {
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
  };

  db.users.push(newUser);
  dbPasswords[normalizedEmail] = bcrypt.hashSync(password, 10);
  saveDB();

  const token = `token-${newUser.email}-${Date.now()}`;
  res.status(201).json({
    token,
    email: newUser.email,
    isAdmin: newUser.isAdmin,
  });
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

// MAIL SYSTEM
const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

app.get("/api/env-debug", (req, res) => {
  res.json({
    MAIL_USER: process.env.MAIL_USER || "MISSING",
    MAIL_PASS: process.env.MAIL_PASS ? "SET" : "MISSING",
  });
});

app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email address is required." });
    return;
  }
  loadDB();
  const normalizedEmail = email.trim().toLowerCase();
  const userObj = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!userObj) {
    res.json({ success: true, message: "If that email exists, a reset link will be sent." });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = Date.now() + 3600000; // 1 hour
  resetTokens[normalizedEmail] = { token, expiry };
  saveDB();

  const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost:3000";
  const proto = req.headers["x-forwarded-proto"] || "http";
  const resetLink = process.env.APP_URL 
    ? `${process.env.APP_URL}?reset=true&token=${token}&email=${encodeURIComponent(normalizedEmail)}`
    : `${proto}://${host}?reset=true&token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

  try {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
        console.warn("MAIL_USER and MAIL_PASS are not set. The reset link is: " + resetLink);
        res.json({ 
          success: true, 
          message: "Secrets missing. If you are the developer, check server logs for the link. Otherwise, please configure MAIL_USER and MAIL_PASS." 
        });
    } else {
        await mailTransporter.sendMail({
          from: `"Divine Obsession" <${process.env.MAIL_USER}>`,
          to: normalizedEmail,
          subject: "Divine Obsession Password Reset",
          text: `Some obsessions are worth protecting. This is your reminder to protect yours.\n\nWe received a request to reset the password associated with your Divine Obsession account.\n\nClick the link below to create a new password and regain access to your account:\n${resetLink}\n\nIf you didn't request this reset, you can safely ignore this email.\n\nStay inspired. Stay obsessed.\n\n— Team Divine Obsession`,
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
        <div class="headline">Some obsessions are worth protecting. This is your reminder to protect yours.</div>
        <div class="text-content">
          <p>We received a request to reset the password associated with your Divine Obsession account.</p>
          <p>Click the button below to create a new password and regain access to your account.</p>
          
          <div class="button-container">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>
          
          <div class="footer-divider"></div>
          
          <div class="footer">
            <p>If you didn't request this reset, you can safely ignore this email.</p>
          </div>
          <div class="sign-off">Stay inspired. Stay obsessed.<br><br>— Team Divine Obsession</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
        });
        res.json({ success: true, message: "If that email exists, a reset link will be sent." });
    }
  } catch (err: any) {
    console.error("Failed to send email:", err);
    res.status(500).json({ error: "Failed to send reset email due to server error. " + (err.message || "") });
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

export const api = onRequest(app);

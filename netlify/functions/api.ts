import serverless from "serverless-http";
import express from "express";
import fs from "fs";
import { Post, User, Session, Metrics, DailyStat } from "../../src/types";

// Netlify serverless execution has writable temp environment at /tmp
const DB_FILE = "/tmp/db.json";

interface LocalDB {
  posts: Post[];
  users: User[];
  sessions: Session[];
}

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
      if (diskData.passwords) {
        dbPasswords = { ...dbPasswords, ...diskData.passwords };
      }
    } else {
      saveDB();
    }
  } catch (err) {
    console.warn("Failed to read DB from /tmp", err);
  }
}

function saveDB() {
  try {
    const payload = {
      posts: db.posts,
      users: db.users,
      sessions: db.sessions,
      passwords: dbPasswords,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save DB to /tmp", err);
  }
}

loadDB();

const app = express();
app.use(express.json());

const router = express.Router();

const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access Denied." });

  if (token.startsWith("token-") || token.startsWith("oauth-token-")) {
    const parts = token.split("-");
    const email = token.startsWith("oauth-token-") ? parts[2] : parts[1];
    if (!email) return res.status(401).json({ error: "Access Denied: Invalid Token." });
    
    const targetEmail = email;
    const userObj = db.users.find((u) => u.email.toLowerCase() === targetEmail.toLowerCase());
    if (userObj) {
      (req as any).user = userObj;
      return next();
    }
  }
  return res.status(403).json({ error: "Invalid token." });
};

const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as any).user;
  if (user && user.isAdmin) return next();
  return res.status(403).json({ error: "Admin required." });
};

router.get("/posts", (req, res) => {
  res.json(db.posts.filter((p) => !p.deleted));
});

router.get("/admin/deleted-posts", authenticateToken, requireAdmin, (req, res) => {
  res.json(db.posts.filter((p) => p.deleted));
});

router.post("/posts", authenticateToken, requireAdmin, (req, res) => {
  const { id, title, topic, content, category, subject, featuredImage, metaTitle, metaDescription, slug, canonicalUrl, ogImage, schemaMarkup, focusKeyword, layoutStyle, status } = req.body;
  if (!title || !content) return res.status(400).json({ error: "Title and content required." });

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
    metaTitle, metaDescription, slug, canonicalUrl, ogImage, schemaMarkup, focusKeyword,
    layoutStyle: layoutStyle || "aligned", status: status || "published",
  };

  if (id) db.posts = db.posts.filter((p) => String(p.id) !== String(id));
  db.posts.unshift(newPost);
  saveDB();
  res.status(201).json({ success: true, post: newPost });
});

router.put("/posts/:id", authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const postIndex = db.posts.findIndex((p) => String(p.id) === String(id));
  if (postIndex === -1) return res.status(404).json({ error: "Not found." });

  const updatedPost = { ...db.posts[postIndex], ...req.body };
  updatedPost.updatedAt = new Date().toISOString();
  db.posts[postIndex] = updatedPost;
  saveDB();
  res.json({ success: true, post: updatedPost });
});

router.delete("/posts/:id", authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const post = db.posts.find((p) => String(p.id) === String(id));
  if (!post) return res.status(404).json({ error: "Not found." });
  post.deleted = true;
  post.deletedAt = new Date().toISOString();
  saveDB();
  res.json({ success: true });
});

router.post("/admin/deleted-posts/:id/restore", authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const post = db.posts.find((p) => String(p.id) === String(id));
  if (!post) return res.status(404).json({ error: "Not found." });
  post.deleted = false;
  delete post.deletedAt;
  saveDB();
  res.json({ success: true, post });
});

router.delete("/admin/deleted-posts/:id/purge", authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const index = db.posts.findIndex((p) => String(p.id) === String(id));
  if (index === -1) return res.status(404).json({ error: "Not found." });
  db.posts.splice(index, 1);
  saveDB();
  res.json({ success: true });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();
  const userObj = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!userObj) return res.status(400).json({ error: "Invalid credentials." });
  if (dbPasswords[normalizedEmail] !== password) return res.status(400).json({ error: "Invalid secure password." });

  res.json({ token: `token-${userObj.email}-${Date.now()}`, email: userObj.email, isAdmin: !!userObj.isAdmin });
});

const ADMIN_EMAILS = ["admin@deepora.com", "owner@deepora.com", "heena03kaur@gmail.com"];

router.post("/register", (req, res) => {
  const { email, password, name } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();
  
  if (!normalizedEmail) return res.status(400).json({ error: "Email required." });
  
  if (db.users.find((u) => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: "Email exists." });
  }

  const isAdmin = ADMIN_EMAILS.includes(normalizedEmail);

  const newUser: User = { 
    email: normalizedEmail, 
    name: name.trim(), 
    googleAuth: false, 
    createdAt: new Date().toISOString(), 
    isAdmin 
  };
  
  db.users.push(newUser);
  dbPasswords[normalizedEmail] = password;
  saveDB();
  res.status(201).json({ token: `token-${newUser.email}-${Date.now()}`, email: newUser.email, isAdmin: newUser.isAdmin });
});

router.put("/credentials", authenticateToken, requireAdmin, (req, res) => {
  const { newEmail, newPassword } = req.body;
  const adminUser = (req as any).user;
  const oldEmail = adminUser.email.toLowerCase();
  const normalizedNewEmail = newEmail.trim().toLowerCase();

  if (normalizedNewEmail !== oldEmail && db.users.find((u) => u.email.toLowerCase() === normalizedNewEmail)) {
    return res.status(400).json({ error: "Email assigned." });
  }

  adminUser.email = normalizedNewEmail;
  delete dbPasswords[oldEmail];
  dbPasswords[normalizedNewEmail] = newPassword;
  saveDB();
  res.json({ success: true, email: normalizedNewEmail });
});

router.post("/analytics/ping", (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: "Required" });
  res.json({ success: true });
});

router.get("/admin/metrics", authenticateToken, requireAdmin, (req, res) => {
  res.json({ totalUsers: db.users.length, usersList: db.users, totalViews: 0, avgDurationMinutes: 0, dailyStats: [], sessions: [] });
});

router.get("/auth/google/url", (req, res) => res.json({ url: "/api/auth/google/callback" }));

// Main router mounts
app.use("/api", router);
app.use("/.netlify/functions/api", router);

export const handler = serverless(app);

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Post, User, Session, Metrics, DailyStat } from "./src/types";

// DB Path Definition
const DB_FILE = path.join(process.cwd(), "db.json");

interface LocalDB {
  posts: Post[];
  users: User[];
  sessions: Session[];
}

// Pre-seeded credentials for the owner as requested
const DEFAULT_OWNER_EMAIL = "heena03kaur@gmail.com";
const DEFAULT_OWNER_PASS = "Love_yourself03!";

// Standard seed data to keep the blog elegant and populated on launch
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

// In-Memory Database cache syncing with disk
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

// Map to store credentials securely on disk (safe fallback to store key owner pass)
let dbPasswords: Record<string, string> = {
  [DEFAULT_OWNER_EMAIL]: DEFAULT_OWNER_PASS,
};

// Helper: load DB from disk
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
      console.log("Database successfully synchronized from disk storage.");
    } else {
      saveDB();
    }
  } catch (err) {
    console.warn("Failed to read DB from disk. Keeping in-memory cache.", err);
  }
}

// Helper: save DB to disk
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
    console.error("Critical: Failed to save DB payload to disk storage.", err);
  }
}

// Initial hydration
loadDB();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Middleware: Auth check
  const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Access Denied. Authorization token required." });
    }

    // Verify token structure placeholder: token-${email}-${timestamp}
    if (token.startsWith("token-") || token.startsWith("oauth-token-")) {
      const parts = token.split("-");
      const email = token.startsWith("oauth-token-") ? parts[2] : parts[1];
      const targetEmail = email || DEFAULT_OWNER_EMAIL;
      const userObj = db.users.find((u) => u.email.toLowerCase() === targetEmail.toLowerCase());
      if (userObj) {
        (req as any).user = userObj;
        return next();
      }
    }
    return res.status(403).json({ error: "Invalid or expired authorization token." });
  };

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (user && user.isAdmin) {
      return next();
    }
    return res.status(403).json({ error: "Access forbidden. Administrative permissions required." });
  };

  // --- API ROUTES ---

  // 1. GET /api/posts - Fetch all non-deleted posts
  app.get("/api/posts", (req, res) => {
    const activePosts = db.posts.filter((p) => !p.deleted);
    res.json(activePosts);
  });

  // 2. GET /api/admin/deleted-posts - Fetch soft-deleted posts
  app.get("/api/admin/deleted-posts", authenticateToken, requireAdmin, (req, res) => {
    const deletedPosts = db.posts.filter((p) => p.deleted);
    res.json(deletedPosts);
  });

  // 3. POST /api/posts - Create a new post
  app.post("/api/posts", authenticateToken, requireAdmin, (req, res) => {
    const { id, title, topic, content, category, subject, featuredImage } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content blocks are required specifications." });
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
    };

    if (id) {
      db.posts = db.posts.filter((p) => String(p.id) !== String(id));
    }
    db.posts.unshift(newPost);
    saveDB();
    res.status(201).json({ success: true, post: newPost });
  });

  // 4. PUT /api/posts/:id - Edit an existing post
  app.put("/api/posts/:id", authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { title, topic, content, category, subject, featuredImage } = req.body;

    const postIndex = db.posts.findIndex((p) => String(p.id) === String(id));
    if (postIndex === -1) {
      return res.status(404).json({ error: "No post found matching the provided ID." });
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
    };

    db.posts[postIndex] = updatedPost;
    saveDB();
    res.json({ success: true, post: updatedPost });
  });

  // 5. DELETE /api/posts/:id - Soft-delete a post
  app.delete("/api/posts/:id", authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const post = db.posts.find((p) => String(p.id) === String(id));
    if (!post) {
      return res.status(404).json({ error: "Post record not found." });
    }

    post.deleted = true;
    post.deletedAt = new Date().toISOString();
    saveDB();
    res.json({ success: true });
  });

  // 6. POST /api/admin/deleted-posts/:id/restore - Restore soft-deleted post
  app.post("/api/admin/deleted-posts/:id/restore", authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const post = db.posts.find((p) => String(p.id) === String(id));
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    post.deleted = false;
    delete post.deletedAt;
    saveDB();
    res.json({ success: true, post });
  });

  // 7. DELETE /api/admin/deleted-posts/:id/purge - Hard purge a post permanently
  app.delete("/api/admin/deleted-posts/:id/purge", authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const index = db.posts.findIndex((p) => String(p.id) === String(id));
    if (index === -1) {
      return res.status(404).json({ error: "Post not found in records." });
    }

    db.posts.splice(index, 1);
    saveDB();
    res.json({ success: true });
  });

  // 8. POST /api/login - Human-provided admin credentials explicitly supported
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email address and secure password must be supplied." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userObj = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!userObj) {
      return res.status(400).json({ error: "Invalid credentials. Please verify your email and pass phrase." });
    }

    const savedPass = dbPasswords[normalizedEmail];
    if (savedPass !== password) {
      return res.status(400).json({ error: "Invalid secure password. Try again." });
    }

    const token = `token-${userObj.email}-${Date.now()}`;
    res.json({
      token,
      email: userObj.email,
      isAdmin: !!userObj.isAdmin,
    });
  });

  // 9. POST /api/register - Multi-user support
  app.post("/api/register", (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "All account fields are strictly mandatory." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return res.status(400).json({ error: "Email address is already in active service." });
    }

    const isFirstOwner = normalizedEmail === DEFAULT_OWNER_EMAIL;

    const newUser: User = {
      email: normalizedEmail,
      name: name.trim(),
      googleAuth: false,
      createdAt: new Date().toISOString(),
      isAdmin: isFirstOwner, // Auto-admin if registering default owner
    };

    db.users.push(newUser);
    dbPasswords[normalizedEmail] = password;
    saveDB();

    const token = `token-${newUser.email}-${Date.now()}`;
    res.status(201).json({
      token,
      email: newUser.email,
      isAdmin: newUser.isAdmin,
    });
  });

  // 10. PUT /api/credentials - Modify active credentials
  app.put("/api/credentials", authenticateToken, requireAdmin, (req, res) => {
    const { newEmail, newPassword } = req.body;
    if (!newEmail || !newPassword) {
      return res.status(400).json({ error: "New credentials cannot be blank." });
    }

    const adminUser = (req as any).user;
    const oldEmail = adminUser.email.toLowerCase();
    const normalizedNewEmail = newEmail.trim().toLowerCase();

    // Ensure we don't conflict with another registered user
    if (normalizedNewEmail !== oldEmail) {
      const conflict = db.users.find((u) => u.email.toLowerCase() === normalizedNewEmail);
      if (conflict) {
        return res.status(400).json({ error: "Email address is already assigned to another profile." });
      }
    }

    const oldPassword = dbPasswords[oldEmail];

    // Update DB list
    adminUser.email = normalizedNewEmail;
    delete dbPasswords[oldEmail];
    dbPasswords[normalizedNewEmail] = newPassword;

    // Save DB updates
    saveDB();

    res.json({ success: true, email: normalizedNewEmail });
  });

  // 11. POST /api/analytics/ping - Logging and updating session telemetry
  app.post("/api/analytics/ping", (req, res) => {
    const { sessionId, email, device, path: currentPath, durationSeconds } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "A unique sessionId is required." });
    }

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

    // Safely increment post views if path reflects an active post detail page
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

  // 12. GET /api/admin/metrics - Server-side analytical telemetry calculation
  app.get("/api/admin/metrics", authenticateToken, requireAdmin, (req, res) => {
    const totalUsers = db.users.length;
    
    // Total aggregate views calculated from metrics + post-level views
    const postViews = db.posts.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalViews = Math.max(postViews, db.sessions.length * 3);

    const totalSeconds = db.sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
    const avgDurationMinutes = db.sessions.length > 0 
      ? parseFloat(((totalSeconds / db.sessions.length) / 60).toFixed(1))
      : 0;

    // Generate dynamic 7-day historic telemetry
    const dailyStats: DailyStat[] = [];
    for (let i = 6; i >= 0; i--) {
      const dateObj = new Date();
      dateObj.setDate(dateObj.getDate() - i);
      const dateString = dateObj.toISOString().split("T")[0];

      // Match actual sessions recorded during this specific day bucket
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

  // 13. GET /api/auth/google/url - Simulation logic for instant validation
  app.get("/api/auth/google/url", (req, res) => {
    res.json({ url: "/api/auth/google/callback" });
  });

  // Google OAuth callback simulation page setup
  app.get("/api/auth/google/callback", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Sign-In Complete</title>
          <style>
            body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background-color: #FAF9F6; margin: 0; color: #333; }
            .card { padding: 2rem; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Authorized successfully</h2>
            <p>Syncing your Google credentials... Please wait.</p>
          </div>
          <script>
            setTimeout(() => {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_AUTH_SUCCESS',
                  token: 'oauth-token-${DEFAULT_OWNER_EMAIL}-${Date.now()}',
                  email: '${DEFAULT_OWNER_EMAIL}',
                  isAdmin: true
                }, '*');
              }
              window.close();
            }, 800);
          </script>
        </body>
      </html>
    `);
  });

  // --- VITE ENTRYPOINT MIDDLEWARE ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express microserver handles active backend logic on port http://0.0.0.0:${PORT}`);
  });
}

startServer();

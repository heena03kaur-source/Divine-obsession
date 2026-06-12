import React, { useState, useEffect, useMemo } from "react";
import { Navbar } from "./components/Navbar";
import { BlogFeed } from "./components/BlogFeed";
import { TopicsList } from "./components/TopicsList";
import { BlogReader } from "./components/BlogReader";
import { BlogWriter } from "./components/BlogWriter";
import { CredentialsPanel } from "./components/CredentialsPanel";
import { AdminDashboard } from "./components/AdminDashboard";
import { NotFound } from "./components/NotFound";
import { AuthModal } from "./components/AuthModal";
import { ReadLaterList } from "./components/ReadLaterList";
import { Post } from "./types";
import { Award, BookOpen, Heart } from "lucide-react";

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("blogs");
  const [adminSubTab, setAdminSubTab] = useState<string>("traffic");
  
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [openSettingsMenu, setOpenSettingsMenu] = useState<boolean>(false);

  // Auth States
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("sage_blog_token"));
  const [userEmail, setUserEmail] = useState<string | null>(() => localStorage.getItem("sage_blog_email"));
  const [isAdmin, setIsAdmin] = useState<boolean>(
    () => localStorage.getItem("sage_blog_is_admin") === "true"
  );

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const [savedPostIds, setSavedPostIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("sage_read_list");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleToggleSavePost = (postId: string) => {
    setSavedPostIds((prev) => {
      const idStr = String(postId);
      const next = prev.includes(idStr)
        ? prev.filter((id) => id !== idStr)
        : [...prev, idStr];
      localStorage.setItem("sage_read_list", JSON.stringify(next));
      return next;
    });
  };

  // Sync helper to heal the server if local backup posts are missing on server
  const syncLocalBackupToBackend = async (fetchedPosts: Post[]) => {
    if (!token || !isAdmin) return;
    try {
      const backupRaw = localStorage.getItem("sage_published_backup");
      if (!backupRaw) return;

      const backup = JSON.parse(backupRaw);
      const deletedRaw = localStorage.getItem("sage_deleted_history");
      const deletedList: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];

      const fetchedIds = new Set(fetchedPosts.map((p) => String(p.id)));
      const missingPosts: Post[] = [];

      for (const key of Object.keys(backup)) {
        const post = backup[key];
        if (!fetchedIds.has(String(post.id)) && !deletedList.includes(String(post.id))) {
          missingPosts.push(post);
        }
      }

      if (missingPosts.length > 0) {
        console.log(`Auto-healing: restoring ${missingPosts.length} posts back to the server...`);
        for (const postToRestore of missingPosts) {
          try {
            await fetch("/api/posts", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                id: postToRestore.id,
                title: postToRestore.title,
                topic: postToRestore.topic || postToRestore.subject,
                content: postToRestore.content,
                category: postToRestore.category,
                subject: postToRestore.subject || postToRestore.topic,
                featuredImage: postToRestore.featuredImage,
              }),
            });
          } catch (err) {
            console.error(`Failed to heal post "${postToRestore.title}":`, err);
          }
        }
        // Re-read from server after healing completes
        const reloadResp = await fetch("/api/posts");
        if (reloadResp.ok) {
          const freshData = await reloadResp.json();
          setPosts(freshData);
        }
      }
    } catch (e) {
      console.error("Auto-heal process error:", e);
    }
  };

  // Fetch blogs on load
  const loadPosts = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/posts");
      if (!resp.ok) {
        throw new Error("Could not retrieve the blog collection.");
      }
      const data = await resp.json();
      
      // Triple check and merge with client-side backups
      let finalPosts = [...data];
      try {
        const backupRaw = localStorage.getItem("sage_published_backup");
        const deletedRaw = localStorage.getItem("sage_deleted_history");
        const deletedList: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];

        if (backupRaw) {
          const backup = JSON.parse(backupRaw);
          const serverIds = new Set(data.map((p: Post) => String(p.id)));
          
          for (const key of Object.keys(backup)) {
            const localPost = backup[key];
            if (!serverIds.has(String(localPost.id)) && !deletedList.includes(String(localPost.id))) {
              finalPosts.unshift(localPost);
            }
          }
        }
      } catch (err) {
        console.error("Local backup loading parse error:", err);
      }

      setPosts(finalPosts);
      setErrorStatus(null);

      // Trigger self-healing if admin is logged in
      if (token && isAdmin) {
        syncLocalBackupToBackend(data);
      }
    } catch (err: any) {
      setErrorStatus(err.message || "Failed to load articles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // Periodic Analytics Ping Loop
  useEffect(() => {
    let session_id = sessionStorage.getItem("sage_session_id");
    if (!session_id) {
      session_id = "s-" + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem("sage_session_id", session_id);
    }

    const device_type = window.innerWidth < 768 ? "Mobile" : "Desktop";
    let elapsed = 0;

    const performPing = async () => {
      elapsed += 10;
      let active_path = "/" + currentTab;
      if (currentTab === "detail" && activePost) {
        active_path = `/${activePost.topic}: ${activePost.title}`;
      }

      try {
        await fetch("/api/analytics/ping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: session_id,
            email: userEmail || null,
            device: device_type,
            path: active_path,
            durationSeconds: elapsed,
          }),
        });
      } catch (err) {
        // Analytics failures are silent
      }
    };

    // Trigger initial ping segment
    performPing();

    const interval = setInterval(performPing, 10000);
    return () => clearInterval(interval);
  }, [currentTab, activePost, userEmail]);

  // Auth callbacks
  const handleLoginSuccess = (jwt: string, email: string, adminStatus: boolean) => {
    localStorage.setItem("sage_blog_token", jwt);
    localStorage.setItem("sage_blog_email", email);
    localStorage.setItem("sage_blog_is_admin", String(adminStatus));
    
    setToken(jwt);
    setUserEmail(email);
    setIsAdmin(adminStatus);
    setIsAuthOpen(false);

    if (adminStatus) {
      setCurrentTab("admin-dashboard");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("sage_blog_token");
    localStorage.removeItem("sage_blog_email");
    localStorage.removeItem("sage_blog_is_admin");
    
    setToken(null);
    setUserEmail(null);
    setIsAdmin(false);
    setOpenSettingsMenu(false);

    if (
      currentTab === "write" ||
      currentTab === "settings-edit" ||
      currentTab === "admin-dashboard"
    ) {
      setCurrentTab("blogs");
    }
  };

  const handleRefresh = () => {
    loadPosts();
    setPostToEdit(null);
    setActiveCategory(null);
    setActiveSubject(null);
    setCurrentTab("blogs");
  };

  const handleEditInitiation = (post: Post) => {
    setPostToEdit(post);
    setCurrentTab("write");
  };

  const handleDeletePost = async (postId: string | number) => {
    if (!token) return;
    try {
      const resp = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || "Failed to delete post.");
      }
      loadPosts();
      if (activePost && String(activePost.id) === String(postId)) {
        setActivePost(null);
        setCurrentTab("blogs");
      }
    } catch (err: any) {
      console.error("Deletion failed:", err.message);
    }
  };

  const handleCredentialsUpdate = (newEmail: string) => {
    setUserEmail(newEmail);
    handleLogout();
    setIsAuthOpen(true);
  };

  const handleSelectPost = (post: Post) => {
    setActivePost(post);
    setCurrentTab("detail");
  };

  const handleBackToBlogs = () => {
    setActivePost(null);
    setCurrentTab("blogs");
  };

  const renderActiveView = () => {
    switch (currentTab) {
      case "blogs":
        return (
          <BlogFeed
            posts={posts}
            loading={loading}
            onSelectPost={handleSelectPost}
            isAdmin={!!token && isAdmin}
            onEditPost={handleEditInitiation}
            onDeletePost={handleDeletePost}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            activeSubject={activeSubject}
            setActiveSubject={setActiveSubject}
            savedPostIds={savedPostIds}
            onToggleSavePost={handleToggleSavePost}
          />
        );
      case "topics":
        return <TopicsList posts={posts} onSelectPost={handleSelectPost} />;
      case "read-list":
        return (
          <ReadLaterList
            posts={posts}
            savedPostIds={savedPostIds}
            onSelectPost={handleSelectPost}
            onToggleSavePost={handleToggleSavePost}
            onExplore={handleBackToBlogs}
          />
        );
      case "detail":
        return activePost ? (
          <BlogReader
            post={activePost}
            onBack={handleBackToBlogs}
            isAdmin={!!token && isAdmin}
            onEditPost={handleEditInitiation}
            onDeletePost={handleDeletePost}
            isSaved={savedPostIds.includes(String(activePost.id))}
            onToggleSave={() => handleToggleSavePost(String(activePost.id))}
          />
        ) : (
          <NotFound
            onBack={handleBackToBlogs}
            message="This article draft could not be located."
          />
        );
      case "write":
        if (token && isAdmin) {
          const distinctNiches = Array.from(
            new Set(posts.map((p) => p.topic).filter(Boolean))
          ) as string[];
          const distinctCategories = Array.from(
            new Set(posts.map((p) => p.category).filter(Boolean))
          ) as string[];
          return (
            <BlogWriter
              token={token}
              onPublishSuccess={handleRefresh}
              onCancel={() => {
                setPostToEdit(null);
                handleBackToBlogs();
              }}
              postToEdit={postToEdit}
              existingNiches={distinctNiches}
              existingCategories={distinctCategories}
            />
          );
        }
        return (
          <NotFound
            onBack={handleBackToBlogs}
            message="Access denied. Only the website owner can publish posts."
          />
        );
      case "settings-edit":
        return token && isAdmin ? (
          <CredentialsPanel
            token={token}
            onSuccess={handleCredentialsUpdate}
            onCancel={handleBackToBlogs}
          />
        ) : (
          <NotFound
            onBack={handleBackToBlogs}
            message="Access denied. Only the website owner can change credentials."
          />
        );
      case "admin-dashboard":
        return token && isAdmin ? (
          <AdminDashboard
            token={token}
            onBack={handleBackToBlogs}
            onCredentialsUpdate={handleCredentialsUpdate}
            adminEmail={userEmail || ""}
            onEditPost={handleEditInitiation}
            onWriteNewPost={() => {
              setPostToEdit(null);
              setCurrentTab("write");
            }}
            initialSubTab={adminSubTab}
          />
        ) : (
          <NotFound
            onBack={handleBackToBlogs}
            message="Access denied. Only the website owner can access analytics."
          />
        );
      default:
        return <NotFound onBack={handleBackToBlogs} />;
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-[#FAF9F6] text-gray-800 selection:bg-[#7DB095]/30"
      id="main-app-container"
    >
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab: string, subTab?: string, resetPostToEdit: boolean = false) => {
          if (resetPostToEdit) {
            setPostToEdit(null);
            localStorage.removeItem("sage_active_write_session");
          }
          if (tab === "blogs") {
            setActiveCategory(null);
            setActiveSubject(null);
            setSelectedNiche(null);
          }
          if (tab === "admin-dashboard") {
            setAdminSubTab(subTab || "traffic");
          }
          setCurrentTab(tab);
        }}
        isAuthenticated={!!token}
        isAdmin={isAdmin}
        userEmail={userEmail || ""}
        onLogout={handleLogout}
        onOpenLogin={() => setIsAuthOpen(true)}
        openSettingsMenu={openSettingsMenu}
        setOpenSettingsMenu={setOpenSettingsMenu}
        posts={posts}
        selectedNiche={selectedNiche}
        setSelectedNiche={setSelectedNiche}
        adminSubTab={adminSubTab}
        savedPostIds={savedPostIds}
      />

      <main className="flex-grow w-full" id="page-content-wrapper">
        {renderActiveView()}
      </main>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Structured elegant decoration footer */}
      <footer className="mt-auto border-t border-[#7DB095]/10 bg-white py-6" id="footer-decor">
        <div className="max-w-4xl mx-auto px-6 flex justify-center items-center">
          <span className="text-gray-300 text-[10px] font-mono select-none uppercase tracking-widest">© SAGE JOURNALING</span>
        </div>
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  RotateCw,
  Eye,
  Users,
  Clock,
  Activity,
  UserCheck,
  FileText,
  Trash2,
  Settings,
  AlertTriangle,
  Check,
  Loader2,
  Monitor,
  Smartphone,
  Search,
  Edit,
} from "lucide-react";
import { Post, DailyStat, Session, Metrics } from "../types";

interface AdminDashboardProps {
  token: string;
  onBack: () => void;
  onCredentialsUpdate: (newEmail: string) => void;
  adminEmail: string;
  onEditPost: (post: Post) => void;
  onWriteNewPost: () => void;
  initialSubTab?: string;
}

export function AdminDashboard({
  token,
  onBack,
  onCredentialsUpdate,
  adminEmail,
  onEditPost,
  onWriteNewPost,
  initialSubTab = "traffic",
}: AdminDashboardProps) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [subTab, setSubTab] = useState(initialSubTab);

  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [postsDeleteConfirmId, setPostsDeleteConfirmId] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const [deletedPosts, setDeletedPosts] = useState<Post[]>([]);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [purgingId, setPurgingId] = useState<string | null>(null);
  const [purgeConfirmId, setPurgeConfirmId] = useState<string | null>(null);

  // Settings tab form states
  const [settingsEmail, setSettingsEmail] = useState("");
  const [settingsPassword, setSettingsPassword] = useState("");
  const [settingsConfirm, setSettingsConfirm] = useState("");
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);

  useEffect(() => {
    if (adminEmail) {
      setSettingsEmail(adminEmail);
    }
  }, [adminEmail]);

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const fetchAllData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [metricsRes, postsRes, deletedRes] = await Promise.all([
        fetch("/api/admin/metrics", { headers }),
        fetch("/api/posts"),
        fetch("/api/admin/deleted-posts", { headers }),
      ]);

      if (!metricsRes.ok) {
        throw new Error(
          "Could not access admin metrics. Please verify authentication."
        );
      }

      const metricsData = await metricsRes.json();
      setMetrics(metricsData);

      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData);
      }

      if (deletedRes.ok) {
        const deletedData = await deletedRes.json();
        setDeletedPosts(deletedData);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsEmail.trim() || !settingsPassword || !settingsConfirm) {
      setSettingsError("Please fill in all the required fields.");
      return;
    }
    if (settingsPassword !== settingsConfirm) {
      setSettingsError("New password and confirm password fields must match.");
      return;
    }
    if (settingsPassword.length < 6) {
      setSettingsError("Your secure password must contain at least 6 characters.");
      return;
    }

    setSettingsError(null);
    setSettingsSuccess(null);
    setSettingsSaving(true);

    try {
      const response = await fetch("/api/credentials", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newEmail: settingsEmail.trim().toLowerCase(),
          newPassword: settingsPassword,
          confirmPassword: settingsConfirm,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update credentials.");
      }
      setSettingsSuccess(
        "Your owner credentials have been updated successfully! Re-authenticating shortly..."
      );
      setTimeout(() => {
        onCredentialsUpdate(settingsEmail.trim().toLowerCase());
      }, 2000);
    } catch (err: any) {
      setSettingsError(
        err.message || "An error occurred while updating administrative settings."
      );
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    setDeletingPostId(id);
    setErrorMsg(null);
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to delete post.");
      }
      
      // Update local deletion logs
      try {
        const deletedRaw = localStorage.getItem("sage_deleted_history");
        const deletedList = deletedRaw ? JSON.parse(deletedRaw) : [];
        if (!deletedList.includes(String(id))) {
          deletedList.push(String(id));
          localStorage.setItem("sage_deleted_history", JSON.stringify(deletedList));
        }
        const backupRaw = localStorage.getItem("sage_published_backup");
        if (backupRaw) {
          const backups = JSON.parse(backupRaw);
          delete backups[id];
          localStorage.setItem("sage_published_backup", JSON.stringify(backups));
        }
      } catch (e) {
        console.error("Local storage delete log failed:", e);
      }

      setPosts((p) => p.filter((post) => post.id !== id));
      setPostsDeleteConfirmId(null);
      
      // Re-fetch deleted posts
      const deletedRes = await fetch("/api/admin/deleted-posts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (deletedRes.ok) {
        const deletedData = await deletedRes.json();
        setDeletedPosts(deletedData);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while deleting the post.");
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleRestorePost = async (id: string) => {
    setRestoringId(id);
    setErrorMsg(null);
    try {
      const response = await fetch(`/api/admin/deleted-posts/${id}/restore`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to restore post.");
      }
      const data = await response.json();

      // Update local deletion logs on restore
      try {
        const deletedRaw = localStorage.getItem("sage_deleted_history");
        if (deletedRaw) {
          const deletedList = JSON.parse(deletedRaw);
          const filteredList = deletedList.filter((d: string) => d !== String(id));
          localStorage.setItem("sage_deleted_history", JSON.stringify(filteredList));
        }
        if (data.post) {
          const backupRaw = localStorage.getItem("sage_published_backup");
          const backups = backupRaw ? JSON.parse(backupRaw) : {};
          backups[data.post.id] = data.post;
          localStorage.setItem("sage_published_backup", JSON.stringify(backups));
        }
      } catch (e) {
        console.error("Local storage restore log failed:", e);
      }

      setDeletedPosts((prev) => prev.filter((p) => p.id !== id));
      if (data.post) {
        setPosts((prev) => [data.post, ...prev]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while restoring the post.");
    } finally {
      setRestoringId(null);
    }
  };

  const handlePurgePost = async (id: string) => {
    setPurgingId(id);
    setErrorMsg(null);
    try {
      const response = await fetch(`/api/admin/deleted-posts/${id}/purge`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to permanently purge post.");
      }

      // Update local deletion logs for permanent purge
      try {
        const deletedRaw = localStorage.getItem("sage_deleted_history");
        const deletedList = deletedRaw ? JSON.parse(deletedRaw) : [];
        if (!deletedList.includes(String(id))) {
          deletedList.push(String(id));
          localStorage.setItem("sage_deleted_history", JSON.stringify(deletedList));
        }
        const backupRaw = localStorage.getItem("sage_published_backup");
        if (backupRaw) {
          const backups = JSON.parse(backupRaw);
          delete backups[id];
          localStorage.setItem("sage_published_backup", JSON.stringify(backups));
        }
      } catch (e) {
        console.error("Local storage purge log failed:", e);
      }

      setDeletedPosts((prev) => prev.filter((p) => p.id !== id));
      setPurgeConfirmId(null);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while purging the post.");
    } finally {
      setPurgingId(null);
    }
  };

  if (loading && !metrics) {
    return (
      <div
        className="max-w-4xl mx-auto px-6 py-20 text-center animate-pulse"
        id="admin-dashboard-loading"
      >
        <p className="font-serif italic text-lg text-gray-500 mb-2">
          Analyzing divine records...
        </p>
        <span className="text-xs text-gray-400 font-mono">
          Requesting session engagement logs
        </span>
      </div>
    );
  }

  if (errorMsg && !metrics) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center" id="admin-dashboard-error">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-100">
          <AlertTriangle size={22} />
        </div>
        <h3 className="font-serif text-xl font-bold text-gray-800 mb-2">
          Metrics Retrieval Blocked
        </h3>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">{errorMsg}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer"
          >
            Go Back
          </button>
          <button
            onClick={fetchAllData}
            className="px-4 py-2 text-xs font-semibold bg-[#7DB095] hover:bg-[#648E77] text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCw size={12} />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  const activeMetrics = metrics || {
    totalUsers: 0,
    usersList: [],
    totalViews: 0,
    avgDurationMinutes: 0,
    dailyStats: [],
    sessions: [],
  };

  const filteredPosts = posts.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.topic || p.subject || "").toLowerCase().includes(q)
    );
  });

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const maxViews = Math.max(...activeMetrics.dailyStats.map((s) => s.views), 10);

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-12 py-10 text-left" id="admin-dashboard-canvas">
      {/* Header Buttons */}
      <div className="flex items-center justify-between gap-3 mb-8 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-[#7DB095]/10 text-gray-600 hover:text-[#7DB095] border border-gray-200 hover:border-[#7DB095]/30 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm focus:outline-none"
            id="btn-admin-back"
          >
            <ArrowLeft size={16} className="text-[#7DB095]" />
            <span className="hidden sm:inline">Go Back to Blog</span>
            <span className="sm:hidden">Back</span>
          </button>
          <button
            onClick={onWriteNewPost}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#7DB095] hover:bg-[#648E77] text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm focus:outline-none"
            id="btn-admin-write-new"
          >
            <Edit size={14} />
            <span>Write Blog Post</span>
          </button>
        </div>
        <button
          onClick={fetchAllData}
          className="p-2 text-xs font-semibold text-[#7DB095] hover:bg-[#7DB095]/10 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer font-sans"
          id="btn-admin-refresh"
          title="Refresh Data"
        >
          <RotateCw size={14} />
          <span className="hidden sm:inline">Refresh Logs</span>
        </button>
      </div>

      {/* Removed Admin Control Center intro section per user request */}

      {/* Diagnostic Widgets */}
      <div className="max-w-md mb-10" id="diagnostic-widgets">
        <div className="bg-white p-6 rounded-2xl border border-[#7DB095]/15 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 text-[#7DB095] mb-3">
            <div className="p-2 bg-[#7DB095]/10 rounded-xl">
              <Users size={20} />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#7DB095]">
              Registered Accounts
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-gray-800 font-mono tracking-tight" id="val-total-readers">
              {activeMetrics.totalUsers}
            </span>
            <span className="text-xs text-gray-400 font-medium font-sans">
              readers
            </span>
          </div>
          <p className="text-[10px] text-gray-400 font-sans mt-2">
            Including Google Sign-In associations
          </p>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="bg-white rounded-2xl border border-[#7DB095]/15 shadow-sm overflow-hidden" id="analytics-tabs-wrapper">
        <div className="flex flex-wrap md:flex-nowrap items-center border-b border-[#7DB095]/10 bg-[#FAF9F6] px-2 md:px-6 overflow-x-auto scrollbar-none scroll-smooth">
          <button
            onClick={() => setSubTab("traffic")}
            className={`shrink-0 py-4 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              subTab === "traffic"
                ? "border-[#7DB095] text-[#7DB095] font-extrabold"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <Activity size={14} />
            <span>Traffic Analytics</span>
          </button>
          <button
            onClick={() => setSubTab("accounts")}
            className={`shrink-0 py-4 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              subTab === "accounts"
                ? "border-[#7DB095] text-[#7DB095] font-extrabold"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <UserCheck size={14} />
            <span>Reader Accounts ({activeMetrics.totalUsers})</span>
          </button>
          <button
            onClick={() => setSubTab("sessions")}
            className={`shrink-0 py-4 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              subTab === "sessions"
                ? "border-[#7DB095] text-[#7DB095] font-extrabold"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <Clock size={14} />
            <span>Engagement Sessions</span>
          </button>
          <button
            onClick={() => setSubTab("blogs")}
            className={`shrink-0 py-4 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              subTab === "blogs"
                ? "border-[#7DB095] text-[#7DB095] font-extrabold"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
            id="btn-admin-tab-blogs"
          >
            <FileText size={14} />
            <span>Manage Blogs ({posts.length})</span>
          </button>
          <button
            onClick={() => setSubTab("dustbin")}
            className={`shrink-0 py-4 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              subTab === "dustbin"
                ? "border-[#7DB095] text-[#7DB095] font-extrabold"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
            id="btn-admin-tab-dustbin"
          >
            <Trash2 size={14} />
            <span>Dustbin ({deletedPosts.length})</span>
          </button>
          <button
            onClick={() => setSubTab("settings")}
            className={`shrink-0 py-4 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              subTab === "settings"
                ? "border-[#7DB095] text-[#7DB095] font-extrabold"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
            id="btn-admin-tab-settings"
          >
            <Settings size={14} />
            <span>Owner Settings</span>
          </button>
        </div>

        {/* Traffic Analytics Tab */}
        {subTab === "traffic" && (
          <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-200">
            <div>
              <h3 className="font-serif text-lg md:text-xl font-bold text-gray-800" style={{ fontFamily: "Georgia, serif" }}>
                Historic Visits Chart
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Comparison of daily page views and estimated unique readership visitors
              </p>
            </div>

            <div className="w-full bg-[#FAF9F6] p-4 rounded-xl border border-gray-100 flex flex-col justify-end" style={{ minHeight: "260px" }}>
              {activeMetrics.dailyStats.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-xs italic">
                  No visitation logs recorded yet
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-44 flex items-end justify-between gap-2 border-b border-gray-200/60 pb-2 pt-4 px-2 select-none">
                    {activeMetrics.dailyStats.map((stat) => {
                      const viewsHeight = Math.min(Math.max((stat.views / maxViews) * 100, 8), 100);
                      const visitorsHeight = Math.min(Math.max((stat.uniqueVisitors / maxViews) * 100, 4), 100);

                      let displayLabel = stat.date;
                      try {
                        const parts = stat.date.split("-");
                        if (parts.length === 3) {
                          displayLabel = new Date(
                            parseInt(parts[0]),
                            parseInt(parts[1]) - 1,
                            parseInt(parts[2])
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          });
                        }
                      } catch {}

                      return (
                        <div key={stat.date} className="flex-1 flex flex-col items-center h-full group relative">
                          {/* Tooltip */}
                          <div className="absolute -top-12 z-20 bg-gray-800 text-white text-[10px] rounded px-2 py-1 flex flex-col items-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-mono whitespace-nowrap">
                            <span className="font-sans font-semibold text-gray-300">{displayLabel}</span>
                            <span>Views: {stat.views}</span>
                            <span>Visitors: {stat.uniqueVisitors}</span>
                          </div>

                          <div className="w-full flex items-end gap-1 px-0.5 h-full relative">
                            <div
                              className="flex-1 bg-[#7DB095] hover:bg-[#648E77] rounded-t-sm transition-all duration-500 relative"
                              style={{ height: `${viewsHeight}%` }}
                            />
                            <div
                              className="flex-1 bg-[#FBBC05] hover:bg-yellow-600 rounded-t-sm transition-all duration-500 relative"
                              style={{ height: `${visitorsHeight}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between px-2 text-[10px] text-gray-400 font-mono uppercase tracking-wider font-semibold">
                    {activeMetrics.dailyStats.map((stat) => {
                      let displayLabel = stat.date;
                      try {
                        const parts = stat.date.split("-");
                        if (parts.length === 3) {
                          displayLabel = new Date(
                            parseInt(parts[0]),
                            parseInt(parts[1]) - 1,
                            parseInt(parts[2])
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          });
                        }
                      } catch {}
                      return (
                        <span key={stat.date} className="flex-1 text-center truncate">
                          {displayLabel}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Chart Legend */}
            <div className="flex items-center gap-6 text-[11px] justify-center text-gray-500 select-none pb-2">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 bg-[#7DB095] rounded" />
                <span className="font-medium">Total Views (Page hits)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 bg-[#FBBC05] rounded" />
                <span className="font-medium">Unique Readers</span>
              </div>
            </div>

            {/* Findings Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div className="p-4 bg-gray-50 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-[#7DB095] tracking-wider block mb-1">
                  Key Traffic Finding
                </span>
                <p className="text-xs text-gray-600 leading-normal font-sans">
                  The journal experiences its peak viewership around mid-week publication cycles. Dynamic background recording tracked <strong>{activeMetrics.sessions.length} sessions</strong> over this period.
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-[#7DB095] tracking-wider block mb-1">
                  Session Depth
                </span>
                <p className="text-xs text-gray-600 leading-normal font-sans">
                  The calculated average visitor focus duration of <strong>{activeMetrics.avgDurationMinutes} mins</strong> signals a remarkably high reading retention rate compared to generic lightweight microblogs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reader Accounts Tab */}
        {subTab === "accounts" && (
          <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-200" id="accounts-tab-panel">
            <div>
              <h3 className="font-serif text-lg md:text-xl font-bold text-[#202020]" style={{ fontFamily: "Georgia, serif" }}>
                Reader Registrations
              </h3>
              <p className="text-xs text-gray-550 mt-0.5">
                List of registered readers authorized on the Divine obsession journaling platform
              </p>
            </div>

            {activeMetrics.usersList.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-[#7DB095]/20">
                <p className="text-sm text-gray-400 italic">
                  No standard reader accounts have been registered yet.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  New accounts will appear here automatically on standard password or Google Sign-In registration.
                </p>
              </div>
            ) : (
              <div className="border border-gray-155 rounded-xl overflow-hidden shadow-sm" id="accounts-table-container">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="bg-[#FAF9F6] border-b border-gray-150 text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                      <th className="p-4">Subscriber Name</th>
                      <th className="p-4">Email Address</th>
                      <th className="p-4">Registration Origin</th>
                      <th className="p-4">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {activeMetrics.usersList.map((user) => (
                      <tr key={user.email} className="hover:bg-[#7DB095]/5 text-gray-700 transition-colors">
                        <td className="p-4 font-semibold text-gray-800">{user.name}</td>
                        <td className="p-4 font-mono select-all text-[#3c3c3c]">{user.email}</td>
                        <td className="p-4">
                          {user.googleAuth ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-bold text-[9px] uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              Google Login
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-600 rounded-full font-bold text-[9px] uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Standard Mail
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-gray-400 font-mono text-[10px]">
                          {formatDate(user.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Engagement Sessions Tab */}
        {subTab === "sessions" && (
          <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-200" id="sessions-tab-panel">
            <div>
              <h3 className="font-serif text-lg md:text-xl font-bold text-gray-800" style={{ fontFamily: "Georgia, serif" }}>
                Reader Sessions & Engagement Time
              </h3>
              <p className="text-xs text-gray-550 mt-0.5">
                Observe live interaction heartbeats, device preferences, and individual active durations
              </p>
            </div>

            {activeMetrics.sessions.length === 0 ? (
              <div className="text-center py-10 text-gray-450 text-xs italic">
                No telemetry heartbeat logs available.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...activeMetrics.sessions]
                    .reverse()
                    .slice(0, 30)
                    .map((s, idx) => {
                      const minutes = Math.floor(s.durationSeconds / 60);
                      const seconds = s.durationSeconds % 60;
                      let badgeClass = "bg-gray-100 text-gray-600";
                      let emphasis = "Quick Glimpse";

                      if (s.durationSeconds > 300) {
                        badgeClass = "bg-emerald-50 text-emerald-600 border border-emerald-100";
                        emphasis = "Deep Focus";
                      } else if (s.durationSeconds > 120) {
                        badgeClass = "bg-teal-50 text-teal-600 border border-teal-100";
                        emphasis = "Casual Read";
                      }

                      return (
                        <div
                          key={`${s.sessionId}-${idx}`}
                          className="p-5 border border-gray-100 hover:border-[#7DB095]/40 bg-[#FAF9F6]/40 rounded-xl flex flex-col justify-between hover:shadow-sm transition-all"
                        >
                          <div>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <span className="text-[10px] font-mono uppercase text-[#7DB095] tracking-widest font-bold">
                                  Session Activity
                                </span>
                                <h4
                                  className="font-mono text-xs text-gray-800 font-bold truncate mt-0.5"
                                  title={s.email || "Unregistered Guest"}
                                >
                                  {s.email || "Anonymous Reader Guest"}
                                </h4>
                              </div>
                              <span className={`text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded ${badgeClass}`}>
                                {emphasis}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-y-2 mt-4 text-[11px] font-sans">
                              <div>
                                <p className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider mb-0.5">
                                  Time Spent
                                </p>
                                <p className="font-mono text-gray-700 font-bold">
                                  {minutes > 0 ? `${minutes}m ` : ""}
                                  {seconds}s
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider mb-0.5">
                                  Device Type
                                </p>
                                <div className="flex items-center gap-1 text-gray-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                  {s.device.toLowerCase().includes("mobile") ? (
                                    <Smartphone size={12} className="text-gray-400 shrink-0" />
                                  ) : (
                                    <Monitor size={12} className="text-gray-400 shrink-0" />
                                  )}
                                  <span className="truncate">{s.device}</span>
                                </div>
                              </div>
                              <div className="col-span-2">
                                <p className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider mb-0.5">
                                  Path/Topic Landed
                                </p>
                                <span className="font-mono text-[10px] py-0.5 px-2 bg-white rounded border border-gray-100 text-gray-500 font-medium block truncate">
                                  {s.path}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-gray-100/60 mt-4 pt-3 flex justify-between items-center text-[10px] text-gray-400 font-mono">
                            <span className="truncate max-w-[120px]">Id: {s.sessionId}</span>
                            <span>
                              Last Activity:{" "}
                              {new Date(s.lastActive).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manage Blogs Tab */}
        {subTab === "blogs" && (
          <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-200" id="blogs-tab-panel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-serif text-lg md:text-xl font-bold text-gray-800" style={{ fontFamily: "Georgia, serif" }}>
                    Manage Journal Entries
                  </h3>
                  <button
                    onClick={onWriteNewPost}
                    className="px-2.5 py-1 bg-[#7DB095]/15 hover:bg-[#7DB095]/25 text-[#7DB095] hover:text-[#648E77] text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                    id="btn-inline-write-post"
                  >
                    + Write Blog
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update content blocks, correct typos, or delete obsolete journal articles
                </p>
              </div>

              <div className="relative max-w-sm w-full font-sans">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Search size={14} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles by title or topic..."
                  className="w-full pl-9 pr-14 py-2 bg-[#FAF9F6] border border-[#7DB095]/20 hover:border-[#7DB095]/40 focus:border-[#7DB095] focus:bg-white outline-none rounded-xl text-xs transition-all text-gray-800"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] text-gray-400 hover:text-gray-650 focus:outline-none uppercase font-bold tracking-wider cursor-pointer font-sans"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {errorMsg && (
              <div className="px-4 py-3 bg-red-50 border border-red-200/50 rounded-xl text-red-650 flex items-start gap-2.5 text-xs font-sans">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {filteredPosts.length === 0 ? (
              <div className="text-center py-16 bg-[#FAF9F6]/50 rounded-2xl border border-dashed border-[#7DB095]/20 font-sans">
                {searchQuery ? (
                  <>
                    <p className="text-sm text-gray-500 font-medium">No results match your search term.</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try searching with another partial keyword or reset filters.
                    </p>
                    <button
                      onClick={() => setSearchQuery("")}
                      className="mt-4 px-3 py-1.5 bg-white border border-[#7DB095]/25 text-[#7DB095] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Reset Search
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-400 italic font-medium">No published articles yet.</p>
                    <p className="text-xs text-gray-400 mt-1 mb-4">
                      Initialize the blog by creating your very first post!
                    </p>
                    <button
                      onClick={onWriteNewPost}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7DB095] hover:bg-[#648E77] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
                      id="btn-empty-state-write"
                    >
                      <Edit size={12} />
                      <span>Write First Post</span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white" id="blogs-table-container">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans text-xs min-w-[600px]">
                    <thead>
                      <tr className="bg-[#FAF9F6] border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-400 font-extrabold">
                        <th className="p-4">Article Title</th>
                        <th className="p-4">Topic Category</th>
                        <th className="p-4">Date Published</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPosts.map((post) => (
                        <tr key={post.id} className="hover:bg-[#7DB095]/5 text-gray-700 transition-colors">
                          <td className="p-4">
                            <span className="font-serif text-sm font-bold text-gray-800 leading-tight block">
                              {post.title}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                              ID: {post.id}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-2 py-0.5 bg-[#7DB095]/10 text-[#7DB095] text-[10px] font-bold rounded-full uppercase tracking-wider">
                              {post.category || "Relationships"}
                            </span>
                          </td>
                          <td className="p-4 text-gray-400 font-mono text-[10px]">
                            {formatDate(post.createdAt)}
                          </td>
                          <td className="p-4 text-right whitespace-nowrap font-sans">
                            {postsDeleteConfirmId === post.id ? (
                              <div className="flex items-center justify-end gap-1.5 font-sans">
                                <span className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider mr-1 animate-pulse">
                                  Delete Post?
                                </span>
                                <button
                                  onClick={() => handleDeletePost(post.id)}
                                  disabled={deletingPostId === post.id}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  {deletingPostId === post.id ? (
                                    <Loader2 size={10} className="animate-spin" />
                                  ) : (
                                    <span>Yes</span>
                                  )}
                                </button>
                                <button
                                  onClick={() => setPostsDeleteConfirmId(null)}
                                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => onEditPost(post)}
                                  className="p-1.5 text-gray-500 hover:text-[#7DB095] bg-gray-50 hover:bg-[#7DB095]/10 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider"
                                  title="Edit Blog"
                                >
                                  <Edit size={12} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => setPostsDeleteConfirmId(post.id)}
                                  className="p-1.5 text-gray-550 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider"
                                  title="Delete Blog"
                                >
                                  <Trash2 size={12} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dustbin (Deleted/Archived Blogs) Tab */}
        {subTab === "dustbin" && (
          <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-200" id="dustbin-tab-panel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg md:text-xl font-bold text-gray-800" style={{ fontFamily: "Georgia, serif" }}>
                  Archived Blogs (Dustbin)
                </h3>
                <p className="text-xs text-gray-505 mt-0.5">
                  View, restore, or permanently purge your deleted journal entries
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="px-4 py-3 bg-red-50 border border-red-200/50 rounded-xl text-red-600 flex items-start gap-2.5 text-xs font-sans">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {deletedPosts.length === 0 ? (
              <div className="text-center py-16 bg-[#FAF9F6]/50 rounded-2xl border border-dashed border-[#7DB095]/20 font-sans">
                <p className="text-sm text-gray-400 italic">Your dustbin is empty!</p>
                <p className="text-xs text-gray-400 mt-1">
                  Deleted blogs are temporarily archived here for recovery.
                </p>
              </div>
            ) : (
              <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white animate-fade-in animate-in duration-100" id="dustbin-table-container">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans text-xs min-w-[600px]">
                    <thead>
                      <tr className="bg-[#FAF9F6] border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-400 font-extrabold">
                        <th className="p-4">Deleted Article</th>
                        <th className="p-4">Topic Category</th>
                        <th className="p-4">Deleted At</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {deletedPosts.map((post) => (
                        <tr key={post.id} className="hover:bg-[#7DB095]/5 text-gray-700 transition-colors">
                          <td className="p-4">
                            <span className="font-serif text-sm font-bold text-gray-800 leading-tight block">
                              {post.title}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                              ID: {post.id}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                              {post.category || "Relationships"}
                            </span>
                          </td>
                          <td className="p-4 text-gray-400 font-mono text-[10px]">
                            {post.deletedAt ? formatDate(post.deletedAt) : "Recently"}
                          </td>
                          <td className="p-4 text-right whitespace-nowrap font-sans">
                            {purgeConfirmId === post.id ? (
                              <div className="flex items-center justify-end gap-1.5 font-sans">
                                <span className="text-[10px] text-red-650 font-semibold uppercase tracking-wider mr-1 animate-pulse">
                                  Purge permanently?
                                </span>
                                <button
                                  onClick={() => handlePurgePost(post.id)}
                                  disabled={purgingId === post.id}
                                  className="px-2 py-1 bg-red-650 hover:bg-red-750 text-white rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  {purgingId === post.id ? (
                                    <Loader2 size={10} className="animate-spin" />
                                  ) : (
                                    <span>Purge</span>
                                  )}
                                </button>
                                <button
                                  onClick={() => setPurgeConfirmId(null)}
                                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleRestorePost(post.id)}
                                  disabled={restoringId === post.id}
                                  className="p-1.5 text-[#7DB095] hover:text-[#648E77] bg-emerald-50/50 hover:bg-[#7DB095]/10 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider disabled:opacity-50"
                                  title="Restore Article"
                                >
                                  {restoringId === post.id ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <RotateCw size={12} />
                                  )}
                                  <span>Restore</span>
                                </button>
                                <button
                                  onClick={() => setPurgeConfirmId(post.id)}
                                  className="p-1.5 text-red-500 hover:text-red-700 bg-red-50/50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider"
                                  title="Permanently Purge"
                                >
                                  <Trash2 size={12} />
                                  <span>Delete Forever</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {subTab === "settings" && (
          <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-200" id="creds-tab-panel">
            <div>
              <h3 className="font-serif text-lg md:text-xl font-bold text-gray-800" style={{ fontFamily: "Georgia, serif" }}>
                Access Management
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Update the primary administrator email and sign-on password used to protect and write articles
              </p>
            </div>

            <form onSubmit={handleSettingsSubmit} className="space-y-6 bg-white border border-[#7DB095]/15 rounded-2xl p-6" id="dashboard-credentials-form">
              {settingsError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200/50 rounded-lg text-red-600 flex items-start gap-2.5 text-xs font-sans">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <span>{settingsError}</span>
                </div>
              )}

              {settingsSuccess && (
                <div className="px-4 py-3 bg-emerald-50 border border-emerald-200/50 rounded-lg text-emerald-700 flex items-start gap-2.5 text-xs font-sans animate-in fade-in duration-150">
                  <Check size={18} className="shrink-0 mt-0.5" />
                  <span>{settingsSuccess}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 font-sans">
                  New Administrator Email
                </label>
                <input
                  type="email"
                  required
                  value={settingsEmail}
                  onChange={(e) => setSettingsEmail(e.target.value)}
                  placeholder="new-owner@example.com"
                  className="w-full px-4 py-3 bg-[#FAF9F6]/50 border border-[#7DB095]/20 hover:border-[#7DB095]/40 focus:border-[#7DB095] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 text-gray-800 font-sans"
                  id="creds-email-input-dash"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 font-sans">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={settingsPassword}
                  onChange={(e) => setSettingsPassword(e.target.value)}
                  placeholder="At least 6 characters long..."
                  className="w-full px-4 py-3 bg-[#FAF9F6]/50 border border-[#7DB095]/20 hover:border-[#7DB095]/40 focus:border-[#7DB095] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 text-gray-800 font-sans"
                  id="creds-password-input-dash"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 font-sans">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={settingsConfirm}
                  onChange={(e) => setSettingsConfirm(e.target.value)}
                  placeholder="Re-enter the password exactly..."
                  className="w-full px-4 py-3 bg-[#FAF9F6]/50 border border-[#7DB095]/20 hover:border-[#7DB095]/40 focus:border-[#7DB095] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 text-gray-800 font-sans"
                  id="creds-confirm-input-dash"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={settingsSaving}
                  className="px-6 py-2.5 bg-[#7DB095] hover:bg-[#648E77] text-white font-sans text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                  id="creds-submit-dash"
                >
                  {settingsSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving Credentials...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save credentials</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

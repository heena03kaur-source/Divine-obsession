import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  X,
  Sparkles,
  Heart,
  Users,
  Coins,
  Compass,
  Globe,
  Loader2,
  BookOpen,
  Hash,
  Activity,
  Award,
} from "lucide-react";
import { Post } from "../types";
import { BlogCard } from "./BlogCard";

interface BlogFeedProps {
  posts: Post[];
  loading: boolean;
  onSelectPost: (post: Post) => void;
  isAdmin: boolean;
  onEditPost: (post: Post) => void;
  onDeletePost: (postId: string | number) => Promise<void>;
  activeCategory: string | null;
  setActiveCategory: (category: string | null) => void;
  activeSubject: string | null;
  setActiveSubject: (subject: string | null) => void;
  savedPostIds?: string[];
  onToggleSavePost?: (postId: string) => void;
}

export function BlogFeed({
  posts,
  loading,
  onSelectPost,
  isAdmin,
  onEditPost,
  onDeletePost,
  activeCategory,
  setActiveCategory,
  activeSubject,
  setActiveSubject,
  savedPostIds = [],
  onToggleSavePost,
}: BlogFeedProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Category statistics mapper
  const categoryStats = useMemo(() => {
    const stats: Record<string, { posts: number; subjects: Set<string> }> = {
      Health: { posts: 0, subjects: new Set() },
      Relationships: { posts: 0, subjects: new Set() },
      "Career & Money": { posts: 0, subjects: new Set() },
      Self: { posts: 0, subjects: new Set() },
      "Life & society": { posts: 0, subjects: new Set() },
    };

    posts.forEach((p) => {
      const cat = p.category || "Relationships";
      const sub = p.subject || p.topic || "General";
      if (!(cat in stats)) {
        stats[cat] = { posts: 0, subjects: new Set() };
      }
      stats[cat].posts += 1;
      stats[cat].subjects.add(sub.trim());
    });

    const result: Record<string, { posts: number; subjectsCount: number }> = {};
    Object.keys(stats).forEach((cat) => {
      result[cat] = {
        posts: stats[cat].posts,
        subjectsCount: stats[cat].subjects.size,
      };
    });
    return result;
  }, [posts]);

  // Find other dynamic categories added other than the core 5
  const customCategories = useMemo(() => {
    const coreCats = ["Health", "Relationships", "Career & Money", "Self", "Life & society"];
    return Object.keys(categoryStats).filter((cat) => !coreCats.includes(cat));
  }, [categoryStats]);

  // Real-time search filter
  const searchedPosts = useMemo(() => {
    if (!searchQuery) return posts;
    const q = searchQuery.toLowerCase();
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.subject || p.topic || "").toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
    );
  }, [posts, searchQuery]);

  // Sort searched posts newest first
  const sortedPosts = useMemo(() => {
    return [...searchedPosts].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [searchedPosts]);

  // Posts filtered for selected categories
  const categoryFiltered = useMemo(() => {
    if (!activeCategory) return [];
    return sortedPosts.filter((p) => (p.category || "Relationships") === activeCategory);
  }, [sortedPosts, activeCategory]);

  // Map distinct subjects under active category
  const activeCategorySubjects = useMemo(() => {
    if (!activeCategory) return [];
    const map = new Map<string, Post[]>();
    categoryFiltered.forEach((p) => {
      const sub = (p.subject || p.topic || "General").trim();
      const list = map.get(sub) || [];
      list.push(p);
      map.set(sub, list);
    });

    return Array.from(map.entries())
      .map(([name, list]) => {
        return { name, count: list.length, latestPost: list[0] };
      })
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [categoryFiltered, activeCategory]);

  // Render: Active Category & Active Subject detail lessons list
  if (activeCategory && activeSubject) {
    const subjectSpecificPosts = sortedPosts.filter(
      (p) =>
        (p.category || "Relationships") === activeCategory &&
        (p.subject || p.topic || "General").trim().toLowerCase() === activeSubject.trim().toLowerCase()
    );

    return (
      <div
        className="max-w-4xl mx-auto px-6 py-10 md:py-14 animate-in fade-in duration-200 text-left font-sans"
        id="subject-page"
      >
        <button
          onClick={() => setActiveSubject(null)}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-[#7DB095] transition-colors mb-8 cursor-pointer"
          id="btn-back-to-category"
        >
          <ArrowLeft size={14} />
          <span>Back to {activeCategory} Subjects</span>
        </button>

        <header className="mb-10 text-left border-b border-gray-100 pb-6">
          <div className="flex items-center gap-1.5 text-xs text-[#7DB095] uppercase tracking-widest font-extrabold font-mono mb-2">
            <span>{activeCategory}</span>
            <ArrowRight size={12} className="opacity-60" />
            <span className="text-gray-400">{activeSubject}</span>
          </div>

          <h1
            className="font-serif text-3xl md:text-4xl font-bold text-gray-900 tracking-tight"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Subject: <span className="italic text-[#7DB095] font-serif">{activeSubject}</span>
          </h1>
          <p className="mt-2 text-gray-500 text-sm">
            Discover all published academic lessons, guides, and habits recorded under {activeSubject}.
            Sorted newest first to keep content active.
          </p>
        </header>

        <div className="space-y-4">
          {subjectSpecificPosts.length === 0 ? (
            <div className="text-center py-20 bg-white border border-dashed border-[#7DB095]/15 rounded-2xl p-8">
              <BookOpen className="mx-auto text-[#7DB095]/35 mb-2.5" size={28} />
              <p className="font-serif text-base text-gray-700 italic">
                No published articles yet list as "{activeSubject}".
              </p>
              <p className="font-sans text-xs text-gray-500 max-w-xs mx-auto mt-1">
                Publish drafts using this subject tag under the "{activeCategory}" category to showcase lessons here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {subjectSpecificPosts.map((post) => (
                <BlogCard
                  key={post.id}
                  post={post}
                  onClick={() => onSelectPost(post)}
                  isAdmin={isAdmin}
                  onEdit={(p) => onEditPost(p)}
                  onDelete={(id) => onDeletePost(id)}
                  isSaved={savedPostIds.includes(String(post.id))}
                  onToggleSave={() => onToggleSavePost?.(String(post.id))}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render: Active Category landing page (Subjects directory lists)
  if (activeCategory) {
    return (
      <div
        className="max-w-5xl mx-auto px-6 py-10 md:py-14 animate-in fade-in duration-200 text-left"
        id="category-page"
      >
        <button
          onClick={() => setActiveCategory(null)}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-[#7DB095] transition-colors mb-8 cursor-pointer font-sans"
          id="btn-back-to-home"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </button>

        <header className="mb-12 text-left bg-white border border-[#7DB095]/15 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden font-sans">
          {/* Subtle category backdrops */}
          <div className="absolute right-0 bottom-0 translate-y-6 translate-x-4 opacity-5 pointer-events-none select-none">
            {activeCategory === "Health" && <Activity size={180} />}
            {activeCategory === "Relationships" && <Users size={180} />}
            {activeCategory === "Career & Money" && <Coins size={180} />}
            {activeCategory === "Self" && <Compass size={180} />}
            {activeCategory === "Life & society" && <Globe size={180} />}
          </div>

          <div className="space-y-2 z-10">
            <span className="px-3 py-1 bg-[#7DB095]/10 text-[#7DB095] text-[10px] uppercase tracking-widest font-extrabold rounded-lg">
              CORE CURRICULUM
            </span>
            <h1
              className="font-serif text-3xl md:text-4xl font-bold text-gray-900"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {activeCategory} Hub
            </h1>
            <p className="text-gray-500 font-sans text-xs md:text-sm max-w-2xl leading-relaxed">
              {activeCategory === "Health" &&
                "Learn the fundamentals of physical longevity, restorative sleep, bio-informed nutrition, and nervous system balance that school syllabi left out."}
              {activeCategory === "Relationships" &&
                "Master relational ecology, assertive communication boundaries, somatic resolution dialoguing, and intentional intimacy metrics."}
              {activeCategory === "Career & Money" &&
                "Build career autonomy, multi-asset diversification strategies, micro-business structures, and value positioning mechanics."}
              {activeCategory === "Self" &&
                "Uncover self-actualization frameworks, critical thinking tools, emotional self-regulation patterns, and personal paradigm shifts."}
              {activeCategory === "Life & society" &&
                "Navigate modern institutions, media literacy, societal trends, governance systems, civic contribution, and environmental dynamics."}
            </p>
          </div>

          <div className="bg-[#7DB095]/5 border border-[#7DB095]/10 px-4 py-3.5 rounded-2xl shrink-0 z-10 text-left md:text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-sans">
              Active Subject Folders
            </p>
            <p className="text-2xl font-serif text-[#7DB095] font-bold mt-1 leading-none">
              {activeCategorySubjects.length}
            </p>
          </div>
        </header>

        {/* Dynamic subject directory list cards */}
        <div className="space-y-6">
          <h2 className="text-xs uppercase tracking-widest text-[#7DB095] font-extrabold tracking-wider border-b border-gray-100 pb-3 font-sans">
            Dynamic Subjects under {activeCategory}
          </h2>

          {activeCategorySubjects.length === 0 ? (
            <div className="text-center py-20 bg-white border border-dashed border-[#7DB095]/15 rounded-3xl p-8 font-sans">
              <BookOpen className="mx-auto text-[#7DB095]/30 mb-2.5" size={32} />
              <p className="font-serif text-lg text-gray-800 italic">No subject courses published yet.</p>
              <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
                Connect your owner account in the top-right corner, draft a journal entry with Core Category set to "
                {activeCategory}", specify a unique Subject Tag, and hit Publish!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {activeCategorySubjects.map((subj) => (
                <div
                  key={subj.name}
                  onClick={() => setActiveSubject(subj.name)}
                  className="group bg-white hover:bg-[#FAF9F6]/40 border border-gray-100 hover:border-[#7DB095]/30 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer text-left flex flex-col justify-between font-sans"
                  id={`subject-card-${subj.name.replace(/\s+/g, "-")}`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2 border-b border-gray-50 pb-3">
                      <h3 className="font-serif text-xl font-bold text-gray-900 group-hover:text-[#7DB095] transition-colors leading-tight">
                        {subj.name}
                      </h3>
                      <span className="text-[11px] font-mono font-bold px-2.5 py-1 bg-[#7DB095]/10 text-[#7DB095] rounded-xl shrink-0">
                        {subj.count} {subj.count === 1 ? "lesson" : "lessons"}
                      </span>
                    </div>

                    {/* Latest lesson item box preview */}
                    {subj.latestPost && (
                      <div className="space-y-2 pt-1 font-sans">
                        <p className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 font-sans">
                          Latest Published Lesson preview:
                        </p>
                        <div className="bg-[#FAF9F6] border border-gray-100 rounded-2xl p-4 flex gap-3 items-center">
                          {subj.latestPost.featuredImage && (
                            <img
                              src={subj.latestPost.featuredImage}
                              alt="Lesson Cover"
                              className="w-14 h-14 object-cover rounded-xl shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-gray-800 font-serif leading-snug line-clamp-1 truncate">
                              {subj.latestPost.title}
                            </h4>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                              {new Date(subj.latestPost.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 border-t border-gray-50/50 pt-4 flex items-center justify-between text-xs text-[#7DB095] font-bold uppercase tracking-wider">
                    <span>Enter Subject course</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active home feed limit previews list
  const recentFeedLimit = sortedPosts.slice(0, 5);

  return (
    <div
      className="max-w-6xl mx-auto px-6 md:px-12 py-10 md:py-14 animate-in fade-in duration-300"
      id="home-page-root"
    >
      {/* Home Hero Banner header */}
      <header className="mb-14 md:mb-16 text-center max-w-4xl mx-auto space-y-6 pt-4 border-b border-[#7DB095]/10 pb-10">
        <h1
          className="font-serif text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-none"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Divine <span className="text-[#7DB095] italic font-serif">obsession</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-550 font-serif italic max-w-2xl mx-auto tracking-wide text-gray-500 font-light">
          “Learn the skills school never taught.”
        </p>
        <div className="h-0.5 w-16 bg-[#7DB095] mx-auto opacity-40" />
      </header>

      {/* Global search launcher */}
      <div className="mb-12 max-w-xl mx-auto font-sans" id="home-search-group">
        <div className="relative">
          <input
            type="text"
            placeholder="Search lessons, habits, categories or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#7DB095]/20 hover:border-[#7DB095]/40 rounded-full px-5 py-3.5 pl-12 text-xs focus:outline-none focus:ring-2 focus:ring-[#7DB095]/25 focus:border-[#7DB095]/40 transition-all text-gray-800 shadow-sm"
          />
          <Search className="absolute left-4.5 top-[15px] text-gray-400" size={16} />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-[14px] text-gray-400 hover:text-gray-700 font-bold font-sans cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Admin Mode Warning notice */}
      {isAdmin && (
        <div className="max-w-4xl mx-auto mb-12 p-4 bg-[#7DB095]/5 border border-[#7DB095]/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs tracking-wide animate-in fade-in duration-200 text-left">
          <div className="text-gray-600 font-sans leading-relaxed">
            <span className="font-bold text-[#7DB095] uppercase mr-1">Owner Mode Active:</span>
            You can modify or delete lessons on-the-fly. Create new curriculum folders by inputting your custom subjects inside the publisher!
          </div>
        </div>
      )}

      {/* Categories Grid Segment */}
      <section className="mb-16 space-y-6">
        <div className="text-left space-y-1">
          <h2 className="text-xs uppercase tracking-widest text-[#7DB095] font-extrabold font-sans">
            MAIN LEARNING CATEGORIES
          </h2>
          <p className="text-xs text-gray-400 font-sans font-medium">
            Explore foundational courses school left out of the classroom
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
          {/* Health */}
          <div
            onClick={() => {
              setActiveCategory("Health");
              setActiveSubject(null);
            }}
            className="group cursor-pointer bg-white hover:bg-gradient-to-b hover:from-white hover:to-emerald-50/20 border border-gray-100 hover:border-[#7DB095]/30 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 text-left"
            id="card-learning-health"
          >
            <div className="space-y-4">
              <div className="w-11 h-11 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl flex items-center justify-center">
                <Activity size={22} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif text-xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                  Health
                </h3>
                <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
                  Restorative sleep ecology, lifetime nutrition, stress management, bio-vitality habits, and nervous system balance.
                </p>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-50 pt-4 flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wide text-gray-400 uppercase font-semibold">
                {categoryStats["Health"].subjectsCount} active folders • {categoryStats["Health"].posts} posts
              </span>
              <span className="text-xs font-bold text-[#7DB095] flex items-center gap-0.5 whitespace-nowrap">
                <span>View subjects</span>
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>

          {/* Relationships */}
          <div
            onClick={() => {
              setActiveCategory("Relationships");
              setActiveSubject(null);
            }}
            className="group cursor-pointer bg-white hover:bg-gradient-to-b hover:from-white hover:to-rose-50/20 border border-gray-101 hover:border-[#7DB095]/30 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 text-left"
            id="card-learning-relationships"
          >
            <div className="space-y-4">
              <div className="w-11 h-11 bg-rose-50 text-rose-700 border border-rose-100 rounded-2xl flex items-center justify-center">
                <Users size={22} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif text-xl font-bold text-gray-900 group-hover:text-rose-700 transition-colors">
                  Relationships
                </h3>
                <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
                  Assertive communication boundaries, public presence, relational ecology, authentic pairing metrics, and empathy structures.
                </p>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-50 pt-4 flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wide text-gray-400 uppercase font-semibold">
                {categoryStats["Relationships"].subjectsCount} active folders • {categoryStats["Relationships"].posts} posts
              </span>
              <span className="text-xs font-bold text-[#7DB095] flex items-center gap-0.5 whitespace-nowrap">
                <span>View subjects</span>
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>

          {/* Career & Money */}
          <div
            onClick={() => {
              setActiveCategory("Career & Money");
              setActiveSubject(null);
            }}
            className="group cursor-pointer bg-white hover:bg-gradient-to-b hover:from-white hover:to-blue-50/20 border border-gray-101 hover:border-[#7DB095]/30 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 text-left"
            id="card-learning-money"
          >
            <div className="space-y-4">
              <div className="w-11 h-11 bg-blue-50 text-blue-700 border border-blue-100 rounded-2xl flex items-center justify-center">
                <Coins size={22} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                  Career & Money
                </h3>
                <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
                  Investment blueprints, wealth preservation, negotiation techniques, micro-enterprise structures, and career design.
                </p>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-50 pt-4 flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wide text-gray-400 uppercase font-semibold">
                {categoryStats["Career & Money"].subjectsCount} active folders • {categoryStats["Career & Money"].posts} posts
              </span>
              <span className="text-xs font-bold text-[#7DB095] flex items-center gap-0.5 whitespace-nowrap">
                <span>View subjects</span>
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>

          {/* Self */}
          <div
            onClick={() => {
              setActiveCategory("Self");
              setActiveSubject(null);
            }}
            className="group cursor-pointer bg-white hover:bg-gradient-to-b hover:from-white hover:to-purple-50/20 border border-gray-101 hover:border-[#7DB095]/30 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 text-left"
            id="card-learning-self"
          >
            <div className="space-y-4">
              <div className="w-11 h-11 bg-purple-50 text-purple-700 border border-purple-100 rounded-2xl flex items-center justify-center">
                <Compass size={22} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif text-xl font-bold text-gray-905 group-hover:text-purple-700 transition-colors">
                  Self
                </h3>
                <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
                  Mindset engineering, emotional mastery, somatic focus, critical heuristics, and lifelong purpose alignment.
                </p>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-50 pt-4 flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wide text-gray-400 uppercase font-semibold">
                {categoryStats["Self"].subjectsCount} active folders • {categoryStats["Self"].posts} posts
              </span>
              <span className="text-xs font-bold text-[#7DB095] flex items-center gap-0.5 whitespace-nowrap">
                <span>View subjects</span>
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>

          {/* Life & Society */}
          <div
            onClick={() => {
              setActiveCategory("Life & society");
              setActiveSubject(null);
            }}
            className="group cursor-pointer bg-white hover:bg-gradient-to-b hover:from-white hover:to-amber-50/20 border border-gray-101 hover:border-[#7DB095]/30 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 text-left"
            id="card-learning-life-society"
          >
            <div className="space-y-4">
              <div className="w-11 h-11 bg-amber-50 text-amber-700 border border-amber-100 rounded-2xl flex items-center justify-center">
                <Globe size={22} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif text-xl font-bold text-gray-900 group-hover:text-amber-750 transition-colors">
                  Life & society
                </h3>
                <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
                  Deciphering social dynamics, civic patterns, media intelligence, environmental networks, and community contribution.
                </p>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-50 pt-4 flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wide text-gray-400 uppercase font-semibold">
                {categoryStats["Life & society"].subjectsCount} active folders • {categoryStats["Life & society"].posts} posts
              </span>
              <span className="text-xs font-bold text-[#7DB095] flex items-center gap-0.5 whitespace-nowrap">
                <span>View subjects</span>
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>

          {/* Custom Dynamically Created Categories */}
          {customCategories.map((cat) => (
            <div
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setActiveSubject(null);
              }}
              className="group cursor-pointer bg-white hover:bg-gradient-to-b hover:from-white hover:to-[#7DB095]/5 border border-gray-100 hover:border-[#7DB095]/30 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 text-left animate-in fade-in zoom-in-95 duration-200"
              id={`card-learning-custom-${cat.replace(/\s+/g, "-").toLowerCase()}`}
            >
              <div className="space-y-4">
                <div className="w-11 h-11 bg-teal-50 text-teal-700 border border-teal-100 rounded-2xl flex items-center justify-center">
                  <Sparkles size={22} className="text-[#7DB095]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-serif text-xl font-bold text-gray-900 group-hover:text-[#7DB095] transition-colors">
                    {cat}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
                    Custom curriculum stream containing dynamic masterclasses, tools, and developmental lessons curated under the "{cat}" subject folders.
                  </p>
                </div>
              </div>
              <div className="mt-8 border-t border-gray-50 pt-4 flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-wide text-gray-400 uppercase font-semibold">
                  {categoryStats[cat]?.subjectsCount || 0} active folders • {categoryStats[cat]?.posts || 0} posts
                </span>
                <span className="text-xs font-bold text-[#7DB095] flex items-center gap-0.5 whitespace-nowrap">
                  <span>View subjects</span>
                  <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Latest Lessons Feed stack list */}
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3 text-left font-sans">
          <div className="space-y-1">
            <h2 className="text-xs uppercase tracking-widest text-[#7DB095] font-extrabold font-sans">
              LATEST LESSONS & RECENT DRAFTS
            </h2>
            <p className="text-xs text-gray-400">Latest lectures published by our authors</p>
          </div>
          <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 border border-gray-200/50 px-2.5 py-1 rounded-xl shrink-0">
            {posts.length} {posts.length === 1 ? "lesson total" : "lessons total"}
          </span>
        </div>

        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 font-sans">
              <Loader2 className="w-8 h-8 rounded-full text-[#7DB095] animate-spin mb-3" />
              <p className="text-xs">Curating our dynamic curriculum...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-[#7DB095]/20 rounded-3xl bg-white p-8 font-sans">
              <BookOpen className="mx-auto text-[#7DB095]/40 mb-3" size={28} />
              <p className="font-serif text-lg text-gray-800 italic">"The curriculum holds space for your records."</p>
              <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
                Welcome to your brand new life-skills learning platform. No active masterclasses have been drafted yet. Tap Sign In inside the upper-right corner and publish your initial lecture!
              </p>
            </div>
          ) : recentFeedLimit.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-100 rounded-3xl p-8 font-sans">
              <p className="text-sm text-gray-500">No matching lessons found matching the search inquiry query.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {recentFeedLimit.map((post) => (
                <BlogCard
                  key={post.id}
                  post={post}
                  onClick={() => onSelectPost(post)}
                  isAdmin={isAdmin}
                  onEdit={(p) => onEditPost(p)}
                  onDelete={(id) => onDeletePost(id)}
                  isSaved={savedPostIds.includes(String(post.id))}
                  onToggleSave={() => onToggleSavePost?.(String(post.id))}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

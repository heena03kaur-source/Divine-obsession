import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Trash2, Edit, Check, X, Heart } from "lucide-react";
import { Post } from "../types";
import { extractBlogSummary } from "../utils/blocks";

interface BlogCardProps {
  post: Post;
  onClick: () => void;
  isAdmin: boolean;
  onEdit?: (post: Post, e: React.MouseEvent) => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
  isSaved?: boolean;
  onToggleSave?: (e: React.MouseEvent) => void;
}

export function BlogCard({
  post,
  onClick,
  isAdmin,
  onEdit,
  onDelete,
  isSaved = false,
  onToggleSave,
}: BlogCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(post, e);
    }
  };

  const handleDeleteTrigger = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      await onDelete(post.id, e);
    }
    setShowConfirm(false);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(false);
  };

  const getCategoryClass = (cat: string) => {
    switch (cat) {
      case "Health":
        return "from-emerald-50 to-teal-50 text-emerald-800 border-emerald-200/50";
      case "Career & Money":
        return "from-blue-50 to-indigo-50 text-blue-800 border-blue-200/50";
      case "Self":
        return "from-purple-50 to-fuchsia-50 text-purple-800 border-purple-200/50";
      case "Life & society":
        return "from-amber-50 to-orange-50 text-amber-900 border-amber-200/50";
      case "Relationships":
      default:
        return "from-rose-50 to-amber-50 text-rose-800 border-rose-200/50";
    }
  };

  const getFallbackGradient = (cat: string) => {
    switch (cat) {
      case "Health":
        return "bg-gradient-to-br from-emerald-500/10 to-teal-600/20";
      case "Career & Money":
        return "bg-gradient-to-br from-blue-500/10 to-indigo-600/20";
      case "Self":
        return "bg-gradient-to-br from-purple-500/10 to-fuchsia-600/20";
      case "Life & society":
        return "bg-gradient-to-br from-amber-500/10 to-orange-600/20";
      case "Relationships":
      default:
        return "bg-gradient-to-br from-rose-500/10 to-amber-600/20";
    }
  };

  const category = post.category || "Relationships";
  const subject = post.subject || post.topic || "General";

  return (
    <article
      onClick={onClick}
      className="group cursor-pointer py-6 border-b border-[#7DB095]/15 last:border-b-0 transition-all duration-300 relative text-left"
      id={`blog-card-${post.id}`}
    >
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        {/* Featured Image or Gradient Fallback */}
        <div className="w-full sm:w-44 h-36 shrink-0 rounded-2xl overflow-hidden border border-[#7DB095]/15 shadow-2xs bg-[#FAF9F6] relative">
          {post.featuredImage ? (
            <img
              src={post.featuredImage}
              alt={post.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className={`w-full h-full flex flex-col justify-between p-3.5 ${getFallbackGradient(category)}`}>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#7DB095]">
                PLATFORM SKILL
              </span>
              <span className="text-xs font-serif font-bold text-gray-700 italic mt-auto truncate">
                {subject}
              </span>
            </div>
          )}
        </div>

        {/* Post Text Meta Details */}
        <div className="flex-1 space-y-2.5 w-full">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`px-2.5 py-0.5 border text-[10px] uppercase tracking-wider font-bold rounded-md ${getCategoryClass(category)}`}>
                {category}
              </span>
              <span className="px-2 py-0.5 bg-[#FAF9F6] border border-gray-200 text-gray-500 text-[10px] uppercase tracking-wide font-medium rounded-md">
                {subject}
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-[0.1em] text-gray-400 font-mono">
              {formatDate(post.createdAt)}
            </span>
          </div>

          <h3
            className="text-xl md:text-2xl font-serif text-[#2D3436] group-hover:text-[#7DB095] transition-all duration-200 leading-snug font-bold"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {post.title}
          </h3>

          <p className="text-[#555555] font-sans leading-relaxed text-sm line-clamp-2 md:line-clamp-3">
            {extractBlogSummary(post.content, 180)}
          </p>

          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="inline-flex items-center gap-1 text-xs text-[#7DB095] font-bold uppercase tracking-wider group-hover:gap-2 transition-all duration-200 font-sans">
              <span>Enter lesson</span>
              <ArrowRight size={12} />
            </div>

            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              {onToggleSave && (
                <button
                  type="button"
                  onClick={onToggleSave}
                  className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center shadow-xs ${
                    isSaved
                      ? "bg-rose-50 border-rose-250 text-rose-600 hover:bg-rose-100"
                      : "bg-white border-gray-200 text-gray-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50/30"
                  }`}
                  title={isSaved ? "Remove from Read List" : "Save to Read List"}
                >
                  <Heart size={14} className={isSaved ? "fill-rose-500 text-rose-500" : ""} />
                </button>
              )}

              {isAdmin && (
                <div className="flex items-center gap-2">
                  {showConfirm ? (
                    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200/60 px-2 py-1 rounded-xl text-xs font-sans text-red-655 animate-in fade-in duration-200">
                      <span className="text-[10px] uppercase tracking-widest font-extrabold mr-1">
                        Delete post?
                      </span>
                      <button
                        onClick={confirmDelete}
                        className="p-1 hover:bg-red-500 hover:text-white rounded text-red-650 transition-all cursor-pointer flex items-center justify-center animate-pulse"
                        title="Confirm Delete"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={cancelDelete}
                        className="p-1 hover:bg-gray-200 rounded text-gray-450 transition-all cursor-pointer flex items-center justify-center"
                        title="Cancel Delete"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleEdit}
                        className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 hover:bg-[#7DB095]/10 text-gray-650 hover:text-[#7DB095] text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer border border-gray-150"
                        title="Edit entry"
                      >
                        <Edit size={11} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={handleDeleteTrigger}
                        className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 hover:bg-red-50 text-gray-650 hover:text-red-550 text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer border border-gray-150"
                        title="Delete entry"
                      >
                        <Trash2 size={11} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

import React, { useState } from "react";
import { ArrowLeft, Edit, Trash2, Calendar, Hash, Heart } from "lucide-react";
import { Post } from "../types";
import { parseBlockContent, getFontClassName } from "../utils/blocks";

interface BlogReaderProps {
  post: Post;
  onBack: () => void;
  isAdmin: boolean;
  onEditPost?: (post: Post) => void;
  onDeletePost?: (postId: string | number) => Promise<void>;
  isSaved?: boolean;
  onToggleSave?: () => void;
}

export function BlogReader({
  post,
  onBack,
  isAdmin,
  onEditPost,
  onDeletePost,
  isSaved = false,
  onToggleSave,
}: BlogReaderProps) {
  const [askingConfirmDelete, setAskingConfirmDelete] = useState(false);
  const { isBlocks, globalFont, blocks } = parseBlockContent(post.content);

  const handleDelete = async () => {
    if (onDeletePost) {
      await onDeletePost(post.id);
    }
    setAskingConfirmDelete(false);
  };

  const getFormattedDate = (dateStr: string | number) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <article
      className="max-w-3xl mx-auto px-6 py-12 md:py-16 animate-in fade-in duration-200 text-left"
      id="post-detail-page"
    >
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-12 border-b border-[#7DB095]/10 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#7DB095] group transition-all duration-200 font-sans font-medium focus:outline-none cursor-pointer"
          id="btn-back-to-blogs"
        >
          <ArrowLeft
            size={16}
            className="transform transition-transform duration-200 group-hover:-translate-x-1"
          />
          <span>Return to reading</span>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          {onToggleSave && (
            <button
              onClick={onToggleSave}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-xs ${
                isSaved
                  ? "bg-rose-500 border-rose-500 text-white hover:bg-rose-600"
                  : "bg-white border-gray-200 text-gray-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50/20"
              }`}
            >
              <Heart size={13} className={isSaved ? "fill-white" : ""} />
              <span>{isSaved ? "Saved to Read list" : "Save to Read list"}</span>
            </button>
          )}

          {/* Admin Quick Options */}
          {isAdmin && (
            <div className="flex items-center gap-2.5 font-sans">
              {askingConfirmDelete ? (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl text-xs text-red-650 animate-in fade-in duration-200">
                  <span className="font-extrabold uppercase text-[10px] tracking-widest text-red-700">
                    Delete this post?
                  </span>
                  <button
                    onClick={handleDelete}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] uppercase tracking-widest font-extrabold transition-all cursor-pointer"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setAskingConfirmDelete(false)}
                    className="px-2 py-1 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditPost?.(post)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7DB095]/10 hover:bg-[#7DB095]/20 text-[#7DB095] text-xs font-bold uppercase tracking-widest rounded-xl transition-all border border-[#7DB095]/20 cursor-pointer"
                  >
                    <Edit size={11} />
                    <span>Edit entry</span>
                  </button>
                  <button
                    onClick={() => setAskingConfirmDelete(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 text-xs font-bold uppercase tracking-widest rounded-xl transition-all border border-red-150 cursor-pointer"
                  >
                    <Trash2 size={11} />
                    <span>Delete entry</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hero Header */}
      <header className="mb-8 md:mb-10 text-left border-b border-[#7DB095]/10 pb-8 md:pb-10">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {post.category && (
            <span className="flex items-center gap-1 bg-[#7DB095]/10 border border-[#7DB095]/20 text-[#7DB095] px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider uppercase">
              {post.category}
            </span>
          )}
          <span className="flex items-center gap-1.5 px-3 py-1 bg-[#FAF9F6] border border-gray-200 text-gray-500 rounded-lg text-xs font-mono font-semibold tracking-wide">
            <Hash size={12} className="text-gray-400" />
            <span>{post.subject || post.topic || "General"}</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
            <Calendar size={12} />
            <span>{getFormattedDate(post.createdAt)}</span>
          </span>
        </div>

        <h1 className="font-serif text-3xl md:text-5xl font-bold tracking-tight text-gray-900 leading-tight md:leading-snug mb-6">
          {post.title}
        </h1>

        {post.featuredImage && (
          <div className="w-full h-64 md:h-[400px] rounded-3xl overflow-hidden border border-[#7DB095]/15 mt-6 shadow-sm">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </header>

      {/* Styled content block series */}
      <section
        className={`text-[#2D3748] text-base md:text-lg leading-relaxed text-left max-w-none prose prose-slate ${getFontClassName(
          globalFont
        )}`}
        id="post-content"
      >
        <div className="space-y-8 break-words pb-6">
          {blocks.map((block, idx) => {
            if (block.type === "text") {
              if (!block.text.trim()) return null;
              const overrideFont =
                block.fontId && block.fontId !== globalFont
                  ? getFontClassName(block.fontId)
                  : "";
              return (
                <p
                  key={block.id || idx}
                  className={`whitespace-pre-wrap leading-relaxed ${overrideFont}`}
                >
                  {block.text}
                </p>
              );
            } else if (block.type === "image") {
              if (!block.url.trim()) return null;
              const isFull = block.style === "full";
              const isSide = block.style === "side";

              return (
                <figure
                  key={block.id || idx}
                  className={`my-8 clear-both transition-all duration-300 ${
                    isFull
                      ? "w-full"
                      : isSide
                      ? "sm:float-right sm:max-w-xs sm:ml-6 sm:mb-4 w-full"
                      : "mx-auto max-w-2xl text-center"
                  }`}
                >
                  <div className="overflow-hidden rounded-2xl border border-[#7DB095]/15 bg-[#FAF9F6] p-1.5 shadow-sm hover:shadow-md transition-shadow">
                    <img
                      src={block.url}
                      alt={block.caption || "Journal illustration"}
                      referrerPolicy="no-referrer"
                      className="w-full object-cover rounded-xl select-none"
                      style={{ maxHeight: isSide ? "300px" : "480px" }}
                    />
                  </div>
                  {block.caption && (
                    <figcaption className="mt-2.5 text-center text-[10px] md:text-xs text-gray-400 font-mono tracking-wider italic uppercase px-4">
                      — {block.caption}
                    </figcaption>
                  )}
                </figure>
              );
            }
            return null;
          })}
        </div>
      </section>

      {/* Reader Footer dots */}
      <div className="mt-16 md:mt-20 pt-8 border-t border-[#7DB095]/10 text-center font-sans">
        <div className="w-1.5 h-1.5 rounded-full bg-[#7DB095] inline-block mx-1" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#7DB095] inline-block mx-1" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#7DB095] inline-block mx-1" />
        <p className="text-xs text-gray-400 font-mono mt-4 italic">End of entry</p>
      </div>
    </article>
  );
}

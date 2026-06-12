import React from "react";
import { Heart, ArrowLeft, BookOpen } from "lucide-react";
import { Post } from "../types";
import { BlogCard } from "./BlogCard";

interface ReadLaterListProps {
  posts: Post[];
  savedPostIds: string[];
  onSelectPost: (post: Post) => void;
  onToggleSavePost: (postId: string) => void;
  onExplore: () => void;
}

export function ReadLaterList({
  posts,
  savedPostIds,
  onSelectPost,
  onToggleSavePost,
  onExplore,
}: ReadLaterListProps) {
  const savedPosts = posts.filter((post) => savedPostIds.includes(String(post.id)));

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-16 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 md:mb-12 border-b border-[#7DB095]/10 pb-6 text-left">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif text-[#2D3436] font-bold" style={{ fontFamily: "Georgia, serif" }}>
            My Reading List
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-sans">
            Your handpicked collection of lessons saved for later.
          </p>
        </div>
        <button
          onClick={onExplore}
          className="inline-flex items-center gap-1.5 text-xs text-[#7DB095] font-semibold uppercase tracking-wider hover:gap-2 transition-all duration-250 cursor-pointer font-sans self-start md:self-auto"
        >
          <ArrowLeft size={13} />
          <span>Explore all blogs</span>
        </button>
      </div>

      {savedPosts.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-150/50 rounded-3xl p-8 font-sans shadow-xs flex flex-col items-center justify-center max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-4 animate-pulse">
            <Heart size={20} className="fill-rose-500" />
          </div>
          <p className="font-serif text-lg text-gray-800 italic font-bold">Your Read List is quiet</p>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed max-w-xs">
            Save lessons by clicking the heart icon on any blog card. Explore publications to discover something new today!
          </p>
          <button
            onClick={onExplore}
            className="mt-6 px-5 py-2.5 bg-[#7DB095] hover:bg-[#648E77] text-white text-xs font-semibold tracking-wider uppercase rounded-xl transition-all duration-200 shadow-xs cursor-pointer flex items-center gap-2"
          >
            <BookOpen size={13} />
            <span>Find some lessons</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {savedPosts.map((post) => (
            <BlogCard
              key={post.id}
              post={post}
              onClick={() => onSelectPost(post)}
              isAdmin={false}
              isSaved={true}
              onToggleSave={() => onToggleSavePost(String(post.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState, useMemo } from "react";
import { Search, Hash, BookOpen } from "lucide-react";
import { Post } from "../types";
import { BlogCard } from "./BlogCard";

interface TopicsListProps {
  posts: Post[];
  onSelectPost: (post: Post) => void;
}

export function TopicsList({ posts, onSelectPost }: TopicsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Group topics and counts
  const topicsCatalog = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((post) => {
      if (post.topic) {
        const t = post.topic.trim();
        counts.set(t, (counts.get(t) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [posts]);

  // Search filtered topics
  const filteredTopics = useMemo(() => {
    if (!searchTerm) return topicsCatalog;
    return topicsCatalog.filter((topic) =>
      topic.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [topicsCatalog, searchTerm]);

  // Filter posts list
  const filteredPosts = useMemo(() => {
    if (selectedTopic) {
      return posts.filter(
        (post) => post.topic.trim().toLowerCase() === selectedTopic.trim().toLowerCase()
      );
    }
    if (searchTerm) {
      const topicNamesLowercase = filteredTopics.map((t) => t.name.toLowerCase());
      return posts.filter((post) => topicNamesLowercase.includes(post.topic.toLowerCase()));
    }
    return posts;
  }, [posts, selectedTopic, filteredTopics, searchTerm]);

  return (
    <div
      className="max-w-4xl mx-auto px-6 py-12 md:py-16 animate-in fade-in duration-300 text-left"
      id="topics-page"
    >
      {/* Header */}
      <header className="mb-10 text-center md:text-left">
        <h1
          className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-gray-900 leading-tight"
          style={{ fontFamily: "Georgia, serif" }}
        >
          The art of <span className="text-[#7DB095] italic">becoming.</span>
        </h1>
        <p className="mt-2 text-gray-500 font-sans text-sm md:text-base max-w-xl leading-relaxed">
          Exploring the mind, the heart, and the habits that shape a meaningful life.
        </p>
      </header>

      {/* Search area */}
      <div className="mb-8 w-full" id="topics-search-container">
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedTopic(null); // Clear selected topic on search typing
            }}
            placeholder="Search topics in real-time..."
            className="w-full bg-white border border-[#7DB095]/20 rounded-full px-5 py-3 pl-11 text-xs focus:outline-none focus:ring-2 focus:ring-[#7DB095]/30 focus:border-[#7DB095]/40 transition-all font-sans text-gray-800 shadow-sm"
            id="topics-search-input"
          />
        </div>
      </div>

      {/* Pill Filters stack */}
      <div className="mb-12" id="topics-pills-container">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#7DB095]/80 font-bold mb-3.5 tracking-wider font-sans">
          {selectedTopic ? "Filtering by" : "Select a topic"}
        </p>
        <div className="flex flex-wrap gap-2.5">
          {posts.length > 0 && (
            <button
              onClick={() => setSelectedTopic(null)}
              className={`px-4 py-1.5 rounded-full text-xs font-sans font-medium transition-all duration-200 cursor-pointer ${
                selectedTopic === null
                  ? "bg-[#7DB095] text-white shadow-sm font-bold"
                  : "bg-white border border-[#7DB095]/20 text-[#7DB095] hover:bg-[#7DB095]/5"
              }`}
              id="pill-all-topics"
            >
              All Topics ({posts.length})
            </button>
          )}

          {filteredTopics.map((topic) => (
            <button
              key={topic.name}
              onClick={() => setSelectedTopic(topic.name)}
              className={`px-4 py-1.5 rounded-full text-xs font-sans font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                selectedTopic === topic.name
                  ? "bg-[#7DB095] text-white shadow-sm font-bold"
                  : "bg-white border border-[#7DB095]/20 text-[#7DB095] hover:bg-[#7DB095]/5"
              }`}
              id={`pill-topic-${topic.name.replace(/\s+/g, "-")}`}
            >
              <Hash size={10} />
              <span>{topic.name}</span>
              <span
                className={`text-[9px] rounded px-1 ${
                  selectedTopic === topic.name
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-450"
                }`}
              >
                {topic.count}
              </span>
            </button>
          ))}

          {posts.length > 0 && filteredTopics.length === 0 && (
            <p className="text-sm font-sans italic text-gray-400 py-1">
              No matching topics found.
            </p>
          )}
        </div>
      </div>

      {/* Posts Section */}
      <div>
        <h3 className="font-serif text-lg md:text-xl font-medium text-gray-800 border-b border-[#7DB095]/10 pb-3 mb-6">
          {selectedTopic ? `${selectedTopic} Articles` : "Articles"}
        </h3>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[#7DB095]/15 rounded-xl bg-white/50 p-6">
            <BookOpen className="mx-auto text-gray-300 mb-2" size={24} />
            <p className="font-serif text-gray-500 italic">
              No posts fall under this category filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {filteredPosts.map((post) => (
              <BlogCard key={post.id} post={post} onClick={() => onSelectPost(post)} isAdmin={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

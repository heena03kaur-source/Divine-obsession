import React, { useState } from "react";
import { ArrowLeft, Edit, Trash2, Calendar, Hash, Heart } from "lucide-react";
import { Post, ImageBlock } from "../types";
import { parseBlockContent, getFontClassName } from "../utils/blocks";
import parse from "html-react-parser";

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

  const getLayoutClasses = () => {
    switch (post.layoutStyle) {
      case "wide":
        return "max-w-5xl mx-auto px-6 py-12 md:py-16 text-lg md:text-xl";
      case "magazine":
        return "max-w-6xl mx-auto px-6 py-12 md:py-20 text-base columns-1 md:columns-2 gap-12 font-serif bg-orange-50/10";
      case "minimal":
        return "max-w-2xl mx-auto px-6 py-10 md:py-16 text-md font-sans tracking-tight text-gray-800";
      default: // centered
        return "max-w-3xl mx-auto px-6 py-12 md:py-16 text-left text-base md:text-lg text-[#2D3748]";
    }
  };

  return (
    <article
      className={`animate-in fade-in duration-200 ${getLayoutClasses()}`}
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
        className={`leading-relaxed prose prose-slate max-w-none w-full ${post.layoutStyle === "magazine" ? "pr-0" : ""} ${getFontClassName(
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
                <div
                  key={block.id || idx}
                  className={`rich-text-content leading-relaxed ${overrideFont}`}
                >
                  {parse(block.text)}
                </div>
              );
            } else if (block.type === "image") {
              if (!block.url.trim()) return null;
              
              const imgBlock = block as ImageBlock;
              let content;
              const allUrls = [imgBlock.url, ...(imgBlock.urls || [])].filter(Boolean);

              if (imgBlock.style === "gallery") {
                content = (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {allUrls.map((u, i) => (
                      <div key={i} className="aspect-square overflow-hidden rounded-xl border border-gray-100"><img src={u} referrerPolicy="no-referrer" className="w-full h-full object-cover"/></div>
                    ))}
                  </div>
                );
              } else if (imgBlock.style === "carousel") {
                content = (
                  <div className="flex overflow-x-auto gap-3 snap-x pb-4">
                    {allUrls.map((u, i) => (
                      <div key={i} className="snap-center shrink-0 w-4/5 md:w-2/3 h-[300px] overflow-hidden rounded-xl border border-gray-100"><img src={u} referrerPolicy="no-referrer" className="w-full h-full object-cover"/></div>
                    ))}
                  </div>
                );
              } else if (imgBlock.style === "text-beside") {
                content = (
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-full md:w-1/2 overflow-hidden rounded-xl border border-gray-100"><img src={imgBlock.url} referrerPolicy="no-referrer" className="w-full object-cover"/></div>
                    <div className="w-full md:w-1/2 text-sm text-gray-700 italic border-l-2 border-[#7DB095] pl-4">{imgBlock.textBeside}</div>
                  </div>
                );
              } else {
                const isFull = imgBlock.style === "full" || imgBlock.style === "hero";
                const isHero = imgBlock.style === "hero";
                const isSide = imgBlock.style === "side";
                content = (
                  <div className="overflow-hidden rounded-2xl border border-[#7DB095]/15 bg-[#FAF9F6] p-1.5 shadow-sm hover:shadow-md transition-shadow">
                    <img
                      src={imgBlock.url}
                      alt={imgBlock.caption || "Illustration"}
                      referrerPolicy="no-referrer"
                      className="w-full object-cover rounded-xl select-none"
                      style={{ maxHeight: isHero ? "600px" : isSide ? "300px" : "480px" }}
                    />
                  </div>
                );
              }

              return (
                <figure
                  key={block.id || idx}
                  className={`my-8 clear-both transition-all duration-300 ${
                    imgBlock.style === "full" || imgBlock.style === "hero"
                      ? "w-full"
                      : imgBlock.style === "side"
                      ? "sm:float-right sm:max-w-xs sm:ml-6 sm:mb-4 w-full"
                      : "mx-auto max-w-2xl text-center"
                  }`}
                >
                  {content}
                  {imgBlock.caption && (
                    <figcaption className="mt-2.5 text-center text-[10px] md:text-xs text-gray-400 font-mono tracking-wider italic uppercase px-4">
                      — {imgBlock.caption}
                    </figcaption>
                  )}
                </figure>
              );
            } else if (block.type) {
                // AdvancedBlocks
                const adv = block as any;
                let c;
                try {
                   c = adv.content.startsWith('{') || adv.content.startsWith('[') ? JSON.parse(adv.content) : adv.content;
                } catch {
                   c = adv.content;
                }
                const contentStr = typeof c === 'string' ? c : JSON.stringify(c, null, 2);

                if (block.type === 'highlight') {
                  return <div key={block.id} className="bg-yellow-50 border-l-4 border-yellow-400 p-6 my-6 rounded-r-xl shadow-sm text-yellow-900 font-medium">{contentStr}</div>;
                } else if (block.type === 'callout') {
                  return <div key={block.id} className="bg-blue-50 border border-blue-100 p-6 my-6 rounded-xl text-blue-800 text-sm flex gap-4 items-start"><span className="text-blue-400 font-bold text-xl leading-none">!</span> <div>{contentStr}</div></div>;
                } else if (block.type === 'pullquote') {
                  const q = typeof c === 'object' && c.quote ? c.quote : contentStr;
                  const auth = typeof c === 'object' && c.author ? c.author : '';
                  return <blockquote key={block.id} className="text-2xl md:text-3xl font-serif text-[#7DB095] italic text-center my-10 py-6 border-y border-[#7DB095]/20">"{q}"{auth && <footer className="text-sm text-gray-400 mt-4 not-italic font-sans uppercase tracking-widest">— {auth}</footer>}</blockquote>;
                } else if (block.type === 'summary') {
                  return <div key={block.id} className="bg-[#FAF9F6] border border-[#7DB095]/30 p-8 my-8 rounded-2xl text-center shadow-sm"><h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#7DB095] mb-4">Summary</h4><div className="text-gray-700 italic">{contentStr}</div></div>;
                } else if (block.type === 'step') {
                  const title = typeof c === 'object' && c.title ? c.title : `Step`;
                  const desc = typeof c === 'object' && c.description ? c.description : contentStr;
                  return <div key={block.id} className="flex gap-6 my-8 items-start"><div className="w-12 h-12 bg-[#7DB095] text-white rounded-2xl flex items-center justify-center font-bold font-mono shrink-0 shadow-md">0{idx}</div><div><h3 className="text-xl font-bold mb-2">{title}</h3><p className="text-gray-600 leading-relaxed">{desc}</p></div></div>;
                } else if (block.type === 'timeline') {
                   const title = typeof c === 'object' && c.title ? c.title : `Event`;
                   const desc = typeof c === 'object' && c.description ? c.description : contentStr;
                   return <div key={block.id} className="border-l-2 border-[#7DB095]/30 pl-6 my-6 ml-6 relative"><div className="absolute w-3 h-3 bg-[#7DB095] rounded-full -left-[7px] top-2" /><h4 className="font-bold text-lg mb-1">{title}</h4><p className="text-gray-600 text-sm">{desc}</p></div>;
                } else if (block.type === 'faq') {
                   const q = typeof c === 'object' && c.question ? c.question : 'Question?';
                   const a = typeof c === 'object' && c.answer ? c.answer : contentStr;
                   return <div key={block.id} className="border-b border-gray-200 py-4"><h4 className="font-bold cursor-pointer text-[#7DB095]">{q}</h4><p className="mt-2 text-gray-600">{a}</p></div>;
                } else if (block.type === 'takeaways') {
                   const items = Array.isArray(c) ? c : typeof c === 'object' && c.items ? c.items : [contentStr];
                   return <div key={block.id} className="bg-emerald-50 rounded-2xl p-6 md:p-8 my-8 border border-emerald-100"><h4 className="font-black text-xs uppercase tracking-widest text-[#7DB095] mb-4">Key Takeaways</h4><ul className="space-y-3">{items.map((it:string, i:number)=>(<li key={i} className="flex gap-3 items-start"><span className="text-[#7DB095] font-bold mt-1">✓</span> <span className="text-gray-800 font-medium">{it}</span></li>))}</ul></div>;
                } else {
                   return <div key={block.id} className="p-4 bg-gray-50 border my-4 font-mono text-xs">{contentStr}</div>;
                }
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

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  FileText,
  Edit,
  Eye,
  Trash2,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  Plus,
  Loader2,
  Check,
  AlertTriangle,
  Flame,
  Globe,
} from "lucide-react";
import { Post, Block, TextBlock, ImageBlock } from "../types";
import {
  FONT_OPTIONS,
  getFontClassName,
  compressImage,
} from "../utils/blocks";

interface BlogWriterProps {
  token: string;
  onPublishSuccess: () => void;
  onCancel: () => void;
  postToEdit?: Post | null;
  existingNiches?: string[];
  existingCategories?: string[];
}

const PRESET_COVERS = [
  {
    name: "Sylvan Woods",
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
    tag: "Nature",
  },
  {
    name: "Highland Mist",
    url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1200&q=80",
    tag: "Atmospheric",
  },
  {
    name: "Solitary Hearth",
    url: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=1200&q=80",
    tag: "Studio",
  },
  {
    name: "Verdant Fields",
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
    tag: "Meadow",
  },
  {
    name: "Starlit Sky",
    url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
    tag: "Astronomy",
  },
];

export function BlogWriter({
  token,
  onPublishSuccess,
  onCancel,
  postToEdit,
  existingNiches = [],
  existingCategories = [],
}: BlogWriterProps) {
  // Initial parsed active write session if present
  const restoredSession = (() => {
    try {
      const saved = localStorage.getItem("sage_active_write_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch (e) {
      console.error("Failed to parse active write session", e);
    }
    return null;
  })();

  // We can resume draft session if:
  // - No editing post target prop is active and restored session has a blank/null edit target
  // - Or editing post target matches exactly the ID inside the restored session
  const canUseRestored = restoredSession && (
    (!postToEdit && !restoredSession.postToEdit) ||
    (postToEdit && restoredSession.postToEdit && String(postToEdit.id) === String(restoredSession.postToEdit.id))
  );

  const [currentPostToEdit, setCurrentPostToEdit] = useState<Post | null>(() => {
    if (canUseRestored) return restoredSession.postToEdit;
    return postToEdit || null;
  });

  // Core Writer fields
  const [title, setTitle] = useState(() => {
    if (canUseRestored && typeof restoredSession.title === "string" && restoredSession.title.trim().length > 0) {
      return restoredSession.title;
    }
    return postToEdit?.title || "";
  });

  const [category, setCategory] = useState(() => {
    if (canUseRestored && typeof restoredSession.category === "string") {
      return restoredSession.category;
    }
    return postToEdit?.category || "Relationships";
  });

  const categoryOptions = React.useMemo(() => {
    const DEFAULT_CATEGORIES = ["Health", "Relationships", "Career & Money", "Self", "Life & society"];
    return Array.from(
      new Set([...DEFAULT_CATEGORIES, ...(existingCategories || [])])
    );
  }, [existingCategories]);

  const [categorySelection, setCategorySelection] = useState(() => {
    const initialCategory = canUseRestored && typeof restoredSession.category === "string"
      ? restoredSession.category
      : (postToEdit?.category || "Relationships");
    if (categoryOptions.includes(initialCategory)) {
      return initialCategory;
    }
    return "__custom__";
  });

  const [customCategoryName, setCustomCategoryName] = useState(() => {
    const initialCategory = canUseRestored && typeof restoredSession.category === "string"
      ? restoredSession.category
      : (postToEdit?.category || "Relationships");
    if (!categoryOptions.includes(initialCategory)) {
      return initialCategory;
    }
    return "";
  });

  useEffect(() => {
    if (categoryOptions.includes(category)) {
      setCategorySelection(category);
    } else {
      setCategorySelection("__custom__");
      setCustomCategoryName(category);
    }
  }, [category, categoryOptions]);

  const [subject, setSubject] = useState(() => {
    if (canUseRestored && typeof restoredSession.subject === "string") {
      return restoredSession.subject;
    }
    return postToEdit?.subject || postToEdit?.topic || "";
  });

  const [featuredImage, setFeaturedImage] = useState(() => {
    if (canUseRestored && typeof restoredSession.featuredImage === "string") {
      return restoredSession.featuredImage;
    }
    return postToEdit?.featuredImage || "";
  });

  const [globalFont, setGlobalFont] = useState(() => {
    if (canUseRestored && typeof restoredSession.globalFont === "string") {
      return restoredSession.globalFont;
    }
    if (postToEdit) {
      try {
        const parsedContent = JSON.parse(postToEdit.content);
        if (parsedContent?.globalFont) return parsedContent.globalFont;
      } catch {}
    }
    return "font-serif";
  });

  // Editor blocks setup state
  const [blocks, setBlocks] = useState<Block[]>(() => {
    if (canUseRestored && Array.isArray(restoredSession.blocks) && restoredSession.blocks.length > 0) {
      return restoredSession.blocks;
    }
    if (postToEdit) {
      try {
        const parsedContent = JSON.parse(postToEdit.content);
        if (parsedContent?.version === "blocks-v1" && Array.isArray(parsedContent.blocks)) {
          return parsedContent.blocks;
        }
      } catch {}
      return [
        {
          id: "b-initial",
          type: "text",
          text: postToEdit.content,
          fontId: "font-serif",
        },
      ];
    }
    return [{ id: "b-initial", type: "text", text: "", fontId: "font-serif" }];
  });

  const [activeBlockId, setActiveBlockId] = useState<string | null>(() => {
    if (canUseRestored && Array.isArray(restoredSession.blocks) && restoredSession.blocks.length > 0) {
      return restoredSession.blocks[0].id;
    }
    return "b-initial";
  });

  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [savingToServer, setSavingToServer] = useState(false);
  const [hasUnsavedDraft, setHasUnsavedDraft] = useState(!!canUseRestored);
  const [autosaveTime, setAutosaveTime] = useState<string | null>(() => {
    if (canUseRestored && restoredSession?.updatedAt) {
      return `Restored (Saved ${new Date(restoredSession.updatedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })})`;
    }
    return null;
  });

  // Trigger Local Storage Draft Autosave
  useEffect(() => {
    if (
      title.trim() ||
      subject.trim() ||
      blocks.some((b) => b.type === "text" && b.text.trim()) ||
      blocks.some((b) => b.type === "image" && b.url.trim())
    ) {
      try {
        const draftObj = {
          postToEdit: currentPostToEdit,
          title,
          topic: subject,
          category,
          subject,
          featuredImage,
          globalFont,
          blocks,
          updatedAt: Date.now(),
        };
        localStorage.setItem("sage_active_write_session", JSON.stringify(draftObj));
        const timeStr = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        setAutosaveTime(timeStr);
        setHasUnsavedDraft(true);
      } catch (err) {
        console.warn("Storage exceeded, saving text-only fallback to draft localStorage", err);
        try {
          // Fallback dropping heavy base64 strings
          const textOnlyBlocks = blocks.map((b) =>
            b.type === "image" && b.url.startsWith("data:") ? { ...b, url: "" } : b
          );
          const fallbackDraft = {
            postToEdit: currentPostToEdit,
            title,
            topic: subject,
            category,
            subject,
            featuredImage,
            globalFont,
            blocks: textOnlyBlocks,
            updatedAt: Date.now(),
          };
          localStorage.setItem("sage_active_write_session", JSON.stringify(fallbackDraft));
          setAutosaveTime("Saved Text Only (Quota Limit)");
          setHasUnsavedDraft(true);
        } catch {}
      }
    } else {
      localStorage.removeItem("sage_active_write_session");
      setAutosaveTime(null);
      setHasUnsavedDraft(false);
    }
  }, [title, subject, category, featuredImage, globalFont, blocks, currentPostToEdit]);

  // Command elements actions
  const appendTextBlock = (afterIndex: number) => {
    const nextId = `b-text-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newBlock: TextBlock = { id: nextId, type: "text", text: "", fontId: globalFont };
    const updated = [...blocks];
    updated.splice(afterIndex + 1, 0, newBlock);
    setBlocks(updated);
    setActiveBlockId(nextId);
  };

  const appendImageBlock = (afterIndex: number, predefinedUrl: string = "") => {
    const nextId = `b-img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newBlock: ImageBlock = {
      id: nextId,
      type: "image",
      url: predefinedUrl,
      caption: predefinedUrl ? "A peaceful moment captured" : "",
      style: "center",
    };
    const updated = [...blocks];
    updated.splice(afterIndex + 1, 0, newBlock);
    setBlocks(updated);
    setActiveBlockId(nextId);
  };

  const handleBlockImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetBlockId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorAlert("This image is too large! Please choose an image smaller than 15MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        try {
          const compressed = await compressImage(dataUrl);
          setBlocks((current) =>
            current.map((block) =>
              block.id === targetBlockId
                ? {
                    ...block,
                    url: compressed,
                    caption: file.name.substring(0, file.name.lastIndexOf(".")) || "Gallery photo",
                  }
                : block
            )
          );
          setErrorAlert(null);
        } catch (compressErr) {
          console.error("Compression failed, using fallback source", compressErr);
          setBlocks((current) =>
            current.map((block) =>
              block.id === targetBlockId
                ? {
                    ...block,
                    url: dataUrl,
                    caption: file.name.substring(0, file.name.lastIndexOf(".")) || "Gallery photo",
                  }
                : block
            )
          );
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleBlockImageUploadAfterIndex = async (e: React.ChangeEvent<HTMLInputElement>, afterIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorAlert("This image is too large! Please choose an image smaller than 15MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        try {
          const compressed = await compressImage(dataUrl);
          const nextId = `b-img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const newBlock: ImageBlock = {
            id: nextId,
            type: "image",
            url: compressed,
            caption: file.name.substring(0, file.name.lastIndexOf(".")) || "Gallery photo",
            style: "center",
          };
          const updated = [...blocks];
          updated.splice(afterIndex + 1, 0, newBlock);
          setBlocks(updated);
          setActiveBlockId(nextId);
          setErrorAlert(null);
        } catch (err) {
          console.error("Compression failed, using uncompressed source", err);
          const nextId = `b-img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const newBlock: ImageBlock = {
            id: nextId,
            type: "image",
            url: dataUrl,
            caption: file.name.substring(0, file.name.lastIndexOf(".")) || "Gallery photo",
            style: "center",
          };
          const updated = [...blocks];
          updated.splice(afterIndex + 1, 0, newBlock);
          setBlocks(updated);
          setActiveBlockId(nextId);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const updateBlockText = (id: string, text: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, text } : b)));
  };

  const updateBlockFont = (id: string, fontId: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, fontId } : b)));
  };

  const updateBlockImageProps = (id: string, props: Partial<ImageBlock>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...props } as Block : b)));
  };

  const removeBlock = (id: string) => {
    if (blocks.length <= 1) {
      setErrorAlert("An entry must contain at least one content block.");
      return;
    }
    setErrorAlert(null);
    const updated = blocks.filter((b) => b.id !== id);
    setBlocks(updated);
    if (activeBlockId === id) {
      setActiveBlockId(updated[0]?.id || null);
    }
  };

  const reorderBlock = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === blocks.length - 1)) {
      return;
    }
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const reordered = [...blocks];
    const item = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = item;
    setBlocks(reordered);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem("sage_active_write_session");
    setHasUnsavedDraft(false);
    setAutosaveTime(null);

    setTitle(postToEdit?.title || "");
    setCategory(postToEdit?.category || "Relationships");
    setSubject(postToEdit?.subject || postToEdit?.topic || "");
    setFeaturedImage(postToEdit?.featuredImage || "");

    const baseFont = postToEdit
      ? (() => {
          try {
            const parsed = JSON.parse(postToEdit.content);
            return parsed.globalFont || "font-serif";
          } catch {}
        })() || "font-serif"
      : "font-serif";
    setGlobalFont(baseFont);

    const baseBlocks = postToEdit
      ? (() => {
          try {
            const parsed = JSON.parse(postToEdit.content);
            if (parsed.blocks) return parsed.blocks;
          } catch {}
          return [
            {
              id: "b-initial",
              type: "text",
              text: postToEdit.content,
              fontId: baseFont,
            },
          ];
        })()
      : [{ id: "b-initial", type: "text", text: "", fontId: "font-serif" }];

    setBlocks(baseBlocks);
    setActiveBlockId("b-initial");
    setCurrentPostToEdit(postToEdit || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorAlert("You must be logged in as the owner to build articles.");
      return;
    }
    if (!title.trim() || !subject.trim()) {
      setErrorAlert("Please fill out Title and Subject fields.");
      return;
    }

    // Filter valid non-empty blocks
    const filteredBlocks = blocks.filter((b) => {
      if (b.type === "text") return b.text.trim().length > 0;
      if (b.type === "image") return b.url.trim().length > 0;
      return false;
    });

    if (filteredBlocks.length === 0) {
      setErrorAlert("Please write content or add at least one valid text/image block to publish.");
      return;
    }

    const payloadContent = JSON.stringify({
      version: "blocks-v1",
      globalFont,
      blocks: filteredBlocks,
    });

    setErrorAlert(null);
    setSavingToServer(true);

    const isEditing = !!currentPostToEdit;
    const url = isEditing ? `/api/posts/${currentPostToEdit.id}` : "/api/posts";
    const method = isEditing ? "PUT" : "POST";

    try {
      const bodyPayload: any = {
        title: title.trim(),
        topic: subject.trim(),
        content: payloadContent,
        category,
        subject: subject.trim(),
        featuredImage: featuredImage.trim(),
      };
      if (isEditing) {
        bodyPayload.id = currentPostToEdit.id;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyPayload),
      });

      const responseText = await response.text();
      let resData: any = {};
      try {
        resData = JSON.parse(responseText);
      } catch {
        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}: ${responseText.substring(0, 100)}`);
        }
      }

      if (!response.ok) {
        throw new Error(resData.error || `Failed to ${isEditing ? "update" : "publish"} post.`);
      }

      // Sync/Store backup representation locally to guarantee persistence across server restates and code edits
      if (resData.post) {
        try {
          const backupRaw = localStorage.getItem("sage_published_backup");
          const backups = backupRaw ? JSON.parse(backupRaw) : {};
          backups[resData.post.id] = resData.post;
          localStorage.setItem("sage_published_backup", JSON.stringify(backups));
        } catch (e) {
          console.error("Local backup tracking write failed:", e);
        }
      }

      // Cleanup Draft on success
      localStorage.removeItem("sage_active_write_session");
      onPublishSuccess();
    } catch (err: any) {
      setErrorAlert(err.message || "Something went wrong while publishing.");
    } finally {
      setSavingToServer(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16 animate-in fade-in duration-200 text-left" id="write-blog-page">
      {/* Back button */}
      <button
        onClick={onCancel}
        className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-[#7DB095]/10 text-gray-600 hover:text-[#7DB095] border border-gray-200 hover:border-[#7DB095]/30 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 mb-6 font-sans focus:outline-none cursor-pointer shadow-sm"
        id="btn-write-cancel"
      >
        <ArrowLeft size={16} className="text-[#7DB095]" />
        <span>Go Back</span>
      </button>

      {/* Editor Header */}
      <header className="mb-8 md:mb-10 text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <span className="p-2 bg-[#7DB095]/10 rounded-lg text-[#7DB095]">
              <FileText size={22} />
            </span>
            <span>{currentPostToEdit ? "Edit Journal Entry" : "Structured Editor"}</span>
          </h1>
          <p className="mt-2 text-gray-500 font-sans text-sm">
            {currentPostToEdit
              ? `You are editing your published post "${currentPostToEdit.title}". Refine its blocks, typography, and photos safely.`
              : "Create an immersive layout with inline images, fine typography control, and live responsive previews."}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-[#7DB095]/5 p-1 rounded-xl border border-[#7DB095]/10 shrink-0 self-start md:self-auto font-sans">
          <button
            type="button"
            onClick={() => setViewMode("edit")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "edit" ? "bg-[#7DB095] text-white shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Edit size={12} />
            <span>Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "preview" ? "bg-[#7DB095] text-white shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Eye size={12} />
            <span>Live Preview</span>
          </button>
        </div>
      </header>

      {/* Editor Forms */}
      <form onSubmit={handleSubmit} className="space-y-6" id="write-blog-form">
        {/* Draft Loaded Notice */}
        {hasUnsavedDraft && (
          <div
            className="p-5 bg-emerald-50 border border-emerald-200/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-1 duration-200 text-left"
            id="draft-loaded-alert"
          >
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100/60 border border-emerald-200 text-[10px] text-emerald-800 font-bold uppercase tracking-widest rounded">
                Draft Restored
              </span>
              <p className="text-sm font-semibold text-gray-800 font-sans">
                We have automatically restored your last unsaved draft.
              </p>
              {restoredSession?.updatedAt && (
                <p className="text-[11px] text-gray-400 font-mono uppercase tracking-wide">
                  Saved: {new Date(restoredSession.updatedAt).toLocaleString()}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-4 py-2 bg-white hover:bg-red-50 border border-red-200 text-red-650 hover:text-red-750 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 self-end sm:self-auto"
              id="btn-discard-draft-automatic"
            >
              Discard Draft & Reset
            </button>
          </div>
        )}

        {/* Global Error message */}
        {errorAlert && (
          <div
            className="px-4 py-3 bg-red-50 border border-red-200/50 rounded-lg text-red-650 flex items-start gap-2.5 text-sm font-sans"
            id="write-error-alert"
          >
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <span>{errorAlert}</span>
          </div>
        )}

        {/* Core Settings Block */}
        <div className="bg-white border border-[#7DB095]/15 rounded-2xl p-6 space-y-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#7DB095] font-sans pb-2 border-b border-gray-100">
            Life-Skills Platform Content Settings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 font-sans">
            {/* Title */}
            <div className="space-y-1.5 md:col-span-6">
              <label htmlFor="write-title-input" className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Course / Blog Title
              </label>
              <input
                id="write-title-input"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. How to Build Confidence"
                className="w-full px-4 py-2.5 bg-[#FAF9F6]/50 border border-[#7DB095]/20 hover:border-[#7DB095]/40 focus:border-[#7DB095] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 text-gray-800 font-serif font-medium"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5 md:col-span-3">
              <label htmlFor="write-category-input" className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Core Category
              </label>
              <select
                id="write-category-input"
                required
                value={categorySelection}
                onChange={(e) => {
                  const val = e.target.value;
                  setCategorySelection(val);
                  if (val === "__custom__") {
                    setCategory(customCategoryName || "My Custom Category");
                  } else {
                    setCategory(val);
                  }
                }}
                className="w-full px-4 py-2.5 bg-[#FAF9F6]/50 border border-[#7DB095]/20 hover:border-[#7DB095]/40 focus:border-[#7DB095] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 text-gray-800 font-sans cursor-pointer focus:ring-1 focus:ring-[#7DB095]"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                <option value="__custom__" className="text-[#7DB095] font-bold">
                  ⚡ + Add Custom Category...
                </option>
              </select>

              {categorySelection === "__custom__" && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <input
                    type="text"
                    required
                    value={customCategoryName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomCategoryName(val);
                      setCategory(val);
                    }}
                    placeholder="Enter custom category name..."
                    className="w-full px-4 py-2 bg-white border border-[#7DB095]/30 focus:border-[#7DB095] outline-none rounded-xl text-xs transition-all text-gray-800 font-sans"
                  />
                </div>
              )}
            </div>

            {/* Subject Tag */}
            <div className="space-y-1.5 md:col-span-3">
              <label htmlFor="write-subject-input" className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Dynamic Subject
              </label>
              <input
                id="write-subject-input"
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Self-Esteem"
                className="w-full px-4 py-2.5 bg-[#FAF9F6]/50 border border-[#7DB095]/20 hover:border-[#7DB095]/40 focus:border-[#7DB095] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 text-gray-800 font-sans"
              />
            </div>
          </div>

          {/* Featured cover image */}
          <div className="space-y-2 pt-1 border-t border-gray-50 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label htmlFor="write-featured-img-input" className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Featured Cover Image
              </label>
              <span className="text-[10px] text-gray-400 font-mono">
                Accepts URLs or file layouts
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div className="md:col-span-7 space-y-3">
                <div className="flex gap-2">
                  <input
                    id="write-featured-img-input"
                    type="text"
                    value={featuredImage}
                    onChange={(e) => setFeaturedImage(e.target.value)}
                    placeholder="Paste featured image URL here..."
                    className="flex-1 px-4 py-2.5 bg-[#FAF9F6]/50 border border-[#7DB095]/20 hover:border-[#7DB095]/40 focus:border-[#7DB095] focus:bg-white outline-none rounded-xl text-xs transition-all duration-200 text-gray-800 font-mono"
                  />
                  <label className="px-4 py-2 bg-[#FAF9F6] border border-[#7DB095]/30 hover:border-[#7DB095] text-[#7DB095] text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center whitespace-nowrap gap-1">
                    <Plus size={12} className="rotate-45" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = async (event) => {
                            const dataUrl = event.target?.result as string;
                            const compressed = await compressImage(dataUrl);
                            setFeaturedImage(compressed);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Predefined cover tags */}
                <div className="space-y-1.5 pb-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Or select an academic aesthetic Cover:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COVERS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setFeaturedImage(preset.url)}
                        className={`text-[10px] font-sans px-3 py-1.5 rounded-lg border transition-all duration-150 cursor-pointer ${
                          featuredImage === preset.url
                            ? "border-[#7DB095] bg-[#7DB095]/10 text-[#7DB095] font-bold"
                            : "border-gray-200 hover:border-[#7DB095]/20 bg-white hover:bg-[#7DB095]/5 text-gray-500"
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cover Preview slot */}
              <div className="md:col-span-5 h-[130px] rounded-2xl border border-dashed border-[#7DB095]/20 bg-[#FAF9F6] overflow-hidden flex flex-col items-center justify-center p-2 relative">
                {featuredImage ? (
                  <>
                    <img
                      src={featuredImage}
                      alt="Cover Preview"
                      className="w-full h-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => setFeaturedImage("")}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
                      title="Clear image"
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                ) : (
                  <div className="text-center text-gray-400 p-4">
                    <ImageIcon size={24} className="mx-auto text-[#7DB095]/40 mb-1" />
                    <p className="text-[10px] font-sans">Preview not available (blank cover)</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* View Mode: Writer Editor Blocks */}
        {viewMode === "edit" ? (
          <div className="space-y-6">
            {/* Typography Palette chooser */}
            <div className="bg-white border border-[#7DB095]/15 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-left font-sans">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 bg-gray-50 border border-gray-200/50 px-2 py-0.5 rounded">
                  Design Aesthetics
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  Choose the default global typography palette for this editorial layout.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-gray-600 shrink-0 font-sans">
                  Fallback Font:
                </label>
                <select
                  value={globalFont}
                  onChange={(e) => setGlobalFont(e.target.value)}
                  className="px-3.5 py-2 bg-[#FAF9F6] border border-[#7DB095]/30 focus:border-[#7DB095] focus:bg-white rounded-xl text-xs outline-none text-gray-700 font-sans cursor-pointer transition-colors"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sequential block stack list */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-left py-1 px-2 border-b border-[#7DB095]/10">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#7DB095] font-sans">
                  Dynamic Layout Blocks ({blocks.length})
                </span>
                <span className="text-[9px] font-mono text-gray-400 uppercase">
                  Compose elements sequentially • Click block to append photos
                </span>
              </div>

              {blocks.map((block, idx) => {
                const isText = block.type === "text";
                const isImage = block.type === "image";
                const isActive = activeBlockId === block.id;

                return (
                  <div
                    key={block.id}
                    onClick={() => setActiveBlockId(block.id)}
                    className={`relative bg-white border rounded-2xl p-5 md:p-6 transition-all duration-200 shadow-sm ${
                      isActive
                        ? "border-[#7DB095] ring-2 ring-[#7DB095]/20 bg-emerald-[2px]"
                        : "border-gray-200/60 hover:border-[#7DB095]/30"
                    }`}
                    id={`editorial-block-${block.id}`}
                  >
                    {isActive && (
                      <div className="absolute -top-2.5 left-6 px-2.5 py-0.5 bg-[#7DB095] border border-[#648E77] text-white text-[9px] font-bold uppercase tracking-wider rounded-md shadow-sm flex items-center gap-1 z-10 font-sans">
                        <span className="h-1.5 w-1.5 bg-white rounded-full animate-pulse" />
                        <span>Active Writing Space</span>
                      </div>
                    )}

                    {/* Block Toolbar Control */}
                    <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-3 mb-4 gap-3 font-sans">
                      <div className="flex items-center gap-2">
                        {isText ? (
                          <span className="p-1.5 bg-[#7DB095]/10 text-[#7DB095] rounded-lg">
                            <FileText size={14} />
                          </span>
                        ) : (
                          <span className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                            <ImageIcon size={14} />
                          </span>
                        )}
                        <span className="text-xs font-bold text-gray-700 capitalize font-sans">
                          Block #{idx + 1} • {block.type} Element
                        </span>
                      </div>

                      {/* Insertion shortcuts */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#7DB095] border border-[#7DB095]/20 text-[11px] font-bold rounded-xl cursor-pointer transition-all select-none">
                          <ImageIcon size={12} />
                          <span>Add Image After</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleBlockImageUploadAfterIndex(e, idx)}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            appendTextBlock(idx);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#FAF9F6] hover:bg-gray-100 text-gray-600 text-[11px] font-extrabold rounded-xl border border-gray-200 transition-all cursor-pointer font-sans"
                        >
                          <Plus size={11} className="text-[#7DB095]" />
                          <span>Add Paragraph</span>
                        </button>
                      </div>

                      {/* Ordering utilities */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            reorderBlock(idx, "up");
                          }}
                          className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          title="Move block up"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === blocks.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            reorderBlock(idx, "down");
                          }}
                          className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          title="Move block down"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <span className="h-4 w-px bg-gray-200 mx-1" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBlock(block.id);
                          }}
                          className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-505 rounded transition-colors cursor-pointer"
                          title="Delete content block"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Block inputs editor fields */}
                    <div>
                      {isText && (
                        <div className="space-y-3 font-sans">
                          <textarea
                            value={(block as TextBlock).text}
                            onChange={(e) => updateBlockText(block.id, e.target.value)}
                            onFocus={() => setActiveBlockId(block.id)}
                            placeholder="Type paragraph observations... Select workspace block details then insert photos instantly after it."
                            rows={4}
                            className={`w-full px-4 py-3 bg-[#FAF9F6]/50 border border-gray-100 focus:border-[#7DB095] focus:bg-white outline-none rounded-xl text-sm leading-relaxed transition-all duration-150 text-gray-800 ${getFontClassName(
                              (block as TextBlock).fontId || globalFont
                            )}`}
                          />
                          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-left">
                            <span className="text-[10px] text-gray-400 font-mono">
                              Font style:{" "}
                              <span className="font-semibold text-[#7DB095] capitalize">
                                {FONT_OPTIONS.find((f) => f.id === ((block as TextBlock).fontId || globalFont))?.name}
                              </span>
                            </span>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400 font-sans">Change Override:</span>
                              <select
                                value={(block as TextBlock).fontId || globalFont}
                                onChange={(e) => updateBlockFont(block.id, e.target.value)}
                                className="px-2.5 py-1 bg-[#FAF9F6] border border-[#7DB095]/15 focus:border-[#7DB095] rounded-lg text-[10px] outline-none text-gray-600 font-sans cursor-pointer transition-colors"
                              >
                                {FONT_OPTIONS.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {isImage && (
                        <div className="space-y-4 text-left font-sans">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                  Image Address (Hotlink URL)
                                </label>
                                <input
                                  type="url"
                                  required
                                  value={(block as ImageBlock).url}
                                  onChange={(e) => updateBlockImageProps(block.id, { url: e.target.value })}
                                  placeholder="https://images.unsplash.com/photo-..."
                                  className="w-full px-3 py-2 bg-[#FAF9F6]/50 border border-gray-200 focus:border-[#7DB095] focus:bg-white outline-none rounded-xl text-xs transition-all duration-150 text-gray-800"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                  Display Layout Position
                                </label>
                                <select
                                  value={(block as ImageBlock).style}
                                  onChange={(e) => updateBlockImageProps(block.id, { style: e.target.value as any })}
                                  className="w-full px-3 py-2 bg-[#FAF9F6]/50 border border-gray-200 focus:border-[#7DB095] rounded-xl text-xs outline-none text-gray-700 cursor-pointer"
                                >
                                  <option value="center">Centered Medium</option>
                                  <option value="full">Full Width Bleed</option>
                                  <option value="side">Floating Side Block</option>
                                </select>
                              </div>
                            </div>

                            {/* Local Image quick chooser */}
                            <div className="p-4 bg-[#FAF9F6] border border-dashed border-[#7DB095]/20 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                              <div className="p-1.5 bg-white rounded-full text-[#7DB095] shadow-sm">
                                <ImageIcon size={16} />
                              </div>
                              <div>
                                <p className="text-[11px] font-serif font-bold text-gray-700">
                                  Source photo from local gallery
                                </p>
                                <p className="text-[9px] text-gray-400">
                                  Max size 10MB • Preserves rendering aspect
                                </p>
                              </div>
                              <label className="px-3 py-1 bg-[#7DB095] hover:bg-[#648E77] text-white text-[10px] font-extrabold uppercase tracking-wider rounded-lg cursor-pointer transition-colors shadow-sm whitespace-nowrap">
                                <span>Choose photo</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleBlockImageUpload(e, block.id)}
                                />
                              </label>
                            </div>
                          </div>

                          {/* Image Caption */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              Aesthetic Caption (Optional)
                            </label>
                            <input
                              type="text"
                              value={(block as ImageBlock).caption || ""}
                              onChange={(e) => updateBlockImageProps(block.id, { caption: e.target.value })}
                              placeholder="e.g. Shadow castings at golden hour, July 2026"
                              className="w-full px-3 py-2 bg-[#FAF9F6]/50 border border-gray-200 focus:border-[#7DB095] focus:bg-white outline-none rounded-xl text-xs transition-all duration-150 text-gray-600 font-mono italic"
                            />
                          </div>

                          {/* Realtime check */}
                          {(block as ImageBlock).url && (
                            <div className="pt-2">
                              <span className="text-[9px] font-semibold text-gray-450 block mb-1 uppercase tracking-wide">
                                Realtime Asset Check:
                              </span>
                              <div className="h-28 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center relative p-1">
                                <img
                                  src={(block as ImageBlock).url}
                                  alt="Preview verification"
                                  referrerPolicy="no-referrer"
                                  className="h-full object-contain rounded-lg max-w-full"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Inline Hover elements separator insertions */}
                    <div className="absolute left-1/2 bottom-[-14px] transform -translate-x-1/2 z-10 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 w-[95%] font-sans">
                      <div className="h-px bg-[#7DB095]/40 relative flex items-center justify-center">
                        <div className="flex gap-2 bg-white px-3 py-1 shadow-md border border-[#7DB095]/20 rounded-full scale-90">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              appendTextBlock(idx);
                            }}
                            className="p-1 px-2.5 bg-gray-55 hover:bg-[#7DB095]/10 text-gray-600 hover:text-[#7DB095] text-[10px] font-bold rounded-full flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Plus size={10} />
                            <span>+ Paragraph</span>
                          </button>
                          <label className="p-1 px-2.5 bg-gray-55 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 text-[10px] font-bold rounded-full flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap">
                            <Plus size={10} />
                            <span>+ Image from Gallery</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleBlockImageUploadAfterIndex(e, idx)}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Asset quick select drawer */}
            <div className="bg-white border border-[#7DB095]/15 rounded-2xl p-6 space-y-4">
              <div className="text-left font-sans">
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-700 font-sans flex items-center gap-1.5">
                  <Flame size={13} className="text-[#7DB095]" />
                  <span>Aesthetic Asset Drawer</span>
                </h4>
                <p className="text-[11px] text-gray-400 font-sans mt-0.5">
                  Click on any premium nature and studio photograph to instantly append it as an image block to your entry draft.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 pt-1">
                {PRESET_COVERS.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => appendImageBlock(blocks.length - 1, preset.url)}
                    className="group flex flex-col text-left focus:outline-none focus:ring-2 focus:ring-[#7DB095] rounded-xl overflow-hidden border border-gray-100 hover:border-[#7DB095]/30 cursor-pointer transition-all"
                  >
                    <div className="h-16 w-full overflow-hidden relative bg-gray-50">
                      <img
                        src={preset.url}
                        alt={preset.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <span className="absolute bottom-1 right-1 px-1 bg-black/60 text-[8px] text-white rounded scale-90">
                        {preset.tag}
                      </span>
                    </div>
                    <div className="p-2 bg-white font-sans text-left">
                      <p className="text-[9px] font-semibold text-gray-700 truncate">{preset.name}</p>
                      <p className="text-[8px] text-[#7DB095] font-mono mt-0.5 uppercase tracking-wide">
                        Insert Block ↗
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Add next terminal block controls */}
            <div className="flex items-center justify-center gap-4 py-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 font-sans">
              <span className="text-xs font-semibold text-gray-500">Append next block:</span>
              <button
                type="button"
                onClick={() => appendTextBlock(blocks.length - 1)}
                className="px-4 py-2 bg-white hover:bg-[#7DB095]/10 border border-[#7DB095]/20 text-[#7DB095] text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={12} />
                <span>Text Paragraph</span>
              </button>
              <button
                type="button"
                onClick={() => appendImageBlock(blocks.length - 1)}
                className="px-4 py-2 bg-white hover:bg-sky-50 border border-sky-100 text-sky-600 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={12} />
                <span>Image Element</span>
              </button>
            </div>
          </div>
        ) : (
          /* View Mode: Live Preview */
          <div className="bg-white border border-[#7DB095]/15 rounded-2xl p-6 md:p-12 text-left" id="live-blocks-preview">
            <div className="flex justify-between items-center pb-4 border-b border-[#7DB095]/10 mb-8 font-sans">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[9px] text-emerald-700 font-bold uppercase tracking-widest animate-pulse">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                <span>Interactive Preview Mode</span>
              </span>
              <p className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">
                Font: {FONT_OPTIONS.find((f) => f.id === globalFont)?.name}
              </p>
            </div>

            <div className={`space-y-8 ${getFontClassName(globalFont)}`}>
              <div>
                <span className="px-2.5 py-0.5 bg-[#7DB095]/10 text-[#7DB095] text-[10px] uppercase font-mono font-bold tracking-widest rounded-md">
                  {subject || "Relationships"}
                </span>
                <h1 className="font-serif text-3xl md:text-5xl font-bold tracking-tight text-gray-900 leading-tight md:leading-snug mt-4 mb-2">
                  {title || "Echoes of a Forgotten Forest"}
                </h1>
                <p className="text-xs text-gray-400 font-mono italic">Published with care just now</p>
              </div>

              {/* Sequential parsed blocks stack */}
              <div className="space-y-6 pt-4 border-t border-gray-100 leading-relaxed text-gray-800 text-base md:text-lg">
                {blocks.map((block, idx) => {
                  if (block.type === "text") {
                    if (!block.text.trim()) {
                      return (
                        <p
                          key={block.id}
                          className="text-xs text-gray-400 italic font-mono border border-dashed border-gray-100 p-3 rounded"
                          style={{ fontFamily: "monospace" }}
                        >
                          (Empty text block #{idx + 1})
                        </p>
                      );
                    }
                    const overrideClass = block.fontId && block.fontId !== globalFont ? getFontClassName(block.fontId) : "";
                    return (
                      <p key={block.id} className={`whitespace-pre-wrap ${overrideClass}`}>
                        {block.text}
                      </p>
                    );
                  } else if (block.type === "image") {
                    if (!block.url.trim()) {
                      return (
                        <div
                          key={block.id}
                          className="p-6 bg-gray-50 border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 font-sans text-xs"
                        >
                          <ImageIcon size={18} className="mb-2" />
                          <span>Image block #{idx + 1} lacks a valid hotlink URL</span>
                        </div>
                      );
                    }

                    const isFull = block.style === "full";
                    const isSide = block.style === "side";

                    return (
                      <figure
                        key={block.id}
                        className={`my-8 clear-both transition-all duration-300 ${
                          isFull
                            ? "w-full animate-in zoom-in-95 duration-200"
                            : isSide
                            ? "sm:float-right sm:max-w-xs sm:ml-6 sm:mb-4 w-full text-left"
                            : "mx-auto max-w-2xl text-center"
                        }`}
                      >
                        <div className="overflow-hidden rounded-2xl border border-[#7DB095]/15 bg-[#FAF9F6] p-1.5 shadow-sm">
                          <img
                            src={block.url}
                            alt={block.caption || "Aesthetic visual layout"}
                            referrerPolicy="no-referrer"
                            className="w-full object-cover rounded-xl select-none"
                            style={{ maxHeight: isSide ? "300px" : "440px" }}
                          />
                        </div>
                        {block.caption && (
                          <figcaption className="mt-2 text-center text-xs text-gray-400 font-mono tracking-wider italic uppercase px-4">
                            — {block.caption}
                          </figcaption>
                        )}
                      </figure>
                    );
                  }
                  return null;
                })}
              </div>

              {/* End of preview */}
              <div className="mt-14 pt-8 border-t border-[#7DB095]/10 text-center font-sans">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7DB095] inline-block mx-1" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#7DB095] inline-block mx-1" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#7DB095] inline-block mx-1" />
                <p className="text-xs text-gray-400 font-mono mt-4 italic">End of entry preview</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Buttons Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 font-sans">
          {autosaveTime && (
            <span className="text-[11px] font-mono text-emerald-600 font-semibold flex items-center gap-1.5 mr-auto" id="autosave-indicator">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Draft Autosaved ({autosaveTime})</span>
            </span>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200/50 text-gray-700 font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-150 cursor-pointer"
            id="btn-write-footer-cancel"
          >
            Cancel Draft
          </button>
          <button
            type="submit"
            disabled={savingToServer}
            className="px-6 py-2.5 bg-[#7DB095] hover:bg-[#648E77] text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
            id="btn-write-footer-publish"
          >
            {savingToServer ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{currentPostToEdit ? "Saving changes..." : "Publishing Draft..."}</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>{currentPostToEdit ? "Save entry changes" : "Publish Article layout"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

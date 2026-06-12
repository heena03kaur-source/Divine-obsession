import { Block } from "../types";

export const FONT_OPTIONS = [
  { id: "font-serif", name: "Lora (Default Serif)", className: "font-serif" },
  {
    id: "font-playfair",
    name: "Playfair Display (Elegant Serif)",
    className: "font-playfair",
  },
  {
    id: "font-cinzel",
    name: "Cinzel (Gothic Roman)",
    className: "font-cinzel",
  },
  {
    id: "font-space",
    name: "Space Grotesk (Tech Sans)",
    className: "font-space",
  },
  { id: "font-sans", name: "Inter (Modern Sans)", className: "font-sans" },
  {
    id: "font-mono",
    name: "JetBrains Mono (Writer Mono)",
    className: "font-mono",
  },
];

export function getFontClassName(fontId: string): string {
  const f = FONT_OPTIONS.find((k) => k.id === fontId);
  return f ? f.className : "font-serif";
}

export function parseBlockContent(content: string): {
  isBlocks: boolean;
  globalFont: string;
  blocks: Block[];
  textFallback: string;
} {
  if (!content) {
    return {
      isBlocks: false,
      globalFont: "font-serif",
      blocks: [],
      textFallback: "",
    };
  }
  const trimmed = content.trim();
  if (
    trimmed.startsWith('{"version":"blocks-v1"') ||
    trimmed.startsWith('{"version": "blocks-v1"')
  ) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && Array.isArray(parsed.blocks)) {
        return {
          isBlocks: true,
          globalFont: parsed.globalFont || "font-serif",
          blocks: parsed.blocks,
          textFallback: "",
        };
      }
    } catch {}
  }
  
  // split content by double-newline for plain text backward compatibility
  const paragraphs = trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  return {
    isBlocks: false,
    globalFont: "font-serif",
    blocks: paragraphs.map((p, idx) => ({
      id: `fb-${idx}`,
      type: "text",
      text: p.trim(),
      fontId: "font-serif",
    })),
    textFallback: content,
  };
}

export function extractBlogSummary(content: string, maxLength: number = 220): string {
  if (!content) return "";
  const { blocks } = parseBlockContent(content);
  const textContent = blocks
    .filter((b): b is import("../types").TextBlock => b.type === "text")
    .map((b) => b.text)
    .join(" ");
  return textContent.length <= maxLength ? textContent : textContent.slice(0, maxLength).trim() + "...";
}

export function compressImage(
  dataUrl: string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.6
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const res = canvas.toDataURL("image/jpeg", quality);
      resolve(res);
    };
    img.onerror = () => {
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
}

export interface TextBlock {
  id: string;
  type: "text";
  text: string;
  fontId?: string;
  formatting?: "h1" | "h2" | "h3" | "h4" | "p" | "quote";
  align?: "left" | "center" | "right" | "justify";
}

export interface AdvancedBlock {
  id: string;
  type: "highlight" | "callout" | "pullquote" | "summary" | "step" | "timeline" | "faq" | "takeaways" | "code" | "table" | "divider";
  content: string; // JSON data specific to the block
}

export interface ImageBlock {
  id: string;
  type: "image";
  url: string;
  urls?: string[]; // for gallery/carousel
  caption?: string;
  style?: "center" | "full" | "side" | "gallery" | "carousel" | "hero" | "text-beside";
  textBeside?: string;
}

export type Block = TextBlock | ImageBlock | AdvancedBlock;

export interface Post {
  id: string;
  title: string;
  topic: string;
  category: string;
  subject: string;
  featuredImage: string;
  content: string; // JSON blocks-v1 string or plain text
  readTime: string;
  createdAt: string; 
  updatedAt: string;
  deleted?: boolean;
  deletedAt?: string;
  views?: number;
  
  // SEO & Layout new fields
  metaTitle?: string;
  metaDescription?: string;
  slug?: string;
  canonicalUrl?: string;
  ogImage?: string;
  schemaMarkup?: string;
  focusKeyword?: string;
  layoutStyle?: "centered" | "wide" | "magazine" | "minimal";
  status?: "draft" | "scheduled" | "published";
}

export interface User {
  email: string;
  name: string;
  googleAuth: boolean;
  createdAt: string;
  isAdmin?: boolean;
}

export interface Session {
  sessionId: string;
  email: string | null;
  device: string;
  path: string;
  durationSeconds: number;
  lastActive: string;
}

export interface DailyStat {
  date: string; // YYYY-MM-DD
  views: number;
  uniqueVisitors: number;
}

export interface Metrics {
  totalUsers: number;
  usersList: User[];
  totalViews: number;
  avgDurationMinutes: number;
  dailyStats: DailyStat[];
  sessions: Session[];
}

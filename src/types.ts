export interface TextBlock {
  id: string;
  type: "text";
  text: string;
  fontId?: string;
}

export interface ImageBlock {
  id: string;
  type: "image";
  url: string;
  caption?: string;
  style?: "center" | "full" | "side";
}

export type Block = TextBlock | ImageBlock;

export interface Post {
  id: string;
  title: string;
  topic: string;
  category: string;
  subject: string;
  featuredImage: string;
  content: string; // JSON blocks-v1 string or plain text
  readTime: string;
  createdAt: string; // ISO date string or formatted date
  updatedAt: string;
  deleted?: boolean;
  deletedAt?: string;
  views?: number;
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

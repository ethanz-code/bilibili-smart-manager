/** B站视频信息 */
export interface BiliVideo {
  bvid: string;
  aid: number;
  title: string;
  description: string;
  pic: string;
  owner: {
    mid: number;
    name: string;
    face: string;
  };
  stat: {
    view: number;
    danmaku: number;
    reply: number;
    favorite: number;
    coin: number;
    share: number;
    like: number;
  };
  tid: number;
  tname: string;
  tags: string[];
  pubdate: number;
  duration: number;
}

/** 收藏夹信息 */
export interface BiliFolder {
  id: number;
  fid: number;
  mid: number;
  title: string;
  description: string;
  count: number;
  type: number;
  videos?: BiliVideo[];
}

/** 关注的UP主信息 */
export interface BiliFollowing {
  mid: number;
  uname: string;
  face: string;
  sign: string;
  fans: number;
  attention: number;
  video_count?: number;
  last_video_date?: number;
  tags?: string[];
  category?: string;
}

/** AI分类结果 */
export interface ClassificationResult {
  category: string;
  confidence: number;
  tags: string[];
}

/** 用户指令 */
export interface UserCommand {
  type: 'move' | 'delete' | 'categorize' | 'unfollow' | 'analyze';
  target: 'bookmarks' | 'followings';
  filter?: {
    keyword?: string;
    category?: string;
    dateRange?: [number, number];
    minViews?: number;
    inactiveDays?: number;
  };
  action?: {
    destination?: string;
    newCategory?: string;
  };
}

/** 分析报告 */
export interface AnalysisReport {
  bookmarks: {
    total: number;
    byCategory: Record<string, number>;
    byTimePeriod: Record<string, number>;
    topUPs: Array<{ name: string; count: number }>;
    duplicates: BiliVideo[];
    invalid: BiliVideo[];
  };
  followings: {
    total: number;
    active: number;
    inactive: number;
    byCategory: Record<string, number>;
    topUPs: Array<{ name: string; fans: number }>;
  };
}

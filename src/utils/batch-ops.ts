import { BiliVideo, BiliFollowing } from '../types';

export class BatchOperations {
  static filterByCategory(videos: BiliVideo[], category: string): BiliVideo[] {
    return videos.filter(v =>
      v.tname === category ||
      v.tags?.includes(category) ||
      (v as any).category === category
    );
  }

  static filterByDateRange(
    videos: BiliVideo[],
    startTime: number,
    endTime: number
  ): BiliVideo[] {
    return videos.filter(v =>
      v.pubdate >= startTime && v.pubdate <= endTime
    );
  }

  static filterByKeyword(videos: BiliVideo[], keyword: string): BiliVideo[] {
    const lowerKeyword = keyword.toLowerCase();
    return videos.filter(v =>
      v.title.toLowerCase().includes(lowerKeyword) ||
      v.description.toLowerCase().includes(lowerKeyword) ||
      v.owner.name.toLowerCase().includes(lowerKeyword)
    );
  }

  static filterInactiveFollowings(
    followings: BiliFollowing[],
    inactiveDays: number
  ): BiliFollowing[] {
    const threshold = Date.now() / 1000 - inactiveDays * 86400;
    return followings.filter(f =>
      !f.last_video_date || f.last_video_date < threshold
    );
  }

  static findDuplicateVideos(videos: BiliVideo[]): BiliVideo[] {
    const seen = new Set<string>();
    const duplicates: BiliVideo[] = [];

    for (const video of videos) {
      if (seen.has(video.bvid)) {
        duplicates.push(video);
      } else {
        seen.add(video.bvid);
      }
    }

    return duplicates;
  }

  static groupByOwner(videos: BiliVideo[]): Record<string, BiliVideo[]> {
    const groups: Record<string, BiliVideo[]> = {};

    for (const video of videos) {
      const ownerName = video.owner.name;
      if (!groups[ownerName]) {
        groups[ownerName] = [];
      }
      groups[ownerName].push(video);
    }

    return groups;
  }

  static sortByStat(
    videos: BiliVideo[],
    statKey: keyof BiliVideo['stat'],
    order: 'asc' | 'desc' = 'desc'
  ): BiliVideo[] {
    return [...videos].sort((a, b) => {
      const diff = a.stat[statKey] - b.stat[statKey];
      return order === 'desc' ? -diff : diff;
    });
  }

  static paginate<T>(
    items: T[],
    page: number,
    pageSize: number
  ): {
    items: T[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
  } {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      items: items.slice(startIndex, endIndex),
      totalPages: Math.ceil(items.length / pageSize),
      currentPage: page,
      totalItems: items.length,
    };
  }

  static async batchExecute<T>(
    items: T[],
    operation: (item: T) => Promise<void>,
    onProgress?: (completed: number, total: number) => void,
    batchSize: number = 5,
    delayMs: number = 100
  ): Promise<{ success: number; failed: number; errors: Error[] }> {
    let success = 0;
    let failed = 0;
    const errors: Error[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map(item => operation(item))
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          success++;
        } else {
          failed++;
          errors.push(result.reason);
        }
      }

      onProgress?.(Math.min(i + batchSize, items.length), items.length);

      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return { success, failed, errors };
  }

  static calculateSummary(videos: BiliVideo[]): {
    totalViews: number;
    avgViews: number;
    topVideo: BiliVideo | null;
    categoryCounts: Record<string, number>;
    up主Counts: Record<string, number>;
  } {
    if (videos.length === 0) {
      return {
        totalViews: 0,
        avgViews: 0,
        topVideo: null,
        categoryCounts: {},
        up主Counts: {},
      };
    }

    const totalViews = videos.reduce((sum, v) => sum + v.stat.view, 0);
    const topVideo = videos.reduce((max, v) =>
      v.stat.view > max.stat.view ? v : max
    );

    const categoryCounts: Record<string, number> = {};
    const up主Counts: Record<string, number> = {};

    for (const video of videos) {
      const category = video.tname || '其他';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;

      const up主 = video.owner.name;
      up主Counts[up主] = (up主Counts[up主] || 0) + 1;
    }

    return {
      totalViews,
      avgViews: Math.round(totalViews / videos.length),
      topVideo,
      categoryCounts,
      up主Counts,
    };
  }
}

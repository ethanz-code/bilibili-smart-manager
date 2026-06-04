import { UserCommand } from '../types';

export class CommandParser {
  private patterns: Array<{
    regex: RegExp;
    handler: (match: RegExpMatchArray) => UserCommand;
  }> = [];

  constructor() {
    this.initPatterns();
  }

  private initPatterns() {
    this.patterns.push({
      regex: /把(.+?)(?:视频|内容)?移动?到(.+)$/,
      handler: (match) => ({
        type: 'move',
        target: 'bookmarks',
        filter: { category: this.normalizeCategory(match[1]) },
        action: { destination: match[2].trim() }
      })
    });

    this.patterns.push({
      regex: /删除(?:所有|全部)?(.+?)(?:视频|内容)?$/,
      handler: (match) => ({
        type: 'delete',
        target: 'bookmarks',
        filter: this.parseFilter(match[1])
      })
    });

    this.patterns.push({
      regex: /批量删除(.+?)(?:视频|内容)?$/,
      handler: (match) => ({
        type: 'delete',
        target: 'bookmarks',
        filter: this.parseFilter(match[1])
      })
    });

    this.patterns.push({
      regex: /取消关注(.+?)(?:UP主|博主)?$/,
      handler: (match) => ({
        type: 'unfollow',
        target: 'followings',
        filter: this.parseFollowingFilter(match[1])
      })
    });

    this.patterns.push({
      regex: /(?:把|将)?(.+?)(?:视频|内容)?(?:分类|归类)到(.+)$/,
      handler: (match) => ({
        type: 'categorize',
        target: 'bookmarks',
        filter: { category: this.normalizeCategory(match[1]) },
        action: { destination: match[2].trim() }
      })
    });

    this.patterns.push({
      regex: /分析(?:我的)?收藏(?:夹)?/,
      handler: () => ({
        type: 'analyze',
        target: 'bookmarks'
      })
    });

    this.patterns.push({
      regex: /分析(?:我的)?关注(?:列表)?/,
      handler: () => ({
        type: 'analyze',
        target: 'followings'
      })
    });
  }

  private normalizeCategory(text: string): string {
    const categoryMap: Record<string, string> = {
      '游戏': '游戏', 'gaming': '游戏',
      '科技': '科技', '技术': '科技', 'tech': '科技',
      '美食': '美食', '烹饪': '美食', 'food': '美食',
      '音乐': '音乐', 'music': '音乐',
      '学习': '教育', '教程': '教育', 'education': '教育',
      '生活': '生活', 'vlog': '生活',
      '搞笑': '搞笑', '沙雕': '搞笑',
      '动漫': '动画', '番剧': '动画', 'anime': '动画',
    };

    const stripped = text.trim().replace(/^(所有|全部|每个|一些|这个|那个)/, '');
    const normalized = stripped.toLowerCase();
    return categoryMap[normalized] || stripped;
  }

  private parseFilter(text: string): UserCommand['filter'] {
    const filter: UserCommand['filter'] = {};

    const categoryKeywords = ['游戏', '科技', '美食', '音乐', '学习', '生活', '搞笑', '动漫'];
    for (const keyword of categoryKeywords) {
      if (text.includes(keyword)) {
        filter.category = keyword;
        break;
      }
    }

    const yearMatch = text.match(/(\d{4})年之前/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      filter.dateRange = [0, new Date(year, 0, 1).getTime() / 1000];
    }

    if (text.includes('失效')) {
      filter.keyword = '__invalid__';
    }
    if (text.includes('重复')) {
      filter.keyword = '__duplicate__';
    }

    return filter;
  }

  private parseFollowingFilter(text: string): UserCommand['filter'] {
    const filter: UserCommand['filter'] = {};

    const monthMatch = text.match(/(\d+)个?月/);
    if (monthMatch) {
      filter.inactiveDays = parseInt(monthMatch[1]) * 30;
    }

    const dayMatch = text.match(/(\d+)天/);
    if (dayMatch) {
      filter.inactiveDays = parseInt(dayMatch[1]);
    }

    if (text.includes('僵尸') || text.includes('停更')) {
      filter.inactiveDays = filter.inactiveDays || 90;
    }

    return filter;
  }

  parse(input: string): UserCommand | null {
    const normalizedInput = input.trim();

    for (const pattern of this.patterns) {
      const match = normalizedInput.match(pattern.regex);
      if (match) {
        return pattern.handler(match);
      }
    }

    return null;
  }

  getSuggestions(partial: string): string[] {
    const suggestions = [
      '把游戏视频移到游戏收藏夹',
      '删除所有失效视频',
      '删除所有重复视频',
      '取消关注3个月没更新的UP主',
      '把所有美食视频分类到美食收藏夹',
      '分析我的收藏夹',
      '分析我的关注列表',
      '批量删除2020年之前的视频',
    ];

    return suggestions.filter(s =>
      s.includes(partial) || partial.includes(s.substring(0, 4))
    );
  }
}

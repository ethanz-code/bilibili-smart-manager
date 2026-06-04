import { ClassificationResult } from '../types';

interface VideoInput {
  title: string;
  tags?: string[];
  tname?: string;
  description?: string;
}

interface UP主Input {
  uname: string;
  sign?: string;
  videoTitles?: string[];
}

interface Category {
  name: string;
  count: number;
  videos: string[];
}

export class AIClassifier {
  private apiKey: string;
  private categories = [
    '游戏', '科技', '美食', '音乐', '舞蹈', '动画', '影视',
    '生活', '知识', '教育', '体育', '时尚', '娱乐', '搞笑',
    '汽车', '动物', '其他'
  ];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /** 基于规则的快速分类（无需API调用） */
  private ruleBasedClassify(title: string, tags: string[] = [], tname: string = ''): ClassificationResult | null {
    const text = `${title} ${tags.join(' ')} ${tname}`.toLowerCase();

    const rules: Record<string, string[]> = {
      '游戏': ['游戏', '攻略', '原神', '王者', '英雄联盟', 'LOL', '吃鸡', 'steam', '手游', '端游', 'PS5', 'switch'],
      '科技': ['科技', '数码', '手机', '电脑', '编程', 'python', 'ai', '人工智能', '测评', '开箱', '教程'],
      '美食': ['美食', '做饭', '烹饪', '食谱', '菜谱', '烘焙', '小吃', '餐厅', '探店'],
      '音乐': ['音乐', 'mv', '翻唱', '原创音乐', '钢琴', '吉他', '乐队', '演唱会'],
      '舞蹈': ['舞蹈', '宅舞', '街舞', '芭蕾', '编舞'],
      '动画': ['动画', '动漫', '番剧', '漫画', '二次元', 'acg'],
      '影视': ['电影', '电视剧', '综艺', '影评', '解说', '剧评'],
      '生活': ['生活', 'vlog', '日常', '旅行', '家居', '装修', '宠物', '猫', '狗'],
      '知识': ['科普', '知识', '历史', '哲学', '心理学', '经济', '物理', '化学'],
      '教育': ['教程', '学习', '考试', '考研', '英语', '数学', '课程'],
      '体育': ['体育', '足球', '篮球', '健身', '运动', 'nba', '世界杯'],
      '时尚': ['时尚', '穿搭', '美妆', '护肤', '化妆', '发型'],
      '搞笑': ['搞笑', '沙雕', '鬼畜', '整活', '段子', '笑话'],
      '汽车': ['汽车', '车评', '驾驶', '新车', '二手车'],
      '动物': ['动物', '猫', '狗', '萌宠', '野生动物'],
    };

    let bestMatch: { category: string; count: number; tags: string[] } | null = null;

    for (const [category, keywords] of Object.entries(rules)) {
      const matchedTags = keywords.filter(kw => text.includes(kw));
      const matchCount = matchedTags.length;
      if (matchCount > 0 && (!bestMatch || matchCount > bestMatch.count)) {
        bestMatch = { category, count: matchCount, tags: matchedTags };
      }
    }

    if (bestMatch && bestMatch.count >= 2) {
      return { category: bestMatch.category, confidence: Math.min(0.6 + bestMatch.count * 0.1, 0.95), tags: bestMatch.tags };
    }
    if (bestMatch && bestMatch.count === 1) {
      const confidence = tname && text.includes(tname.toLowerCase()) ? 0.75 : 0.7;
      return { category: bestMatch.category, confidence, tags: bestMatch.tags };
    }

    // Fallback: check if tags or tname directly match a category name
    const directMatch = tags.find(t => this.categories.includes(t));
    if (directMatch) {
      return { category: directMatch, confidence: 0.7, tags: [directMatch] };
    }
    if (tname && this.categories.includes(tname)) {
      return { category: tname, confidence: 0.7, tags: [tname] };
    }

    return null;
  }

  /** AI增强分类（调用LLM API） */
  private async aiClassify(text: string): Promise<ClassificationResult> {
    // 实际实现中会调用 OpenAI API
    // 这里返回模拟结果
    return { category: '其他', confidence: 0.5, tags: [] };
  }

  /** 分类单个视频 */
  async classifyVideo(video: VideoInput): Promise<ClassificationResult> {
    // 优先使用规则分类
    const ruleResult = this.ruleBasedClassify(video.title, video.tags, video.tname);
    if (ruleResult && ruleResult.confidence >= 0.7) {
      return ruleResult;
    }

    // 规则分类置信度不足时，使用AI增强
    try {
      const aiResult = await this.aiClassify(
        `标题: ${video.title}\n标签: ${(video.tags || []).join(', ')}\n分区: ${video.tname || '未知'}`
      );
      return aiResult.confidence > (ruleResult?.confidence || 0) ? aiResult : ruleResult!;
    } catch {
      return ruleResult || { category: '其他', confidence: 0.5, tags: [] };
    }
  }

  /** 批量分类视频 */
  async classifyVideos(videos: VideoInput[]): Promise<ClassificationResult[]> {
    return Promise.all(videos.map(v => this.classifyVideo(v)));
  }

  /** 分类UP主 */
  async classifyUP主(up主: UP主Input): Promise<ClassificationResult> {
    const text = `${up主.uname} ${up主.sign || ''} ${(up主.videoTitles || []).join(' ')}`;
    const ruleResult = this.ruleBasedClassify(text);

    if (ruleResult) {
      return ruleResult;
    }

    // 基于视频标题统计分类
    if (up主.videoTitles && up主.videoTitles.length > 0) {
      const categoryCounts: Record<string, number> = {};
      for (const title of up主.videoTitles) {
        const result = this.ruleBasedClassify(title);
        if (result) {
          categoryCounts[result.category] = (categoryCounts[result.category] || 0) + 1;
        }
      }

      const topCategory = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])[0];

      if (topCategory) {
        return {
          category: topCategory[0],
          confidence: Math.min(0.5 + topCategory[1] * 0.1, 0.9),
          tags: []
        };
      }
    }

    return { category: '其他', confidence: 0.5, tags: [] };
  }

  /** 从视频列表生成智能分类 */
  async generateCategories(videos: VideoInput[]): Promise<Category[]> {
    const categoryMap: Record<string, { count: number; videos: string[] }> = {};

    for (const video of videos) {
      const result = await this.classifyVideo(video);
      if (!categoryMap[result.category]) {
        categoryMap[result.category] = { count: 0, videos: [] };
      }
      categoryMap[result.category].count++;
      categoryMap[result.category].videos.push(video.title);
    }

    return Object.entries(categoryMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  }
}

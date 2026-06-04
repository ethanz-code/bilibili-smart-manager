import { AIClassifier } from '../../src/services/ai-classifier';

describe('AIClassifier', () => {
  let classifier: AIClassifier;

  beforeEach(() => {
    classifier = new AIClassifier('test-api-key');
  });

  test('classifyVideo should return category and confidence', async () => {
    const result = await classifier.classifyVideo({
      title: '【原神】4.5版本攻略 全角色强度排行',
      tags: ['原神', '游戏', '攻略'],
      tname: '手机游戏'
    });

    expect(result.category).toBe('游戏');
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.tags).toContain('游戏');
  });

  test('classifyVideos should batch classify multiple videos', async () => {
    const videos = [
      { title: '红烧肉做法大全', tags: ['美食', '烹饪'], tname: '美食' },
      { title: 'Python入门教程', tags: ['编程', 'Python'], tname: '计算机技术' },
      { title: '周杰伦新歌MV', tags: ['音乐', '周杰伦'], tname: '音乐' },
    ];

    const results = await classifier.classifyVideos(videos);
    expect(results).toHaveLength(3);
    expect(results[0].category).toBe('美食');
    expect(results[1].category).toBe('科技');
    expect(results[2].category).toBe('音乐');
  });

  test('classifyUP主 should categorize based on content', async () => {
    const result = await classifier.classifyUP主({
      uname: '老番茄',
      sign: '游戏UP主',
      videoTitles: ['GTA5搞笑集锦', '我的世界生存', '游戏剧情解说']
    });

    expect(result.category).toBe('游戏');
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  test('generateCategories should create smart categories from videos', async () => {
    const videos = [
      { title: '红烧肉做法', tags: ['美食'] },
      { title: '清蒸鱼教程', tags: ['美食'] },
      { title: 'Python教程', tags: ['编程'] },
      { title: 'JavaScript入门', tags: ['编程'] },
      { title: '原神攻略', tags: ['游戏'] },
    ];

    const categories = await classifier.generateCategories(videos);
    expect(categories.length).toBeGreaterThanOrEqual(3);
    expect(categories.some(c => c.name === '美食')).toBe(true);
    expect(categories.some(c => c.name === '科技')).toBe(true);
    expect(categories.some(c => c.name === '游戏')).toBe(true);
  });
});

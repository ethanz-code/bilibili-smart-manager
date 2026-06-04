import { CommandParser } from '../../src/services/command-parser';

describe('CommandParser', () => {
  let parser: CommandParser;

  beforeEach(() => {
    parser = new CommandParser();
  });

  test('parse "把游戏视频移到游戏收藏夹"', () => {
    const result = parser.parse('把游戏视频移到游戏收藏夹');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('move');
    expect(result!.target).toBe('bookmarks');
    expect(result!.filter?.category).toBe('游戏');
    expect(result!.action?.destination).toBe('游戏收藏夹');
  });

  test('parse "删除所有失效视频"', () => {
    const result = parser.parse('删除所有失效视频');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('delete');
    expect(result!.target).toBe('bookmarks');
  });

  test('parse "取消关注3个月没更新的UP主"', () => {
    const result = parser.parse('取消关注3个月没更新的UP主');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('unfollow');
    expect(result!.target).toBe('followings');
    expect(result!.filter?.inactiveDays).toBe(90);
  });

  test('parse "把所有美食视频分类到美食收藏夹"', () => {
    const result = parser.parse('把所有美食视频分类到美食收藏夹');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('categorize');
    expect(result!.target).toBe('bookmarks');
    expect(result!.filter?.category).toBe('美食');
    expect(result!.action?.destination).toBe('美食收藏夹');
  });

  test('parse "分析我的收藏夹"', () => {
    const result = parser.parse('分析我的收藏夹');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('analyze');
    expect(result!.target).toBe('bookmarks');
  });

  test('parse "批量删除2020年之前的视频"', () => {
    const result = parser.parse('批量删除2020年之前的视频');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('delete');
    expect(result!.target).toBe('bookmarks');
    expect(result!.filter?.dateRange).toBeDefined();
  });

  test('parse should return null for invalid commands', () => {
    const result = parser.parse('今天天气怎么样');
    expect(result).toBeNull();
  });
});

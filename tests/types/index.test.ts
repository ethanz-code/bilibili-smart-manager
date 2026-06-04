import {
  BiliVideo,
  BiliFolder,
  BiliFollowing,
  ClassificationResult,
  UserCommand,
  AnalysisReport,
} from '../../src/types';

describe('Type definitions', () => {
  test('BiliVideo should have required fields', () => {
    const video: BiliVideo = {
      bvid: 'BV1xx411c7mD',
      aid: 12345,
      title: 'Test Video',
      description: 'Test Description',
      pic: 'https://example.com/pic.jpg',
      owner: { mid: 123, name: 'Test UP', face: '' },
      stat: { view: 100, danmaku: 10, reply: 5, favorite: 20, coin: 15, share: 3, like: 50 },
      tid: 17,
      tname: '单机游戏',
      tags: ['游戏', '单机'],
      pubdate: Date.now(),
      duration: 300,
    };
    expect(video.bvid).toBe('BV1xx411c7mD');
    expect(video.stat.view).toBe(100);
    expect(video.owner.name).toBe('Test UP');
    expect(video.tags).toContain('游戏');
  });

  test('BiliFolder should support default and custom types', () => {
    const defaultFolder: BiliFolder = {
      id: 1, fid: 1, mid: 123, title: '默认收藏夹',
      description: '', count: 50, type: 0,
    };
    const customFolder: BiliFolder = {
      id: 2, fid: 2, mid: 123, title: '游戏',
      description: '游戏视频', count: 30, type: 1,
    };
    expect(defaultFolder.type).toBe(0);
    expect(customFolder.type).toBe(1);
    expect(defaultFolder.count).toBe(50);
    expect(customFolder.title).toBe('游戏');
  });

  test('BiliFolder with optional videos', () => {
    const folder: BiliFolder = {
      id: 3, fid: 3, mid: 123, title: '带视频的收藏夹',
      description: '', count: 1, type: 1,
      videos: [{
        bvid: 'BV1test', aid: 1, title: 'V', description: '',
        pic: '', owner: { mid: 1, name: '', face: '' },
        stat: { view: 0, danmaku: 0, reply: 0, favorite: 0, coin: 0, share: 0, like: 0 },
        tid: 0, tname: '', tags: [], pubdate: 0, duration: 0,
      }],
    };
    expect(folder.videos).toHaveLength(1);
    expect(folder.videos![0].bvid).toBe('BV1test');
  });

  test('BiliFollowing should have required fields', () => {
    const following: BiliFollowing = {
      mid: 456,
      uname: 'Test UP',
      face: 'https://example.com/face.jpg',
      sign: '个人简介',
      fans: 10000,
      attention: 200,
    };
    expect(following.mid).toBe(456);
    expect(following.uname).toBe('Test UP');
    expect(following.fans).toBe(10000);
  });

  test('BiliFollowing with optional fields', () => {
    const following: BiliFollowing = {
      mid: 789,
      uname: 'UP With Extras',
      face: '',
      sign: '',
      fans: 5000,
      attention: 100,
      video_count: 50,
      last_video_date: Date.now(),
      tags: ['游戏', '科技'],
      category: '游戏区UP主',
    };
    expect(following.video_count).toBe(50);
    expect(following.tags).toContain('科技');
    expect(following.category).toBe('游戏区UP主');
  });

  test('ClassificationResult should have correct shape', () => {
    const result: ClassificationResult = {
      category: '游戏',
      confidence: 0.95,
      tags: ['单机', 'Steam'],
    };
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  test('UserCommand should support all command types', () => {
    const moveCmd: UserCommand = {
      type: 'move',
      target: 'bookmarks',
      filter: { keyword: '游戏' },
      action: { destination: '游戏收藏夹' },
    };
    const analyzeCmd: UserCommand = {
      type: 'analyze',
      target: 'followings',
    };
    expect(moveCmd.type).toBe('move');
    expect(analyzeCmd.target).toBe('followings');
  });

  test('AnalysisReport should have bookmarks and followings sections', () => {
    const report: AnalysisReport = {
      bookmarks: {
        total: 100,
        byCategory: { '游戏': 30, '科技': 20 },
        byTimePeriod: { '2024': 50, '2023': 50 },
        topUPs: [{ name: 'UP1', count: 10 }],
        duplicates: [],
        invalid: [],
      },
      followings: {
        total: 200,
        active: 150,
        inactive: 50,
        byCategory: { '游戏': 80 },
        topUPs: [{ name: 'UP1', fans: 1000000 }],
      },
    };
    expect(report.bookmarks.total).toBe(100);
    expect(report.followings.active).toBe(150);
    expect(report.bookmarks.duplicates).toHaveLength(0);
  });
});

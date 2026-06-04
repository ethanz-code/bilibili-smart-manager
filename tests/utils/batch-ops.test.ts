import { BatchOperations } from '../../src/utils/batch-ops';
import { BiliVideo, BiliFollowing } from '../../src/types';

describe('BatchOperations', () => {
  const mockVideos: BiliVideo[] = [
    {
      bvid: 'BV1', aid: 1, title: '游戏攻略1', description: '', pic: '',
      owner: { mid: 100, name: 'UP主A', face: '' },
      stat: { view: 1000, danmaku: 10, reply: 5, favorite: 20, coin: 15, share: 3, like: 50 },
      tid: 17, tname: '游戏', tags: ['游戏'], pubdate: Date.now() / 1000 - 86400, duration: 300
    },
    {
      bvid: 'BV2', aid: 2, title: '美食教程', description: '', pic: '',
      owner: { mid: 200, name: 'UP主B', face: '' },
      stat: { view: 500, danmaku: 5, reply: 2, favorite: 10, coin: 8, share: 1, like: 30 },
      tid: 21, tname: '美食', tags: ['美食'], pubdate: Date.now() / 1000 - 86400 * 365, duration: 600
    },
    {
      bvid: 'BV3', aid: 3, title: '游戏攻略2', description: '', pic: '',
      owner: { mid: 100, name: 'UP主A', face: '' },
      stat: { view: 800, danmaku: 8, reply: 3, favorite: 15, coin: 10, share: 2, like: 40 },
      tid: 17, tname: '游戏', tags: ['游戏'], pubdate: Date.now() / 1000 - 86400 * 2, duration: 450
    },
  ];

  const mockFollowings: BiliFollowing[] = [
    { mid: 100, uname: '活跃UP主', face: '', sign: '', fans: 10000, attention: 50, last_video_date: Date.now() / 1000 - 86400 },
    { mid: 200, uname: '僵尸UP主', face: '', sign: '', fans: 5000, attention: 30, last_video_date: Date.now() / 1000 - 86400 * 120 },
    { mid: 300, uname: '半年没更新', face: '', sign: '', fans: 20000, attention: 100, last_video_date: Date.now() / 1000 - 86400 * 180 },
  ];

  test('filterByCategory should filter videos by category', () => {
    const result = BatchOperations.filterByCategory(mockVideos, '游戏');
    expect(result).toHaveLength(2);
    expect(result.every(v => v.tname === '游戏')).toBe(true);
  });

  test('filterByDateRange should filter by time range', () => {
    const oneWeekAgo = Date.now() / 1000 - 86400 * 7;
    const result = BatchOperations.filterByDateRange(mockVideos, oneWeekAgo, Date.now() / 1000);
    expect(result).toHaveLength(2);
  });

  test('filterInactiveFollowings should find inactive UP主', () => {
    const result = BatchOperations.filterInactiveFollowings(mockFollowings, 90);
    expect(result).toHaveLength(2);
    expect(result.some(f => f.uname === '僵尸UP主')).toBe(true);
    expect(result.some(f => f.uname === '半年没更新')).toBe(true);
  });

  test('findDuplicateVideos should detect duplicates', () => {
    const duplicates = [...mockVideos, { ...mockVideos[0] }];
    const result = BatchOperations.findDuplicateVideos(duplicates);
    expect(result).toHaveLength(1);
    expect(result[0].bvid).toBe('BV1');
  });

  test('groupByOwner should group videos by UP主', () => {
    const result = BatchOperations.groupByOwner(mockVideos);
    expect(result['UP主A']).toHaveLength(2);
    expect(result['UP主B']).toHaveLength(1);
  });

  test('sortByStat should sort by view count', () => {
    const result = BatchOperations.sortByStat(mockVideos, 'view', 'desc');
    expect(result[0].bvid).toBe('BV1');
    expect(result[2].bvid).toBe('BV2');
  });

  test('paginate should return correct page', () => {
    const result = BatchOperations.paginate(mockVideos, 1, 2);
    expect(result.items).toHaveLength(2);
    expect(result.totalPages).toBe(2);
    expect(result.currentPage).toBe(1);
  });
});

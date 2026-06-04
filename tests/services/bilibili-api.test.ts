import { BilibiliAPI } from '../../src/services/bilibili-api';

(global as any).fetch = jest.fn();

describe('BilibiliAPI', () => {
  let api: BilibiliAPI;

  beforeEach(() => {
    api = new BilibiliAPI();
    (fetch as jest.Mock).mockClear();
  });

  test('getFavoriteFolders should return folder list', async () => {
    const mockResponse = {
      code: 0,
      data: {
        list: [
          { id: 1, fid: 1, mid: 123, title: '默认收藏夹', intro: '', media_count: 100, fav_state: 0 },
          { id: 2, fid: 2, mid: 123, title: '游戏', intro: '', media_count: 50, fav_state: 1 },
        ],
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    });

    const folders = await api.getFavoriteFolders(123);
    expect(folders).toHaveLength(2);
    expect(folders[0].title).toBe('默认收藏夹');
    expect(folders[1].type).toBe(1);
  });

  test('getFollowings should return following list', async () => {
    const mockResponse = {
      code: 0,
      data: {
        list: [
          { mid: 456, uname: 'UP主A', face: '', sign: '简介', fans: 10000, attention: 50 },
        ],
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    });

    const followings = await api.getFollowings(123);
    expect(followings).toHaveLength(1);
    expect(followings[0].uname).toBe('UP主A');
  });

  test('getFolderVideos should return video list', async () => {
    const mockResponse = {
      code: 0,
      data: {
        medias: [
          {
            bvid: 'BV1xx411c7mD',
            id: 12345,
            title: 'Test Video',
            intro: 'Description',
            cover: 'https://example.com/pic.jpg',
            upper: { mid: 456, name: 'UP主', face: '' },
            cnt_info: { play: 100, danmaku: 10, collect: 20 },
            attr: 0,
            type: 2,
          },
        ],
        has_more: false,
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    });

    const videos = await api.getFolderVideos(1);
    expect(videos).toHaveLength(1);
    expect(videos[0].title).toBe('Test Video');
    expect(videos[0].bvid).toBe('BV1xx411c7mD');
  });

  test('batchDeleteFavorites should call API for each video', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({ code: 0 }),
    });

    await api.batchDeleteFavorites(1, [1, 2, 3]);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  test('batchMoveFavorites should call API for each video', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({ code: 0 }),
    });

    await api.batchMoveFavorites([1, 2, 3], 1, 2);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  test('should throw on API error', async () => {
    const mockResponse = {
      code: -1,
      message: '未登录',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    });

    await expect(api.getFavoriteFolders(123)).rejects.toThrow('B站API错误: 未登录');
  });
});

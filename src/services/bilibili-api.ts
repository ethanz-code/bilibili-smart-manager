import { BiliVideo, BiliFolder, BiliFollowing } from '../types';

export class BilibiliAPI {
  private baseUrl = 'https://api.bilibili.com';

  private async request<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      credentials: 'include',
      headers: {
        'Referer': 'https://www.bilibili.com',
      },
    });

    const data = await response.json();
    if (data.code !== 0) {
      throw new Error(`B站API错误: ${data.message}`);
    }
    return data.data;
  }

  async getFavoriteFolders(mid: number): Promise<BiliFolder[]> {
    const data = await this.request<{ list: any[] }>(
      '/x/v3/fav/folder/created/list-all',
      { up_mid: mid.toString() },
    );

    return data.list.map(item => ({
      id: item.id,
      fid: item.fid,
      mid: item.mid,
      title: item.title,
      description: item.intro || '',
      count: item.media_count,
      type: item.fav_state === 1 ? 1 : 0,
    }));
  }

  async getFolderVideos(
    folderId: number,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<BiliVideo[]> {
    const data = await this.request<{ medias: any[]; has_more: boolean }>(
      '/x/v3/fav/resource/list',
      {
        media_id: folderId.toString(),
        pn: page.toString(),
        ps: pageSize.toString(),
        order: 'mtime',
        type: '0',
      },
    );

    return (data.medias || []).map(media => ({
      bvid: media.bvid,
      aid: media.id,
      title: media.title,
      description: media.intro || '',
      pic: media.cover,
      owner: {
        mid: media.upper?.mid || 0,
        name: media.upper?.name || '未知UP主',
        face: media.upper?.face || '',
      },
      stat: {
        view: media.cnt_info?.play || 0,
        danmaku: media.cnt_info?.danmaku || 0,
        reply: media.cnt_info?.reply || 0,
        favorite: media.cnt_info?.collect || 0,
        coin: 0,
        share: 0,
        like: 0,
      },
      tid: media.type || 0,
      tname: media.type_name || '',
      tags: [],
      pubdate: media.pubtime || 0,
      duration: media.duration || 0,
    }));
  }

  async getFollowings(
    mid: number,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<BiliFollowing[]> {
    const data = await this.request<{ list: any[] }>(
      '/x/relation/followings',
      {
        vmid: mid.toString(),
        pn: page.toString(),
        ps: pageSize.toString(),
        order: 'desc',
      },
    );

    return data.list.map(item => ({
      mid: item.mid,
      uname: item.uname,
      face: item.face,
      sign: item.sign || '',
      fans: item.fans || 0,
      attention: item.attention || 0,
    }));
  }

  async getVideoDetail(bvid: string): Promise<BiliVideo> {
    const data = await this.request<any>(
      '/x/web-interface/view',
      { bvid },
    );

    return {
      bvid: data.bvid,
      aid: data.aid,
      title: data.title,
      description: data.desc,
      pic: data.pic,
      owner: {
        mid: data.owner.mid,
        name: data.owner.name,
        face: data.owner.face,
      },
      stat: {
        view: data.stat.view,
        danmaku: data.stat.danmaku,
        reply: data.stat.reply,
        favorite: data.stat.favorite,
        coin: data.stat.coin,
        share: data.stat.share,
        like: data.stat.like,
      },
      tid: data.tid,
      tname: data.tname,
      tags: [],
      pubdate: data.pubdate,
      duration: data.duration,
    };
  }

  async getVideoTags(bvid: string): Promise<string[]> {
    const data = await this.request<any[]>(
      '/x/tag/archive/tags',
      { bvid },
    );
    return data.map(tag => tag.tag_name);
  }

  async batchDeleteFavorites(folderId: number, resourceIds: number[]): Promise<void> {
    for (const resourceId of resourceIds) {
      await this.request('/x/v3/fav/resource/batch-del', {
        resources: resourceId.toString(),
        media_id: folderId.toString(),
      });
    }
  }

  async batchMoveFavorites(
    resourceIds: number[],
    fromFolderId: number,
    toFolderId: number,
  ): Promise<void> {
    for (const resourceId of resourceIds) {
      await this.request('/x/v3/fav/resource/move-add', {
        resources: resourceId.toString(),
        src_media_id: fromFolderId.toString(),
        tar_media_id: toFolderId.toString(),
      });
    }
  }

  async batchUnfollow(mids: number[]): Promise<void> {
    for (const mid of mids) {
      await this.request('/x/relation/modify', {
        fid: mid.toString(),
      });
    }
  }
}

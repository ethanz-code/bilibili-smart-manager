import React, { useState, useEffect, useCallback } from 'react';
import { CommandBar } from '../components/CommandBar';
import { BookmarkManager } from '../components/BookmarkManager';
import { FollowingManager } from '../components/FollowingManager';
import { AnalysisPanel } from '../components/AnalysisPanel';
import { BilibiliAPI } from '../services/bilibili-api';
import { StorageService } from '../services/storage';
import { CommandParser } from '../services/command-parser';
import { AIClassifier } from '../services/ai-classifier';
import { UserCommand, BiliVideo, BiliFolder, BiliFollowing } from '../types';

type Tab = 'bookmarks' | 'followings' | 'analysis';

export const Popup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('bookmarks');
  const [videos, setVideos] = useState<BiliVideo[]>([]);
  const [folders, setFolders] = useState<BiliFolder[]>([]);
  const [followings, setFollowings] = useState<BiliFollowing[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [mid, setMid] = useState<number | null>(null);

  const api = new BilibiliAPI();
  const storage = new StorageService();
  const parser = new CommandParser();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const savedBookmarks = await storage.getBookmarks();
      if (savedBookmarks.length > 0) {
        setVideos(savedBookmarks);
      }

      const savedFollowings = await storage.getFollowings();
      if (savedFollowings.length > 0) {
        setFollowings(savedFollowings);
      }

      const savedMid = await storage.getSetting<number | null>('mid', null);
      if (savedMid) {
        setMid(savedMid);
        const folderList = await api.getFavoriteFolders(savedMid);
        setFolders(folderList);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const detectMid = async (): Promise<number> => {
    if (mid) return mid;
    try {
      const resp = await fetch('https://api.bilibili.com/x/web-interface/nav', {
        credentials: 'include',
      });
      const data = await resp.json();
      if (data.code === 0 && data.data?.mid) {
        const userMid = data.data.mid;
        setMid(userMid);
        await storage.saveSetting('mid', userMid);
        return userMid;
      }
    } catch (e) {
      console.error('获取用户ID失败:', e);
    }
    throw new Error('请先登录B站');
  };

  const loadFolders = async (userMid: number) => {
    try {
      const folderList = await api.getFavoriteFolders(userMid);
      setFolders(folderList);
      return folderList;
    } catch (e) {
      console.error('获取收藏夹列表失败:', e);
      return [];
    }
  };

  const handleCommand = async (command: UserCommand) => {
    setLoading(true);
    setStatus('正在执行...');

    try {
      const userMid = await detectMid();

      switch (command.type) {
        case 'analyze': {
          setStatus('正在分析收藏夹...');
          if (command.target === 'bookmarks') {
            const folderList = await loadFolders(userMid);
            let allVideos: BiliVideo[] = [];
            for (const folder of folderList) {
              const vids = await api.getFolderVideos(folder.id);
              allVideos = [...allVideos, ...vids];
            }
            await storage.saveBookmarks(allVideos);
            setVideos(allVideos);
            setStatus(`分析完成，共 ${allVideos.length} 个收藏视频`);
          } else {
            const followList = await api.getFollowings(userMid);
            await storage.saveFollowings(followList);
            setFollowings(followList);
            setStatus(`分析完成，共关注 ${followList.length} 个UP主`);
          }
          break;
        }

        case 'delete': {
          setStatus('正在删除...');
          const toDelete = command.filter?.category
            ? videos.filter(v => v.tname === command.filter!.category).map(v => v.aid)
            : videos.map(v => v.aid);
          if (toDelete.length === 0) {
            setStatus('没有匹配的视频');
            break;
          }
          const defaultFolder = folders[0];
          if (!defaultFolder) {
            setStatus('未找到收藏夹');
            break;
          }
          await api.batchDeleteFavorites(defaultFolder.id, toDelete);
          const remaining = videos.filter(v => !toDelete.includes(v.aid));
          setVideos(remaining);
          await storage.saveBookmarks(remaining);
          setStatus(`已删除 ${toDelete.length} 个视频`);
          break;
        }

        case 'move': {
          setStatus('正在移动...');
          const targetFolder = command.action?.destination;
          if (!targetFolder) {
            setStatus('请指定目标收藏夹');
            break;
          }
          const dest = folders.find(f => f.title.includes(targetFolder));
          if (!dest) {
            setStatus(`未找到收藏夹「${targetFolder}」`);
            break;
          }
          const toMove = command.filter?.category
            ? videos.filter(v => v.tname === command.filter!.category)
            : [];
          if (toMove.length === 0) {
            setStatus('没有匹配的视频');
            break;
          }
          const srcFolder = folders[0];
          if (!srcFolder) {
            setStatus('未找到源收藏夹');
            break;
          }
          await api.batchMoveFavorites(
            toMove.map(v => v.aid),
            srcFolder.id,
            dest.id,
          );
          setStatus(`已移动 ${toMove.length} 个视频到「${dest.title}」`);
          break;
        }

        case 'categorize': {
          setStatus('正在AI分类...');
          const apiKey = await storage.getSetting('apiKey', '');
          const classifier = new AIClassifier(apiKey);
          const results = await classifier.classifyVideos(
            videos.map(v => ({ title: v.title, tags: v.tags, tname: v.tname }))
          );

          const categoryMap: Record<string, BiliVideo[]> = {};
          videos.forEach((v, i) => {
            const cat = results[i].category;
            if (!categoryMap[cat]) categoryMap[cat] = [];
            categoryMap[cat].push(v);
          });

          await storage.saveCategories(
            Object.fromEntries(
              Object.entries(categoryMap).map(([k, vids]) => [k, vids.map(v => v.bvid)])
            )
          );

          const summary = Object.entries(categoryMap)
            .map(([cat, vids]) => `${cat}: ${vids.length}个`)
            .join('、');
          setStatus(`分类完成，${summary}`);
          break;
        }

        case 'unfollow': {
          setStatus('正在取消关注...');
          const inactiveDays = command.filter?.inactiveDays || 90;
          const inactiveUPs = followings.filter(f => {
            if (!f.last_video_date) return true;
            const daysSince = (Date.now() - f.last_video_date * 1000) / (1000 * 60 * 60 * 24);
            return daysSince > inactiveDays;
          });
          if (inactiveUPs.length === 0) {
            setStatus('没有符合条件的UP主');
            break;
          }
          await api.batchUnfollow(inactiveUPs.map(f => f.mid));
          const remaining = followings.filter(f => !inactiveUPs.some(u => u.mid === f.mid));
          setFollowings(remaining);
          await storage.saveFollowings(remaining);
          setStatus(`已取消关注 ${inactiveUPs.length} 个UP主`);
          break;
        }
      }
    } catch (error: any) {
      setStatus(`操作失败: ${error.message || error}`);
    }
    setLoading(false);
  };

  const handleBookmarkAction = async (action: string, videoIds: string[], target?: string) => {
    setLoading(true);
    setStatus(`正在执行 ${action}...`);

    try {
      const userMid = await detectMid();
      if (folders.length === 0) {
        await loadFolders(userMid);
      }

      switch (action) {
        case 'delete': {
          const defaultFolder = folders[0];
          if (!defaultFolder) {
            setStatus('未找到收藏夹');
            break;
          }
          const ids = videoIds.map(Number);
          await api.batchDeleteFavorites(defaultFolder.id, ids);
          const remaining = videos.filter(v => !videoIds.includes(v.bvid));
          setVideos(remaining);
          await storage.saveBookmarks(remaining);
          setStatus(`已删除 ${videoIds.length} 个视频`);
          break;
        }

        case 'move': {
          if (!target) {
            setStatus('请指定目标收藏夹');
            break;
          }
          const dest = folders.find(f => f.title.includes(target));
          if (!dest) {
            setStatus(`未找到收藏夹「${target}」`);
            break;
          }
          const srcFolder = folders[0];
          if (!srcFolder) {
            setStatus('未找到源收藏夹');
            break;
          }
          await api.batchMoveFavorites(
            videoIds.map(Number),
            srcFolder.id,
            dest.id,
          );
          setStatus(`已移动 ${videoIds.length} 个视频到「${dest.title}」`);
          break;
        }

        case 'categorize': {
          const apiKey = await storage.getSetting('apiKey', '');
          const classifier = new AIClassifier(apiKey);
          const selected = videos.filter(v => videoIds.includes(v.bvid));
          const results = await classifier.classifyVideos(
            selected.map(v => ({ title: v.title, tags: v.tags, tname: v.tname }))
          );

          const categoryMap: Record<string, string[]> = {};
          selected.forEach((v, i) => {
            const cat = results[i].category;
            if (!categoryMap[cat]) categoryMap[cat] = [];
            categoryMap[cat].push(v.bvid);
          });

          await storage.saveCategories(categoryMap);
          const summary = Object.entries(categoryMap)
            .map(([cat, vids]) => `${cat}: ${vids.length}个`)
            .join('、');
          setStatus(`分类完成: ${summary}`);
          break;
        }
      }
    } catch (error: any) {
      setStatus(`操作失败: ${error.message || error}`);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setLoading(true);
    setStatus('正在刷新数据...');
    try {
      const userMid = await detectMid();
      await loadFolders(userMid);
      const folderList = folders.length > 0 ? folders : await api.getFavoriteFolders(userMid);
      let allVideos: BiliVideo[] = [];
      for (const folder of folderList) {
        const vids = await api.getFolderVideos(folder.id);
        allVideos = [...allVideos, ...vids];
      }
      await storage.saveBookmarks(allVideos);
      setVideos(allVideos);
      setStatus(`刷新完成，共 ${allVideos.length} 个收藏视频`);
    } catch (error: any) {
      setStatus(`刷新失败: ${error.message || error}`);
    }
    setLoading(false);
  };

  return (
    <div className="popup">
      <header className="popup-header">
        <h1>B站智能管家</h1>
        <nav className="tabs">
          <button
            className={`tab ${activeTab === 'bookmarks' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookmarks')}
          >
            收藏管理
          </button>
          <button
            className={`tab ${activeTab === 'followings' ? 'active' : ''}`}
            onClick={() => setActiveTab('followings')}
          >
            关注管理
          </button>
          <button
            className={`tab ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            数据分析
          </button>
        </nav>
      </header>

      <main className="popup-content">
        <CommandBar onCommand={handleCommand} />

        {status && (
          <div className={`status ${loading ? 'loading' : ''}`}>
            {loading && <span className="spinner">⏳</span>}
            {status}
          </div>
        )}

        <div className="action-bar">
          <button className="btn btn-secondary" onClick={handleRefresh} disabled={loading}>
            刷新数据
          </button>
        </div>

        {activeTab === 'bookmarks' && (
          <BookmarkManager
            videos={videos}
            folders={folders}
            onAction={handleBookmarkAction}
          />
        )}

        {activeTab === 'followings' && (
          <FollowingManager
            followings={followings}
            onUnfollow={async (mids) => {
              setLoading(true);
              try {
                await api.batchUnfollow(mids);
                const remaining = followings.filter(f => !mids.includes(f.mid));
                setFollowings(remaining);
                await storage.saveFollowings(remaining);
                setStatus(`已取消关注 ${mids.length} 个UP主`);
              } catch (error: any) {
                setStatus(`操作失败: ${error.message || error}`);
              }
              setLoading(false);
            }}
          />
        )}

        {activeTab === 'analysis' && (
          <AnalysisPanel videos={videos} followings={followings} />
        )}
      </main>

      <footer className="popup-footer">
        <span className="version">v1.0.0</span>
      </footer>
    </div>
  );
};

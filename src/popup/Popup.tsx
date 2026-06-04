import React, { useState, useEffect } from 'react';
import { CommandBar } from '../components/CommandBar';
import { BookmarkManager } from '../components/BookmarkManager';
import { BilibiliAPI } from '../services/bilibili-api';
import { StorageService } from '../services/storage';
import { UserCommand, BiliVideo } from '../types';

type Tab = 'bookmarks' | 'followings' | 'analysis';

export const Popup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('bookmarks');
  const [videos, setVideos] = useState<BiliVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const api = new BilibiliAPI();
  const storage = new StorageService();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const savedBookmarks = await storage.getBookmarks();
      if (savedBookmarks.length > 0) {
        setVideos(savedBookmarks);
      }
    } catch (error) {
      setStatus('加载数据失败');
    }
    setLoading(false);
  };

  const handleCommand = async (command: UserCommand) => {
    setLoading(true);
    setStatus('正在执行...');

    try {
      switch (command.type) {
        case 'analyze':
          setStatus('正在分析收藏夹...');
          break;
        case 'delete':
          setStatus('正在删除...');
          break;
        case 'move':
          setStatus('正在移动...');
          break;
        case 'categorize':
          setStatus('正在AI分类...');
          break;
        case 'unfollow':
          setStatus('正在取消关注...');
          break;
      }
      setStatus('操作完成');
    } catch (error) {
      setStatus(`操作失败: ${error}`);
    }
    setLoading(false);
  };

  const handleBookmarkAction = async (action: string, videoIds: string[], target?: string) => {
    setLoading(true);
    setStatus(`正在执行 ${action}...`);

    try {
      switch (action) {
        case 'delete':
          await api.batchDeleteFavorites(0, videoIds.map(Number));
          setVideos(videos.filter(v => !videoIds.includes(v.bvid)));
          break;
        case 'move':
          break;
        case 'categorize':
          break;
      }
      setStatus('操作完成');
    } catch (error) {
      setStatus(`操作失败: ${error}`);
    }
    setLoading(false);
  };

  return (
    <div className="popup">
      <header className="popup-header">
        <h1>📺 B站智能管家</h1>
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

        {activeTab === 'bookmarks' && (
          <BookmarkManager
            videos={videos}
            onAction={handleBookmarkAction}
          />
        )}

        {activeTab === 'followings' && (
          <div className="follow-manager">
            <p>关注管理功能开发中...</p>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="analysis-panel">
            <p>数据分析功能开发中...</p>
          </div>
        )}
      </main>

      <footer className="popup-footer">
        <span className="version">v1.0.0</span>
      </footer>
    </div>
  );
};

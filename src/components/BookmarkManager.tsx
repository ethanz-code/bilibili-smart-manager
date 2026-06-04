import React, { useState, useMemo } from 'react';
import { BiliVideo } from '../types';

interface BookmarkManagerProps {
  videos: BiliVideo[];
  onAction: (action: string, videoIds: string[], target?: string) => void;
}

export const BookmarkManager: React.FC<BookmarkManagerProps> = ({ videos, onAction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'date' | 'views' | 'title'>('date');

  const categories = useMemo(() => {
    const cats = new Set(videos.map(v => v.tname || '其他'));
    return Array.from(cats).sort();
  }, [videos]);

  const filteredVideos = useMemo(() => {
    let result = videos;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(v =>
        v.title.toLowerCase().includes(term) ||
        v.owner.name.toLowerCase().includes(term)
      );
    }

    if (selectedCategory) {
      result = result.filter(v => (v.tname || '其他') === selectedCategory);
    }

    switch (sortBy) {
      case 'date':
        result = [...result].sort((a, b) => b.pubdate - a.pubdate);
        break;
      case 'views':
        result = [...result].sort((a, b) => b.stat.view - a.stat.view);
        break;
      case 'title':
        result = [...result].sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [videos, searchTerm, selectedCategory, sortBy]);

  const toggleSelect = (bvid: string) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(bvid)) {
      newSelected.delete(bvid);
    } else {
      newSelected.add(bvid);
    }
    setSelectedVideos(newSelected);
  };

  const selectAll = () => {
    if (selectedVideos.size === filteredVideos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(filteredVideos.map(v => v.bvid)));
    }
  };

  const handleBatchAction = (action: string) => {
    if (selectedVideos.size === 0) return;
    onAction(action, Array.from(selectedVideos), selectedCategory || undefined);
    setSelectedVideos(new Set());
  };

  return (
    <div className="bookmark-manager">
      <div className="toolbar">
        <input
          type="text"
          placeholder="搜索收藏"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="sort-select"
        >
          <option value="date">按时间</option>
          <option value="views">按播放量</option>
          <option value="title">按标题</option>
        </select>
      </div>

      <div className="categories">
        <button
          className={`category-btn ${!selectedCategory ? 'active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          全部 ({videos.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat} ({videos.filter(v => (v.tname || '其他') === cat).length})
          </button>
        ))}
      </div>

      <div className="batch-actions">
        <label className="select-all">
          <input
            type="checkbox"
            checked={selectedVideos.size === filteredVideos.length && filteredVideos.length > 0}
            onChange={selectAll}
          />
          全选
        </label>
        <span className="selected-count">
          已选择 {selectedVideos.size} 个
        </span>
        <button
          className="btn btn-danger"
          disabled={selectedVideos.size === 0}
          onClick={() => handleBatchAction('delete')}
        >
          批量删除
        </button>
        <button
          className="btn btn-primary"
          disabled={selectedVideos.size === 0}
          onClick={() => handleBatchAction('move')}
        >
          批量移动
        </button>
        <button
          className="btn btn-secondary"
          disabled={selectedVideos.size === 0}
          onClick={() => handleBatchAction('categorize')}
        >
          AI分类
        </button>
      </div>

      <div className="video-list">
        {filteredVideos.map(video => (
          <div
            key={video.bvid}
            className={`video-item ${selectedVideos.has(video.bvid) ? 'selected' : ''}`}
          >
            <input
              type="checkbox"
              checked={selectedVideos.has(video.bvid)}
              onChange={() => toggleSelect(video.bvid)}
            />
            <img src={video.pic} alt={video.title} className="video-cover" />
            <div className="video-info">
              <h3 className="video-title">{video.title}</h3>
              <div className="video-meta">
                <span className="up主">{video.owner.name}</span>
                <span className="category">{video.tname || '其他'}</span>
                <span className="views">{video.stat.view.toLocaleString()} 播放</span>
                <span className="date">
                  {new Date(video.pubdate * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <div className="empty-state">
          <p>没有找到匹配的收藏视频</p>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { BiliFollowing } from '../types';

interface FollowingManagerProps {
  followings: BiliFollowing[];
  onUnfollow: (mids: number[]) => void;
}

export const FollowingManager: React.FC<FollowingManagerProps> = ({ followings, onUnfollow }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFollowings, setSelectedFollowings] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'fans' | 'attention'>('name');
  const [filterMode, setFilterMode] = useState<'all' | 'inactive' | 'low-fan'>('all');

  const filteredFollowings = useMemo(() => {
    let result = followings;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(f =>
        f.uname.toLowerCase().includes(term) ||
        f.sign.toLowerCase().includes(term)
      );
    }

    if (filterMode === 'inactive') {
      result = result.filter(f => {
        if (!f.last_video_date) return true;
        const daysSince = (Date.now() - f.last_video_date * 1000) / (1000 * 60 * 60 * 24);
        return daysSince > 90;
      });
    } else if (filterMode === 'low-fan') {
      result = result.filter(f => f.fans < 1000);
    }

    switch (sortBy) {
      case 'name':
        result = [...result].sort((a, b) => a.uname.localeCompare(b.uname));
        break;
      case 'fans':
        result = [...result].sort((a, b) => b.fans - a.fans);
        break;
      case 'attention':
        result = [...result].sort((a, b) => b.attention - a.attention);
        break;
    }

    return result;
  }, [followings, searchTerm, sortBy, filterMode]);

  const toggleSelect = (mid: number) => {
    const newSelected = new Set(selectedFollowings);
    if (newSelected.has(mid)) {
      newSelected.delete(mid);
    } else {
      newSelected.add(mid);
    }
    setSelectedFollowings(newSelected);
  };

  const selectAll = () => {
    if (selectedFollowings.size === filteredFollowings.length) {
      setSelectedFollowings(new Set());
    } else {
      setSelectedFollowings(new Set(filteredFollowings.map(f => f.mid)));
    }
  };

  const handleBatchUnfollow = () => {
    if (selectedFollowings.size === 0) return;
    onUnfollow(Array.from(selectedFollowings));
    setSelectedFollowings(new Set());
  };

  const inactiveCount = useMemo(() => {
    return followings.filter(f => {
      if (!f.last_video_date) return true;
      const daysSince = (Date.now() - f.last_video_date * 1000) / (1000 * 60 * 60 * 24);
      return daysSince > 90;
    }).length;
  }, [followings]);

  return (
    <div className="following-manager">
      <div className="following-header">
        <h2>关注管理</h2>
        <p className="following-stats">
          共关注 {followings.length} 个UP主
          {inactiveCount > 0 && <span className="inactive-badge"> · {inactiveCount} 个可能已停更</span>}
        </p>
      </div>

      <div className="toolbar">
        <input
          type="text"
          placeholder="搜索UP主"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="sort-select"
        >
          <option value="name">按名称</option>
          <option value="fans">按粉丝数</option>
          <option value="attention">按关注度</option>
        </select>
      </div>

      <div className="filter-tabs">
        <button
          className={`filter-btn ${filterMode === 'all' ? 'active' : ''}`}
          onClick={() => setFilterMode('all')}
        >
          全部 ({followings.length})
        </button>
        <button
          className={`filter-btn ${filterMode === 'inactive' ? 'active' : ''}`}
          onClick={() => setFilterMode('inactive')}
        >
          可能停更 ({inactiveCount})
        </button>
        <button
          className={`filter-btn ${filterMode === 'low-fan' ? 'active' : ''}`}
          onClick={() => setFilterMode('low-fan')}
        >
          低粉丝
        </button>
      </div>

      <div className="batch-actions">
        <label className="select-all">
          <input
            type="checkbox"
            checked={selectedFollowings.size === filteredFollowings.length && filteredFollowings.length > 0}
            onChange={selectAll}
          />
          全选
        </label>
        <span className="selected-count">
          已选择 {selectedFollowings.size} 个
        </span>
        <button
          className="btn btn-danger"
          disabled={selectedFollowings.size === 0}
          onClick={handleBatchUnfollow}
        >
          批量取消关注
        </button>
      </div>

      <div className="following-list">
        {filteredFollowings.map(following => (
          <div
            key={following.mid}
            className={`following-item ${selectedFollowings.has(following.mid) ? 'selected' : ''}`}
          >
            <input
              type="checkbox"
              checked={selectedFollowings.has(following.mid)}
              onChange={() => toggleSelect(following.mid)}
            />
            <img src={following.face} alt={following.uname} className="following-avatar" />
            <div className="following-info">
              <h3 className="following-name">{following.uname}</h3>
              <p className="following-sign">{following.sign || '暂无简介'}</p>
              <div className="following-meta">
                <span className="fans">{following.fans.toLocaleString()} 粉丝</span>
                {following.last_video_date && (
                  <span className="last-active">
                    最后更新: {new Date(following.last_video_date * 1000).toLocaleDateString()}
                  </span>
                )}
                {following.category && (
                  <span className="category-tag">{following.category}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredFollowings.length === 0 && (
        <div className="empty-state">
          <p>{followings.length === 0 ? '暂无关注数据，请先在「收藏管理」页刷新数据' : '没有匹配的UP主'}</p>
        </div>
      )}
    </div>
  );
};

import React, { useMemo } from 'react';
import { BiliVideo, BiliFollowing } from '../types';

interface AnalysisPanelProps {
  videos: BiliVideo[];
  followings: BiliFollowing[];
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ videos, followings }) => {
  const stats = useMemo(() => {
    if (videos.length === 0 && followings.length === 0) return null;

    const byCategory: Record<string, number> = {};
    const byUP: Record<string, number> = {};
    let totalViews = 0;

    for (const v of videos) {
      const cat = v.tname || '其他';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
      byUP[v.owner.name] = (byUP[v.owner.name] || 0) + 1;
      totalViews += v.stat.view;
    }

    const topCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const topUPs = Object.entries(byUP)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const inactiveFollowings = followings.filter(f => {
      if (!f.last_video_date) return true;
      const daysSince = (Date.now() - f.last_video_date * 1000) / (1000 * 60 * 60 * 24);
      return daysSince > 90;
    });

    const followingByCategory: Record<string, number> = {};
    for (const f of followings) {
      const cat = f.category || '其他';
      followingByCategory[cat] = (followingByCategory[cat] || 0) + 1;
    }

    return {
      totalBookmarks: videos.length,
      totalFollowings: followings.length,
      totalViews,
      topCategories,
      topUPs,
      inactiveCount: inactiveFollowings.length,
      followingByCategory,
    };
  }, [videos, followings]);

  if (!stats) {
    return (
      <div className="analysis-panel">
        <div className="empty-state">
          <p>暂无数据，请先在「收藏管理」页点击「刷新数据」加载收藏</p>
        </div>
      </div>
    );
  }

  const maxCategoryCount = Math.max(...stats.topCategories.map(([, c]) => c), 1);
  const maxUPCount = Math.max(...stats.topUPs.map(([, c]) => c), 1);

  return (
    <div className="analysis-panel">
      <h2>数据分析</h2>

      <div className="stat-overview">
        <div className="stat-box">
          <div className="stat-number">{stats.totalBookmarks}</div>
          <div className="stat-label">收藏视频</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{stats.totalFollowings}</div>
          <div className="stat-label">关注UP主</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{(stats.totalViews / 10000).toFixed(1)}万</div>
          <div className="stat-label">总播放量</div>
        </div>
        <div className="stat-box warning">
          <div className="stat-number">{stats.inactiveCount}</div>
          <div className="stat-label">可能停更</div>
        </div>
      </div>

      <div className="chart-section">
        <h3>收藏分类分布</h3>
        <div className="bar-chart">
          {stats.topCategories.map(([name, count]) => (
            <div key={name} className="bar-row">
              <span className="bar-label">{name}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                />
              </div>
              <span className="bar-value">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="chart-section">
        <h3>收藏最多的UP主</h3>
        <div className="bar-chart">
          {stats.topUPs.map(([name, count]) => (
            <div key={name} className="bar-row">
              <span className="bar-label">{name}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(count / maxUPCount) * 100}%` }}
                />
              </div>
              <span className="bar-value">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {followings.length > 0 && (
        <div className="chart-section">
          <h3>关注UP主分布</h3>
          <div className="bar-chart">
            {Object.entries(stats.followingByCategory)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([name, count]) => (
                <div key={name} className="bar-row">
                  <span className="bar-label">{name}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill secondary"
                      style={{ width: `${(count / Math.max(...Object.values(stats.followingByCategory))) * 100}%` }}
                    />
                  </div>
                  <span className="bar-value">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

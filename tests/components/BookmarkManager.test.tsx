import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BookmarkManager } from '../../src/components/BookmarkManager';

describe('BookmarkManager', () => {
  const mockVideos = [
    { bvid: 'BV1', title: '游戏攻略', tname: '游戏', owner: { name: 'UP主A', mid: 1, face: '' }, stat: { view: 1000, danmaku: 10, reply: 5, favorite: 20, coin: 15, share: 3, like: 50 }, pubdate: Date.now() / 1000, description: '', pic: '', aid: 1, tid: 17, tags: ['游戏'], duration: 300 },
    { bvid: 'BV2', title: '美食教程', tname: '美食', owner: { name: 'UP主B', mid: 2, face: '' }, stat: { view: 500, danmaku: 5, reply: 2, favorite: 10, coin: 8, share: 1, like: 30 }, pubdate: Date.now() / 1000, description: '', pic: '', aid: 2, tid: 21, tags: ['美食'], duration: 600 },
  ];

  test('should render video list', () => {
    render(<BookmarkManager videos={mockVideos} onAction={jest.fn()} />);
    expect(screen.getByText('游戏攻略')).toBeInTheDocument();
    expect(screen.getByText('美食教程')).toBeInTheDocument();
  });

  test('should filter by category', () => {
    render(<BookmarkManager videos={mockVideos} onAction={jest.fn()} />);
    const gameBtn = screen.getByRole('button', { name: /游戏/ });
    fireEvent.click(gameBtn);
    expect(screen.getByText('游戏攻略')).toBeInTheDocument();
  });

  test('should select videos for batch operation', () => {
    const onAction = jest.fn();
    render(<BookmarkManager videos={mockVideos} onAction={onAction} />);

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // Select first video
    const deleteBtn = screen.getByText('批量删除');
    fireEvent.click(deleteBtn);

    expect(onAction).toHaveBeenCalledWith('delete', expect.arrayContaining(['BV1']), undefined);
  });

  test('should search by keyword', () => {
    render(<BookmarkManager videos={mockVideos} onAction={jest.fn()} />);
    const searchInput = screen.getByPlaceholderText('搜索收藏');
    fireEvent.change(searchInput, { target: { value: '游戏' } });
    expect(screen.getByText('游戏攻略')).toBeInTheDocument();
    expect(screen.queryByText('美食教程')).not.toBeInTheDocument();
  });
});

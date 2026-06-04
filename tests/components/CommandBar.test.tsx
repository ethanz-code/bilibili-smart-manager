import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CommandBar } from '../../src/components/CommandBar';

describe('CommandBar', () => {
  test('should render input field', () => {
    render(<CommandBar onCommand={jest.fn()} />);
    expect(screen.getByPlaceholderText(/输入指令/)).toBeInTheDocument();
  });

  test('should show suggestions when typing', async () => {
    render(<CommandBar onCommand={jest.fn()} />);
    const input = screen.getByPlaceholderText(/输入指令/);
    fireEvent.change(input, { target: { value: '删除' } });

    await waitFor(() => {
      expect(screen.getByText(/删除所有失效视频/)).toBeInTheDocument();
    });
  });

  test('should call onCommand when submitted', () => {
    const onCommand = jest.fn();
    render(<CommandBar onCommand={onCommand} />);

    const input = screen.getByPlaceholderText(/输入指令/);
    fireEvent.change(input, { target: { value: '分析我的收藏夹' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onCommand).toHaveBeenCalledWith(expect.objectContaining({
      type: 'analyze',
      target: 'bookmarks'
    }));
  });

  test('should show error for invalid command', async () => {
    render(<CommandBar onCommand={jest.fn()} />);
    const input = screen.getByPlaceholderText(/输入指令/);
    fireEvent.change(input, { target: { value: '今天天气怎么样' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/无法理解/)).toBeInTheDocument();
    });
  });
});

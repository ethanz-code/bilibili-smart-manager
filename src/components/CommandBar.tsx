import React, { useState, useRef, useEffect } from 'react';
import { CommandParser } from '../services/command-parser';
import { UserCommand } from '../types';

interface CommandBarProps {
  onCommand: (command: UserCommand) => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({ onCommand }) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const parser = useRef(new CommandParser());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (input.length > 0) {
      const newSuggestions = parser.current.getSuggestions(input);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setError(null);
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim()) return;

    const command = parser.current.parse(input);
    if (command) {
      onCommand(command);
      setInput('');
      setShowSuggestions(false);
    } else {
      setError('无法理解该指令，请尝试其他表达方式');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="command-bar">
      <div className="input-wrapper">
        <span className="command-icon">⚡</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入指令，如：把游戏视频移到游戏收藏夹"
          className="command-input"
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        <button type="button" className="submit-btn" disabled={!input.trim()} onClick={handleSubmit}>
          执行
        </button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {showSuggestions && (
        <div className="suggestions">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}

      <div className="command-examples">
        <span className="example-label">示例：</span>
        <button className="example-btn" onClick={() => setInput('把游戏视频移到游戏收藏夹')}>
          分类收藏
        </button>
        <button className="example-btn" onClick={() => setInput('删除所有失效视频')}>
          清理失效
        </button>
        <button className="example-btn" onClick={() => setInput('取消关注3个月没更新的UP主')}>
          清理关注
        </button>
        <button className="example-btn" onClick={() => setInput('分析我的收藏夹')}>
          数据分析
        </button>
      </div>
    </div>
  );
};

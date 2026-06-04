import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';

export const Options: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [autoClassify, setAutoClassify] = useState(true);
  const [batchDelay, setBatchDelay] = useState(100);
  const [status, setStatus] = useState<string | null>(null);

  const storage = new StorageService();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const savedApiKey = await storage.getSetting('apiKey', '');
    const savedAutoClassify = await storage.getSetting('autoClassify', true);
    const savedBatchDelay = await storage.getSetting('batchDelay', 100);

    setApiKey(savedApiKey);
    setAutoClassify(savedAutoClassify);
    setBatchDelay(savedBatchDelay);
  };

  const saveSettings = async () => {
    await storage.saveSetting('apiKey', apiKey);
    await storage.saveSetting('autoClassify', autoClassify);
    await storage.saveSetting('batchDelay', batchDelay);
    setStatus('设置已保存');
    setTimeout(() => setStatus(null), 2000);
  };

  const exportData = async () => {
    const data = await storage.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bili-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      await storage.importData(text);
      setStatus('数据导入成功');
    } catch {
      setStatus('数据导入失败，请检查文件格式');
    }
  };

  const clearData = async () => {
    if (confirm('确定要清除所有数据吗？此操作不可恢复。')) {
      await storage.clearAll();
      setStatus('数据已清除');
    }
  };

  return (
    <div className="options">
      <h1>B站智能管家 - 设置</h1>

      <section className="settings-section">
        <h2>AI 分类设置</h2>
        <div className="setting-item">
          <label>
            OpenAI API Key（用于智能分类）
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
          </label>
          <p className="hint">用于AI增强分类，不填则使用规则分类</p>
        </div>

        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={autoClassify}
              onChange={(e) => setAutoClassify(e.target.checked)}
            />
            收藏时自动分类
          </label>
        </div>
      </section>

      <section className="settings-section">
        <h2>批量操作设置</h2>
        <div className="setting-item">
          <label>
            批量操作间隔（毫秒）
            <input
              type="number"
              value={batchDelay}
              onChange={(e) => setBatchDelay(Number(e.target.value))}
              min={50}
              max={1000}
            />
          </label>
          <p className="hint">避免请求过快被B站限制，建议100-200ms</p>
        </div>
      </section>

      <section className="settings-section">
        <h2>数据管理</h2>
        <div className="data-actions">
          <button className="btn btn-primary" onClick={exportData}>
            导出数据
          </button>
          <label className="btn btn-secondary">
            导入数据
            <input
              type="file"
              accept=".json"
              onChange={importData}
              style={{ display: 'none' }}
            />
          </label>
          <button className="btn btn-danger" onClick={clearData}>
            清除所有数据
          </button>
        </div>
      </section>

      {status && (
        <div className="status-message">{status}</div>
      )}

      <button className="btn btn-primary save-btn" onClick={saveSettings}>
        保存设置
      </button>
    </div>
  );
};

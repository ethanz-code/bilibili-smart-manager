// Content Script - 注入到B站页面
console.log('B站智能管家已加载');

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SHOW_PANEL') {
    togglePanel();
  }
});

// 创建浮动面板
function createPanel(): HTMLElement {
  const panel = document.createElement('div');
  panel.id = 'bili-smart-panel';
  panel.innerHTML = `
    <div style="
      position: fixed;
      top: 80px;
      right: 20px;
      width: 320px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.15);
      z-index: 99999;
      font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
      overflow: hidden;
      display: none;
    " id="bili-panel-content">
      <div style="
        background: linear-gradient(135deg, #00A1D6, #0088CC);
        color: white;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <span style="font-weight: 600; font-size: 14px;">B站智能管家</span>
        <button id="bili-panel-close" style="
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 18px;
          padding: 0 4px;
        ">✕</button>
      </div>
      <div style="padding: 16px;">
        <div id="bili-panel-info" style="font-size: 13px; color: #666; line-height: 1.6;">
          正在加载...
        </div>
        <div style="margin-top: 12px; display: flex; gap: 8px;">
          <button id="bili-btn-classify" style="
            flex: 1;
            padding: 8px;
            background: #00A1D6;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
          ">AI分类当前页</button>
          <button id="bili-btn-save" style="
            flex: 1;
            padding: 8px;
            background: #f0f0f0;
            color: #333;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
          ">收藏当前视频</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  // 绑定事件
  document.getElementById('bili-panel-close')?.addEventListener('click', () => {
    const content = document.getElementById('bili-panel-content');
    if (content) content.style.display = 'none';
  });

  document.getElementById('bili-btn-classify')?.addEventListener('click', () => {
    const videoInfo = getCurrentVideoInfo();
    if (videoInfo) {
      chrome.runtime.sendMessage({
        type: 'CLASSIFY_VIDEO',
        data: videoInfo,
      });
    }
  });

  document.getElementById('bili-btn-save')?.addEventListener('click', () => {
    const videoInfo = getCurrentVideoInfo();
    if (videoInfo) {
      chrome.runtime.sendMessage({
        type: 'SAVE_VIDEO',
        data: videoInfo,
      });
      const info = document.getElementById('bili-panel-info');
      if (info) info.textContent = '已保存到收藏夹！';
    }
  });

  return panel;
}

function togglePanel() {
  let panel = document.getElementById('bili-smart-panel');
  if (!panel) {
    panel = createPanel();
  }

  const content = document.getElementById('bili-panel-content');
  if (content) {
    const isVisible = content.style.display !== 'none';
    content.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
      updatePanelInfo();
    }
  }
}

function getCurrentVideoInfo() {
  const title = document.querySelector('.video-title, h1')?.textContent?.trim();
  const bvid = window.location.pathname.match(/\/video\/(BV\w+)/)?.[1];

  if (!title || !bvid) return null;

  return { title, bvid, url: window.location.href };
}

function updatePanelInfo() {
  const info = document.getElementById('bili-panel-info');
  if (!info) return;

  const videoInfo = getCurrentVideoInfo();
  if (videoInfo) {
    info.innerHTML = `
      <div style="margin-bottom: 8px;">
        <strong>当前视频：</strong><br/>
        <span style="color: #333;">${videoInfo.title}</span>
      </div>
      <div style="font-size: 11px; color: #999;">BV号: ${videoInfo.bvid}</div>
    `;
  } else {
    info.textContent = '请在B站视频页面使用功能';
  }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createPanel);
} else {
  createPanel();
}

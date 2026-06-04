// Service Worker - Background script
chrome.runtime.onInstalled.addListener(() => {
  console.log('B站智能管家已安装');
});

// 消息传递处理
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_TAB_INFO') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ tab: tabs[0] });
    });
    return true;
  }

  if (message.type === 'INJECT_CONTENT') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'SHOW_PANEL' });
        sendResponse({ success: true });
      }
    });
    return true;
  }

  if (message.type === 'FETCH_DATA') {
    fetch(message.url, {
      credentials: 'include',
      headers: { 'Referer': 'https://www.bilibili.com' },
    })
      .then(res => res.json())
      .then(data => sendResponse({ data }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

// 定时同步收藏数据
chrome.alarms.create('syncBookmarks', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'syncBookmarks') {
    console.log('定时同步收藏数据...');
  }
});

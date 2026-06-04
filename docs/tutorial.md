# B站智能管家 — 开发思路教程

## 一、为什么做这个项目

B站 3.4 亿月活用户，收藏夹功能很基础 — 不能搜索、不能批量操作、不能智能分类。
当你的收藏超过 200 个，基本就变成了"再也不看"的坟场。

这个插件解决的核心问题：
- 收藏太多找不到
- 关注太杂没法管
- 想批量操作但平台不支持

---

## 二、技术选型的思考

### 为什么是 Chrome Extension 而不是 Web App？

```
方案A: Web App + 后端
  用户需要登录 → 提供B站cookie → 安全风险大 → 放弃

方案B: 油猴脚本
  太零散 → 没有UI框架 → 难以维护 → 放弃

方案C: Chrome Extension ✅
  浏览器内运行 → 自动获取登录态 → 有完整UI能力 → 可以上架商店
```

**关键原因：B站 API 需要 cookie 鉴权。** 浏览器插件天然运行在用户的 B站会话里，`fetch` 请求自动带上 cookie，零配置。

### 为什么是 React + TypeScript + Vite？

| 技术 | 理由 |
|------|------|
| React 18 | 组件化开发，Popup/Options/Content 三个独立 UI |
| TypeScript | 类型安全，B站 API 返回数据结构复杂，需要类型推导 |
| Vite | 构建速度快，HMR 开发体验好 |
| Tailwind CSS | 快速写样式，但实际用了自定义 CSS 变量系统 |

### 为什么用 IndexedDB 做本地存储？

```
chrome.storage.local → 有容量限制（5MB），不适合存大量视频数据
localStorage → 同步API，大容量时卡顿
IndexedDB ✅ → 异步、大容量、支持索引查询
```

---

## 三、项目架构

```
bilibili-smart-manager/
├── src/
│   ├── manifest.json          ← Chrome Extension 的"身份证"
│   │
│   ├── popup/                 ← 点击插件图标弹出的窗口
│   │   ├── Popup.tsx          ← 主界面（3个Tab：收藏/关注/分析）
│   │   └── popup.html
│   │
│   ├── options/               ← 右键插件 → 选项 → 设置页
│   │   └── Options.tsx        ← API Key、批量延迟、数据导入导出
│   │
│   ├── background/
│   │   └── service-worker.ts  ← 后台服务（消息传递、定时任务）
│   │
│   ├── content/
│   │   └── content-script.ts  ← 注入到B站页面的脚本（浮动面板）
│   │
│   ├── services/              ← 核心业务逻辑（纯函数，不依赖UI）
│   │   ├── bilibili-api.ts    ← B站 API 封装
│   │   ├── ai-classifier.ts   ← AI 分类引擎
│   │   ├── command-parser.ts  ← 自然语言命令解析
│   │   └── storage.ts         ← IndexedDB 存储
│   │
│   └── components/            ← UI 组件
│       ├── CommandBar.tsx      ← 命令输入框
│       ├── BookmarkManager.tsx ← 收藏列表管理
│       ├── FollowingManager.tsx← 关注列表管理
│       └── AnalysisPanel.tsx   ← 数据分析面板
```

---

## 四、核心流程

### 4.1 数据流

```
用户操作 → B站API获取数据 → 存入IndexedDB → UI展示
          ↑                                    ↓
          └──── AI分类/批量操作 ← 用户指令 ←──┘
```

### 4.2 命令执行流程

用户输入：`把所有游戏视频移到游戏收藏夹`

```
1. CommandParser.parse() 解析命令
   → { type: 'move', filter: { category: '游戏' }, action: { destination: '游戏收藏夹' } }

2. detectMid() 获取用户ID
   → 调 /x/web-interface/nav 接口

3. loadFolders() 获取收藏夹列表
   → 找到目标收藏夹

4. 筛选匹配的视频
   → videos.filter(v => v.tname === '游戏')

5. 调用 batchMoveFavorites()
   → 逐个调 /x/v3/fav/resource/move-add 接口
```

### 4.3 AI 分类流程

```
视频标题+标签+分区
    ↓
规则分类（快，零成本）
    ↓
置信度 >= 0.7? → 直接返回结果
    ↓ 不够
调用 OpenAI gpt-4o-mini（慢，有成本）
    ↓
返回 { category, confidence, tags }
    ↓
回退到规则分类（API失败时）
```

**为什么先规则后LLM？**
- 规则分类零成本、毫秒级响应
- 80% 的视频靠规则就能分对
- 只有模糊的才调 LLM，省 API 费用

---

## 五、关键代码解析

### 5.1 B站 API 调用

```typescript
// bilibili-api.ts
private async request<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${this.baseUrl}${endpoint}`);
  // ...
  const response = await fetch(url.toString(), {
    credentials: 'include',  // ← 关键：自动带上B站登录cookie
    headers: { 'Referer': 'https://www.bilibili.com' },
  });
  // ...
}
```

`credentials: 'include'` 是整个项目的基石 — 不需要用户手动登录。

### 5.2 自然语言命令解析

```typescript
// command-parser.ts
this.patterns.push({
  regex: /把(.+?)(?:视频|内容)?移动?到(.+)$/,
  handler: (match) => ({
    type: 'move',
    filter: { category: this.normalizeCategory(match[1]) },
    action: { destination: match[2].trim() }
  })
});
```

用正则匹配中文命令，简单但够用。如果要做更智能的解析，可以接入 LLM 做意图识别。

### 5.3 AI 分类（接入 OpenAI）

```typescript
// ai-classifier.ts
const prompt = `你是一个B站视频分类助手。请将以下视频信息分类到最合适的一个类别中。
可选类别：${this.categories.join('、')}
视频信息：${text}
请严格按JSON格式返回：{"category": "类别名", "confidence": 0.0到1}`;

const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${this.apiKey}` },
  body: JSON.stringify({ model: 'gpt-4o-mini', messages: [...] }),
});
```

### 5.4 Content Script 浮动面板

```typescript
// content-script.ts
const panel = document.createElement('div');
panel.innerHTML = `<div style="position: fixed; top: 80px; right: 20px; ...">`;
document.body.appendChild(panel);
```

用原生 DOM 操作注入 UI，不依赖 React（Content Script 环境简单，不需要框架）。

---

## 六、构建与发布

### 构建

```bash
npm run build
# 输出到 dist/ 目录
```

Vite + `vite-plugin-web-extension` 自动处理多入口构建：
- popup.html + popup.js
- options.html + options.js
- service-worker.js
- content-script.js

### 本地测试

1. 打开 `chrome://extensions`
2. 开启"开发者模式"
3. 点"加载已解压的扩展程序"
4. 选择 `dist/` 目录

### 发布到 Chrome Web Store

1. 注册开发者账号（$5 一次性费用）
2. 打包 `dist/` 为 zip
3. 上传到 Chrome Web Store Developer Dashboard
4. 填写描述、截图、隐私政策
5. 等待审核（通常 1-3 天）

---

## 七、后续可扩展方向

| 方向 | 实现方式 |
|------|----------|
| 增强 AI 分类 | 用 Embedding 向量相似度聚类，而非逐条分类 |
| 云端同步 | 加后端（Supabase/Firebase），多设备同步 |
| 移动端适配 | 做 PWA 版本，或者开发 Firefox Android 插件 |
| 社区功能 | 用户分享分类方案，一键导入 |
| 更多平台 | YouTube、抖音收藏管理 |

---

## 八、踩过的坑

1. **Vite 构建 Chrome Extension** — 默认 Vite 不支持多入口（popup/service-worker/content-script），需要专门的插件
2. **B站 API 跨域** — 插件的 `host_permissions` 可以绕过 CORS，但需要在 manifest 里声明
3. **IndexedDB 测试** — jsdom 不支持 IndexedDB，需要用 `fake-indexeddb` mock
4. **Content Script 样式隔离** — 注入的 UI 会被宿主页面样式污染，最好用 Shadow DOM 隔离
5. **API 限流** — B站批量操作需要加延迟（100-200ms/次），否则会被限制

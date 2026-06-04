# B站智能管家 (bilibili-smart-manager)

智能整理B站收藏夹和关注列表，支持AI分类和批量操作的 Chrome Extension。

## 功能

- **智能收藏管理** - 搜索、筛选、批量删除/移动/分类
- **关注管理** - 搜索、僵尸关注检测、批量取消关注
- **数据分析** - 收藏分布、UP主排行、统计概览
- **AI分类** - 规则分类 + OpenAI gpt-4o-mini 增强
- **自然语言指令** - 中文命令操作收藏夹

## 技术栈

- Chrome Extension Manifest V3
- React 18 + TypeScript
- Vite + vite-plugin-web-extension
- IndexedDB 本地存储
- OpenAI API (可选)

## 开发

```bash
npm install
npm run dev    # 开发模式
npm run build  # 构建
npm test       # 测试
```

## 加载到 Chrome

1. `npm run build`
2. 打开 `chrome://extensions`
3. 开启开发者模式
4. 加载已解压的扩展程序 → 选择 `dist/` 目录

## 使用示例

在插件输入框中输入自然语言指令：

- `把游戏视频移到游戏收藏夹`
- `删除所有失效视频`
- `取消关注3个月没更新的UP主`
- `分析我的收藏夹`

## 项目结构

```
src/
├── manifest.json          ← Chrome Extension 配置
├── popup/                 ← 弹出窗口 (3个Tab)
├── options/               ← 设置页
├── services/              ← 核心业务逻辑
│   ├── bilibili-api.ts    ← B站 API 封装
│   ├── ai-classifier.ts   ← AI 分类引擎
│   ├── command-parser.ts  ← 自然语言命令解析
│   └── storage.ts         ← IndexedDB 存储
├── components/            ← UI 组件
├── background/            ← Service Worker
├── content/               ← 注入B站页面的脚本
└── styles/                ← 草料风格设计系统
```

## License

MIT

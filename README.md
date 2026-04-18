# Quiet Editor — 官网介绍与下载页

Quiet Editor 的**静态官网**：产品介绍、与 Notion / Obsidian 的对比、界面示意，以及**按访客操作系统自动匹配**的下载入口。视觉与主程序一致（Sage & Vellum 色系与字体）。

本仓库**无运行时依赖**，构建脚本仅用 Node 内置 API，将 `index.html`、`styles.css` 与 `assets/` 复制到 `dist/`，适合 **Cloudflare Pages**、任意静态托管或对象存储 + CDN。

---

## 环境要求

- **Node.js** 18+（仅用于执行 `npm run build` / `scripts/build.mjs`）

---

## 构建与预览

```bash
npm install   # 可选；无 dependencies 时也可跳过
npm run build
npm run preview   # 默认 http://localhost:8788 ，需联网拉取 npx serve
```

构建产物在 **`dist/`**，部署时只发布该目录内容即可。

---

## Cloudflare Pages 配置

| 项 | 值 |
|----|-----|
| 构建命令 | `npm run build` |
| 输出目录 | `dist` |
| 根目录 | 若 Monorepo 且本页在子目录，填 **`quiet-editor-page`** |

连接 Git 仓库后保存即可触发自动构建。无需 `wrangler.toml`（除非你在本地用 Wrangler 管理项目）。

---

## 安装包：放置位置与固定文件名

将所有可下载安装包放在：

**`assets/downloads/`**

文件名必须与下表**逐字一致**（区分大小写）。构建后会出现在 **`dist/assets/downloads/`**，页面上的链接与此路径一一对应。

| 平台 | 文件名 |
|------|--------|
| Windows x64 | `QuietEditor-Windows-x64.7z`（7z，解压后使用） |
| macOS（Apple 芯片） | `QuietEditor-macOS-arm64.tar.gz` |
| macOS（Intel） | `QuietEditor-macOS-x64.tar.gz` |
| Linux x86_64（Debian/Ubuntu 等） | `QuietEditor-Linux-x86_64.deb` |
| Linux x86_64（Fedora/RHEL/openSUSE 等） | `QuietEditor-Linux-x86_64.rpm` |
| Android arm64 | `QuietEditor-Android-arm64.7z`（7z，解压后安装 APK） |

同目录下另有 **`放置安装包说明.txt`**，可与上表对照使用。

### 若需改名或增减包

1. 修改 **`assets/site.js`** 顶部 `FILES` 对象中的字符串。  
2. 同步修改 **`index.html`** 中「下载安装包」区块里各 `<a href="./assets/downloads/...">` 与说明文字。  
3. 若调整 Linux 默认包（DEB / RPM），可编辑 **`assets/site.js`** 中的 `linuxPrefersRpm()` 正则，以匹配你目标用户的发行版 UA。

---

## 默认下载按钮（系统识别逻辑）

**`assets/site.js`** 在页面加载后根据浏览器环境设置：

- 顶部导航 **「下载应用」**  
- 首屏主按钮的链接与文案提示（`#js-dl-hint`）

大致规则：

| 检测 | 默认下载文件 |
|------|----------------|
| Windows | `QuietEditor-Windows-x64.7z` |
| macOS + Intel（UA 含 `Intel Mac OS X`） | `QuietEditor-macOS-x64.tar.gz` |
| 其他 macOS | 优先 Apple 芯片包；必要时结合 `userAgentData` / UA 中的 arm 信息 |
| Linux + UA 匹配 Fedora/RHEL/openSUSE 等 | `QuietEditor-Linux-x86_64.rpm` |
| 其他 Linux | `QuietEditor-Linux-x86_64.deb` |
| Android | `QuietEditor-Android-arm64.7z` |
| iOS | 跳转 **`#download-ios`**；页面展示为「暂不支持下载」，无安装包文件 |
| 无法识别 | 跳转 **`#download`**，由用户手动选择卡片 |

---

## iOS

落地页固定为 **暂不支持下载**（无 ipa / 无商店链接占位）。若日后开放 iOS 分发，请直接修改 **`index.html`** 中 `id="download-ios"` 的卡片内容与文案，并视需要调整 **`assets/site.js`** 里 iOS 分支的 `href` / `label`。

---

## 目录结构

```
quiet-editor-page/
├── index.html                 # 页面结构与文案
├── styles.css                 # 样式与动效
├── assets/
│   ├── site.js                # 系统检测、滚动显现、首屏视差
│   ├── logo.svg
│   └── downloads/             # ← 安装包放这里（见上表）
│       ├── .gitkeep
│       └── 放置安装包说明.txt
├── scripts/
│   └── build.mjs              # 输出到 dist/
├── package.json
└── README.md
```

---

## 常见问题

**点击下载返回 404**  
检查 `assets/downloads/` 是否已提交对应文件，且文件名与表格完全一致；重新执行 `npm run build` 后再部署。

**Linux 自动下载选错 DEB/RPM**  
属 UA 启发式限制，属正常情况；用户可在下载区手动点另一张卡片。可按需收紧或放宽 `linuxPrefersRpm()` 中的关键词。

**本地直接双击打开 `index.html`**  
部分浏览器对 `file://` 下相对路径与 `download` 行为有限制；请以 `npm run preview` 或真实 HTTPS 域名验证下载。

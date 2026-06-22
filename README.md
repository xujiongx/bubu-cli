# bubu-cli

一个终端命令行工具，随机下载并设置桌面壁纸。

## 功能

- 从 [Pexels](https://www.pexels.com/) 随机下载 4K 横屏桌面壁纸
- 下载完成后**自动设置为桌面壁纸**（默认开启）
- 支持 macOS、Linux (GNOME)、Windows
- 支持自定义保存目录

## 环境要求

- Node.js >= 18

## 安装

### 从 npm 安装（推荐）

```bash
npm install -g bubu-cli
bubu wallpaper
```

安装后可直接使用，**无需配置 API Key 或环境变量**。

### 从源码安装

```bash
git clone <repo-url>
cd bubu-cli
echo "PEXELS_API_KEY=你的API_KEY" > .env
npm install
npm run build
npm link
```

发布到 npm 前，会在构建时将 `.env` 中的 `PEXELS_API_KEY` 写入包内；本地开发需在根目录配置 `.env` 后执行 `npm run build`。

## 使用方法

### 下载并设置壁纸

```bash
# 下载随机壁纸，并自动设为桌面壁纸（默认）
bubu wallpaper

# 指定保存目录
bubu wallpaper -o ~/Desktop

# 仅下载，不设置壁纸
bubu wallpaper --no-set
```

默认保存目录为 `~/Desktop/bubu-wallpapers`，也可通过以下命令修改：

```bash
bubu config --wallpaper-dir ~/Desktop/wallpapers
```

查看当前配置（壁纸目录等）：

```bash
bubu config --show
```

配置文件保存在 `~/.bubu-cli/config.json`。

### 查看帮助

```bash
bubu --help
bubu wallpaper --help
bubu config --help
```

## 开发

```bash
# 编译（会从 .env 生成内置 API Key）
npm run build

# 开发模式运行
npm run dev wallpaper

# 直接运行编译产物
node dist/index.js wallpaper
```

## 发布到 npm

本项目已配置使用 [npm 官方源](https://registry.npmjs.org/)（`.npmrc` + `publishConfig`），不影响你全局的 npmmirror 镜像。

```bash
# 1. 登录 npm 官方账号（只需一次）
npm run login:npm

# 2. 发布
npm run publish:npm
```

## 项目结构

```
bubu-cli/
├── src/
│   ├── index.ts              # CLI 入口
│   ├── config.ts             # 配置读写
│   └── commands/
│       ├── wallpaper.ts      # 壁纸下载与设置
│       └── config.ts         # 配置管理
├── package.json
└── tsconfig.json
```

## 注意事项

- 壁纸图片来自 Pexels，使用时请遵守 [Pexels 使用条款](https://www.pexels.com/license/)
- macOS 14+ (Sonoma) 会自动更新**所有桌面 Space** 的壁纸（Mission Control 多桌面场景）
- macOS 使用原生 `macos-wallpaper` + 系统壁纸数据库，兼容新版壁纸系统
- Linux 自动设置壁纸目前仅支持 GNOME 桌面环境
- 发布 npm 包时会将 `.env` 中的 API Key 内置到包内，请勿将 `.env` 提交到 Git

## License

ISC

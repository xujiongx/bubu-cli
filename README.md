# ada-cli

一个终端命令行工具，用于快速获取并设置桌面壁纸。

## 功能

- 从 [Pexels](https://www.pexels.com/) 随机下载 4K 横屏桌面壁纸
- 下载完成后**自动设置为桌面壁纸**（默认开启）
- 支持 macOS、Linux (GNOME)、Windows
- 支持自定义保存目录与 API Key 配置

## 环境要求

- Node.js >= 18
- Pexels API Key（[免费申请](https://www.pexels.com/api/)）

## 安装

```bash
git clone <repo-url>
cd ada-cli
npm install
npm run build
```

全局安装（可选）：

```bash
npm link
```

安装后可直接使用 `ada` 命令。

## 配置 API Key

任选一种方式即可：

**方式 1：`.env` 文件（推荐本地开发）**

```bash
echo "PEXELS_API_KEY=你的API_KEY" > .env
```

**方式 2：CLI 配置**

```bash
ada config --pexels-key <YOUR_API_KEY>
```

**方式 3：环境变量**

```bash
export PEXELS_API_KEY=<YOUR_API_KEY>
```

查看当前配置：

```bash
ada config --show
```

配置文件保存在 `~/.ada-cli/config.json`。

## 使用方法

### 下载并设置壁纸

```bash
# 下载随机壁纸，并自动设为桌面壁纸（默认）
ada wallpaper

# 指定保存目录
ada wallpaper -o ~/Desktop

# 仅下载，不设置壁纸
ada wallpaper --no-set
```

默认保存目录为 `~/Desktop/ada-wallpapers`，也可通过以下命令修改：

```bash
ada config --wallpaper-dir ~/Desktop/wallpapers
```

### 查看帮助

```bash
ada --help
ada wallpaper --help
ada config --help
```

## 开发

```bash
# 编译
npm run build

# 开发模式运行
npm run dev wallpaper

# 直接运行编译产物
node dist/index.js wallpaper
```

## 项目结构

```
ada-cli/
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
- `.env` 文件包含 API Key，请勿提交到 Git（已在 `.gitignore` 中忽略）

## License

ISC

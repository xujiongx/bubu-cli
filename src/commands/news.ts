import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { DEFAULT_NEWS_DIR } from '../config.js';

const TOUTIAO_HOT_BOARD_URL =
  'https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

interface ToutiaoImage {
  url?: string;
}

interface ToutiaoHotItem {
  Title: string;
  QueryWord: string;
  HotValue: string;
  Label: string;
  LabelDesc?: string;
  Url: string;
  Image?: ToutiaoImage;
}

interface ToutiaoHotResponse {
  data: ToutiaoHotItem[];
  status: string;
}

export interface HotNewsItem {
  rank: number;
  title: string;
  hotValue: string;
  label: string;
  url: string;
  imageUrl: string;
}

const LABEL_MAP: Record<string, string> = {
  hot: '热',
  new: '新',
  boil: '沸',
  burst: '爆',
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatHotValue(value: string): string {
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  return String(num);
}

function formatTimestamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatFilename(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `toutiao-hot-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.html`;
}

function getLabelClass(label: string): string {
  if (label === 'hot') return 'tag-hot';
  if (label === 'new') return 'tag-new';
  if (label === 'boil') return 'tag-boil';
  if (label === 'burst') return 'tag-burst';
  return 'tag-default';
}

export function buildNewsHtml(items: HotNewsItem[], updatedAt = new Date()): string {
  const [featured, ...rest] = items;

  const renderCard = (item: HotNewsItem, variant: 'hero' | 'default' = 'default') => {
    const labelText = item.label ? LABEL_MAP[item.label] || item.label : '';
    const labelHtml = labelText
      ? `<span class="tag ${getLabelClass(item.label)}">${escapeHtml(labelText)}</span>`
      : '';

    const imageHtml = item.imageUrl
      ? `<div class="media"><img class="cover" src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}" loading="lazy" referrerpolicy="no-referrer" /></div>`
      : `<div class="media"><div class="cover placeholder"><span>暂无图片</span></div></div>`;

    return `
      <article class="card card-${variant}">
        <a class="card-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
          ${imageHtml}
          <div class="content">
            <div class="meta">
              <span class="rank">${String(item.rank).padStart(2, '0')}</span>
              ${labelHtml}
              <span class="hot">${escapeHtml(formatHotValue(item.hotValue))}</span>
            </div>
            <h2 class="title">${escapeHtml(item.title)}</h2>
            <p class="cta">阅读全文 ›</p>
          </div>
        </a>
      </article>`;
  };

  const featuredHtml = featured ? renderCard(featured, 'hero') : '';
  const gridHtml = rest.map((item) => renderCard(item)).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>今日头条热榜 - ${formatTimestamp(updatedAt)}</title>
  <style>
    :root {
      --bg: #fbfbfd;
      --surface: #ffffff;
      --surface-muted: #f5f5f7;
      --text: #1d1d1f;
      --text-secondary: #86868b;
      --text-tertiary: #6e6e73;
      --link: #0066cc;
      --border: rgba(0, 0, 0, 0.08);
      --shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
      --shadow-hover: 0 12px 40px rgba(0, 0, 0, 0.12);
      --radius: 18px;
      --nav-height: 52px;
      --ease: cubic-bezier(0.25, 0.1, 0.25, 1);
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #000000;
        --surface: #1d1d1f;
        --surface-muted: #161617;
        --text: #f5f5f7;
        --text-secondary: #a1a1a6;
        --text-tertiary: #86868b;
        --link: #2997ff;
        --border: rgba(255, 255, 255, 0.12);
        --shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
        --shadow-hover: 0 16px 48px rgba(0, 0, 0, 0.45);
      }
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    html {
      scroll-behavior: smooth;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      line-height: 1.47059;
      letter-spacing: -0.022em;
    }

    a { color: var(--link); text-decoration: none; }

    .nav {
      position: sticky;
      top: 0;
      z-index: 100;
      height: var(--nav-height);
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      background: rgba(251, 251, 253, 0.72);
      border-bottom: 1px solid var(--border);
    }

    @media (prefers-color-scheme: dark) {
      .nav { background: rgba(0, 0, 0, 0.72); }
    }

    .nav-inner {
      width: min(1068px, calc(100% - 48px));
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .nav-brand {
      font-size: 17px;
      font-weight: 600;
      color: var(--text);
      letter-spacing: -0.01em;
    }

    .nav-meta {
      font-size: 12px;
      color: var(--text-secondary);
    }

    main {
      width: min(1068px, calc(100% - 48px));
      margin: 0 auto;
      padding: 56px 0 80px;
    }

    .hero {
      text-align: center;
      padding: 24px 0 56px;
    }

    .eyebrow {
      font-size: 17px;
      font-weight: 600;
      color: var(--link);
      margin-bottom: 8px;
    }

    .hero h1 {
      font-size: clamp(40px, 7vw, 56px);
      line-height: 1.07143;
      font-weight: 600;
      letter-spacing: -0.005em;
      margin-bottom: 12px;
    }

    .subtitle {
      font-size: 21px;
      line-height: 1.381;
      color: var(--text-secondary);
      font-weight: 400;
      max-width: 640px;
      margin: 0 auto;
    }

    .subtitle a {
      color: inherit;
      border-bottom: 1px solid rgba(134, 134, 139, 0.4);
      transition: color 0.3s var(--ease), border-color 0.3s var(--ease);
    }

    .subtitle a:hover {
      color: var(--link);
      border-color: transparent;
    }

    .featured {
      margin-bottom: 32px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    @media (max-width: 980px) {
      .grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 640px) {
      main { width: calc(100% - 32px); padding-top: 32px; }
      .grid { grid-template-columns: 1fr; gap: 20px; }
      .hero { padding-bottom: 36px; }
      .hero h1 { font-size: 36px; }
      .subtitle { font-size: 17px; }
    }

    .card {
      background: var(--surface);
      border-radius: var(--radius);
      overflow: hidden;
      box-shadow: var(--shadow);
      transition: transform 0.45s var(--ease), box-shadow 0.45s var(--ease);
    }

    .card:hover {
      transform: scale(1.02);
      box-shadow: var(--shadow-hover);
    }

    .card-link {
      color: inherit;
      text-decoration: none;
      display: block;
      height: 100%;
    }

    .media {
      position: relative;
      overflow: hidden;
      background: var(--surface-muted);
    }

    .cover {
      width: 100%;
      aspect-ratio: 16 / 10;
      object-fit: cover;
      display: block;
      transition: transform 0.6s var(--ease);
    }

    .card:hover .cover {
      transform: scale(1.04);
    }

    .cover.placeholder {
      aspect-ratio: 16 / 10;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-tertiary);
      font-size: 14px;
      background: linear-gradient(135deg, var(--surface-muted), var(--surface));
    }

    .content {
      padding: 20px 22px 24px;
    }

    .meta {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }

    .rank {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: var(--text-tertiary);
      min-width: 24px;
    }

    .card-hero .rank {
      color: var(--link);
      font-size: 13px;
    }

    .tag {
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 980px;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    .tag-hot { background: rgba(255, 59, 48, 0.12); color: #ff3b30; }
    .tag-new { background: rgba(0, 122, 255, 0.12); color: #007aff; }
    .tag-boil { background: rgba(255, 45, 85, 0.12); color: #ff2d55; }
    .tag-burst { background: rgba(255, 149, 0, 0.12); color: #ff9500; }
    .tag-default { background: var(--surface-muted); color: var(--text-secondary); }

    .hot {
      margin-left: auto;
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .title {
      font-size: 19px;
      line-height: 1.4211;
      font-weight: 600;
      letter-spacing: 0.012em;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .cta {
      margin-top: 14px;
      font-size: 14px;
      color: var(--link);
      font-weight: 500;
      opacity: 0;
      transform: translateY(4px);
      transition: opacity 0.3s var(--ease), transform 0.3s var(--ease);
    }

    .card:hover .cta {
      opacity: 1;
      transform: translateY(0);
    }

    .card-hero .media .cover,
    .card-hero .cover.placeholder {
      aspect-ratio: 21 / 9;
    }

    .card-hero .title {
      font-size: clamp(24px, 4vw, 32px);
      line-height: 1.125;
      letter-spacing: 0.004em;
      -webkit-line-clamp: 2;
    }

    .card-hero .content {
      padding: 28px 32px 32px;
    }

    .card-hero .cta {
      opacity: 1;
      transform: none;
      font-size: 17px;
      margin-top: 18px;
    }

    .section-label {
      font-size: 24px;
      line-height: 1.16667;
      font-weight: 600;
      letter-spacing: 0.009em;
      margin-bottom: 24px;
      color: var(--text);
    }

    footer {
      border-top: 1px solid var(--border);
      padding: 24px 0 40px;
      text-align: center;
      color: var(--text-secondary);
      font-size: 12px;
    }

    footer span {
      display: block;
      margin-top: 6px;
      color: var(--text-tertiary);
    }
  </style>
</head>
<body>
  <nav class="nav">
    <div class="nav-inner">
      <div class="nav-brand">今日头条热榜</div>
      <div class="nav-meta">${formatTimestamp(updatedAt)}</div>
    </div>
  </nav>

  <main>
    <section class="hero">
      <p class="eyebrow">今日热点</p>
      <h1>今日头条热榜</h1>
      <p class="subtitle">
        来源 <a href="https://www.toutiao.com/" target="_blank" rel="noopener noreferrer">今日头条</a>
        · 共 ${items.length} 条 · 更新于 ${formatTimestamp(updatedAt)}
      </p>
    </section>

    ${featured ? `<section class="featured">${featuredHtml}</section>` : ''}

    ${rest.length ? `<h3 class="section-label">更多热点</h3><section class="grid">${gridHtml}</section>` : ''}
  </main>

  <footer>
    Generated by bubu-cli
    <span>数据来源于今日头条公开热榜接口</span>
  </footer>
</body>
</html>`;
}

export function saveNewsHtml(
  items: HotNewsItem[],
  outputDir = DEFAULT_NEWS_DIR
): string {
  const dir = path.resolve(outputDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const now = new Date();
  const filePath = path.join(dir, formatFilename(now));
  fs.writeFileSync(filePath, buildNewsHtml(items, now), 'utf-8');
  return filePath;
}

export async function fetchToutiaoHotNews(limit = 20): Promise<HotNewsItem[]> {
  const response = await axios.get<ToutiaoHotResponse>(TOUTIAO_HOT_BOARD_URL, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json, text/plain, */*',
      Referer: 'https://www.toutiao.com/',
    },
    timeout: 15000,
  });

  if (response.data.status !== 'success' || !response.data.data?.length) {
    throw new Error('今日头条热榜数据为空');
  }

  return response.data.data.slice(0, limit).map((item, index) => ({
    rank: index + 1,
    title: item.Title || item.QueryWord,
    hotValue: item.HotValue,
    label: item.Label,
    url: item.Url,
    imageUrl: item.Image?.url || '',
  }));
}

export async function newsCommand(options: {
  limit?: string;
  output?: string;
  json?: boolean;
}): Promise<void> {
  const { default: chalk } = await import('chalk');
  const { default: ora } = await import('ora');

  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 50);
  const outputDir = options.output
    ? path.resolve(options.output)
    : DEFAULT_NEWS_DIR;

  const spinner = ora('正在获取今日头条热榜...').start();

  let items: HotNewsItem[];
  try {
    items = await fetchToutiaoHotNews(limit);
    spinner.succeed(chalk.green(`获取成功，共 ${items.length} 条`));
  } catch (err) {
    spinner.fail('获取热榜失败');
    if (axios.isAxiosError(err)) {
      console.error(chalk.red(`✗ 请求失败: ${err.message}`));
    } else {
      console.error(chalk.red(`✗ ${(err as Error).message}`));
    }
    process.exit(1);
  }

  const saveSpinner = ora('正在生成 HTML 文件...').start();
  let filePath: string;
  try {
    filePath = saveNewsHtml(items, outputDir);
    saveSpinner.succeed(chalk.green('HTML 已保存'));
  } catch (err) {
    saveSpinner.fail('保存失败');
    console.error(chalk.red(`✗ ${(err as Error).message}`));
    process.exit(1);
  }

  if (options.json) {
    console.log(JSON.stringify({ filePath, items }, null, 2));
    return;
  }

  console.log('');
  console.log(`  ${chalk.bold('文件路径:')} ${chalk.cyan(filePath)}`);
  console.log('');
  console.log(chalk.bold.cyan('  今日头条热榜'));
  console.log(chalk.gray(`  来源: https://www.toutiao.com/\n`));

  for (const item of items) {
    const rank =
      item.rank <= 3
        ? chalk.red.bold(String(item.rank).padStart(2, ' '))
        : chalk.gray(String(item.rank).padStart(2, ' '));

    const label = item.label
      ? chalk.yellow(`[${LABEL_MAP[item.label] || item.label}]`)
      : '';

    const hot = chalk.gray(formatHotValue(item.hotValue));

    console.log(`  ${rank}  ${item.title}  ${label} ${hot}`);
    console.log(chalk.blue.underline(`      ${item.url}`));
  }

  console.log('');
}

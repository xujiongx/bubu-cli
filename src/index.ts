#!/usr/bin/env node

import { Command } from 'commander';
import { configCommand } from './commands/config.js';
import { newsCommand } from './commands/news.js';
import { wallpaperCommand } from './commands/wallpaper.js';

const program = new Command();

program
  .name('bubu')
  .description('bubu-cli — 终端工具箱')
  .version('1.0.0');

program
  .command('wallpaper')
  .description('从 Pexels 随机下载一张 4K 桌面壁纸，并自动设为桌面壁纸')
  .option('-o, --output <dir>', '保存目录')
  .option('--no-set', '仅下载，不自动设为桌面壁纸')
  .action(async (options: { output?: string; set?: boolean }) => {
    await wallpaperCommand(options);
  });

program
  .command('news')
  .description('获取今日头条热门新闻热榜，并保存为 HTML')
  .option('-n, --limit <number>', '显示条数，默认 20，最多 50', '20')
  .option('-o, --output <dir>', '保存目录，默认 ~/Desktop/bubu-news')
  .option('--json', '以 JSON 格式输出')
  .action(async (options: { limit?: string; output?: string; json?: boolean }) => {
    await newsCommand(options);
  });

program
  .command('config')
  .description('管理 bubu-cli 配置')
  .option('--pexels-key <key>', '设置 Pexels API Key')
  .option('--wallpaper-dir <dir>', '设置默认壁纸保存目录')
  .option('--show', '显示当前配置')
  .action(async (options: {
    pexelsKey?: string;
    wallpaperDir?: string;
    show?: boolean;
  }) => {
    await configCommand(options);
  });

program.parse();

#!/usr/bin/env node

import { config as loadEnv } from 'dotenv';
import { Command } from 'commander';
import { configCommand } from './commands/config.js';
import { wallpaperCommand } from './commands/wallpaper.js';

loadEnv({ quiet: true });

const program = new Command();

program
  .name('ada')
  .description('ada-cli — 你的终端工具箱')
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
  .command('config')
  .description('管理 ada-cli 配置')
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

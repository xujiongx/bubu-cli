import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { getConfig, DEFAULT_WALLPAPER_DIR } from '../config.js';
import { setMacOSWallpaperAllSpaces } from '../utils/macos-wallpaper.js';

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
  };
  alt: string;
}

interface PexelsSearchResponse {
  photos: PexelsPhoto[];
  total_results: number;
  page: number;
  per_page: number;
  next_page?: string;
}

async function fetchRandomPage(apiKey: string): Promise<PexelsPhoto[]> {
  const randomPage = Math.floor(Math.random() * 5) + 1;
  const response = await axios.get<PexelsSearchResponse>(
    'https://api.pexels.com/v1/search',
    {
      headers: { Authorization: apiKey },
      params: {
        query: '4k desktop wallpaper',
        per_page: 80,
        page: randomPage,
        orientation: 'landscape',
        size: 'large',
      },
    }
  );
  return response.data.photos;
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  const response = await axios.get<NodeJS.ReadableStream>(url, {
    responseType: 'stream',
  });
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(destPath);
    (response.data as NodeJS.ReadableStream).pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function setDesktopWallpaper(imagePath: string): Promise<boolean> {
  const resolvedPath = path.resolve(imagePath);

  if (process.platform === 'darwin') {
    await setMacOSWallpaperAllSpaces(resolvedPath);
    return true;
  }

  if (process.platform === 'win32') {
    const { setWallpaper } = await import('wallpaper');
    await setWallpaper(resolvedPath, { screen: 'all', scale: 'span' });
    return true;
  }

  if (process.platform === 'linux') {
    const { execSync } = await import('child_process');
    execSync(
      `gsettings set org.gnome.desktop.background picture-uri "file://${resolvedPath}"`
    );
    return true;
  }

  return false;
}

export async function wallpaperCommand(options: {
  output?: string;
  set?: boolean;
}): Promise<void> {
  const { default: chalk } = await import('chalk');
  const { default: ora } = await import('ora');

  const config = getConfig();
  const apiKey = process.env.PEXELS_API_KEY || config.pexelsApiKey;

  if (!apiKey) {
    console.error(
      chalk.red('✗ 未找到 Pexels API Key。') +
        '\n\n请通过以下任一方式配置：\n' +
        chalk.yellow('  1. ada config --pexels-key <YOUR_API_KEY>') +
        '\n' +
        chalk.yellow('  2. export PEXELS_API_KEY=<YOUR_API_KEY>') +
        '\n\n获取免费 API Key：' +
        chalk.cyan('https://www.pexels.com/api/')
    );
    process.exit(1);
  }

  const outputDir = options.output
    ? path.resolve(options.output)
    : config.wallpaperDir
      ? path.resolve(config.wallpaperDir)
      : DEFAULT_WALLPAPER_DIR;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const spinner = ora('正在从 Pexels 获取 4K 壁纸列表...').start();

  let photos: PexelsPhoto[];
  try {
    photos = await fetchRandomPage(apiKey);
  } catch (err) {
    spinner.fail('获取壁纸列表失败');
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 401) {
        console.error(chalk.red('\n✗ API Key 无效，请重新配置。'));
      } else {
        console.error(chalk.red(`\n✗ 请求失败: ${err.message}`));
      }
    }
    process.exit(1);
  }

  if (!photos.length) {
    spinner.fail('未获取到任何壁纸');
    process.exit(1);
  }

  const photo = photos[Math.floor(Math.random() * photos.length)];
  const imageUrl = photo.src.original;
  const ext = imageUrl.split('?')[0].split('.').pop() || 'jpg';
  const fileName = `pexels-${photo.id}-${Date.now()}.${ext}`;
  const destPath = path.join(outputDir, fileName);

  spinner.text = `正在下载壁纸 (by ${photo.photographer})...`;

  try {
    await downloadFile(imageUrl, destPath);
  } catch (err) {
    spinner.fail('下载失败');
    console.error(chalk.red(`✗ ${(err as Error).message}`));
    process.exit(1);
  }

  spinner.succeed(chalk.green('壁纸下载成功！'));
  console.log('');
  console.log(`  ${chalk.bold('文件路径:')} ${chalk.cyan(destPath)}`);
  console.log(`  ${chalk.bold('摄影师:')}   ${chalk.cyan(photo.photographer)}`);
  console.log(`  ${chalk.bold('来源:')}     ${chalk.cyan(photo.photographer_url)}`);
  if (photo.alt) {
    console.log(`  ${chalk.bold('描述:')}     ${photo.alt}`);
  }

  const shouldSetWallpaper = options.set !== false;
  if (shouldSetWallpaper) {
    const spinnerSet = ora('正在设置为桌面壁纸...').start();
    try {
      const applied = await setDesktopWallpaper(destPath);
      if (applied) {
        spinnerSet.succeed(chalk.green('已设置为桌面壁纸（所有桌面 Space）'));
      } else {
        spinnerSet.warn(chalk.yellow('当前系统暂不支持自动设置壁纸'));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      spinnerSet.fail(chalk.yellow('自动设置壁纸失败'));
      console.error(chalk.red(`  ${message}`));
      console.error(
        chalk.gray(
          '  提示: 可在「系统设置 → 壁纸」中手动选择，或确认终端有「辅助功能」权限'
        )
      );
    }
  }
}

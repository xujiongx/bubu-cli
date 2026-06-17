import { getConfig, getConfigPath, setConfig, DEFAULT_WALLPAPER_DIR } from '../config.js';

export async function configCommand(options: {
  pexelsKey?: string;
  wallpaperDir?: string;
  show?: boolean;
}): Promise<void> {
  const { default: chalk } = await import('chalk');

  if (options.pexelsKey) {
    setConfig({ pexelsApiKey: options.pexelsKey });
    console.log(chalk.green('✓ Pexels API Key 已保存'));
  }

  if (options.wallpaperDir) {
    setConfig({ wallpaperDir: options.wallpaperDir });
    console.log(chalk.green(`✓ 壁纸保存目录已设置为: ${options.wallpaperDir}`));
  }

  if (options.show || (!options.pexelsKey && !options.wallpaperDir)) {
    const config = getConfig();
    console.log(chalk.bold('\n当前配置:'));
    console.log(`  配置文件: ${getConfigPath()}`);
    console.log(
      `  Pexels API Key: ${
        config.pexelsApiKey
          ? chalk.green('已配置 (***' + config.pexelsApiKey.slice(-4) + ')')
          : chalk.yellow('未配置')
      }`
    );
    console.log(
      `  壁纸目录: ${config.wallpaperDir || chalk.gray(`默认 ${DEFAULT_WALLPAPER_DIR}`)}`
    );
    console.log('');
    console.log(chalk.gray('提示: 也可通过环境变量 PEXELS_API_KEY 设置 API Key'));
  }
}

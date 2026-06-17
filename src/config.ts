import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.ada-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export const DEFAULT_WALLPAPER_DIR = path.join(
  os.homedir(),
  'Desktop',
  'ada-wallpapers'
);

export interface Config {
  pexelsApiKey?: string;
  wallpaperDir?: string;
}

export function getConfig(): Config {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return {};
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw) as Config;
  } catch {
    return {};
  }
}

export function setConfig(updates: Partial<Config>): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  const current = getConfig();
  const merged = { ...current, ...updates };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf-8');
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}

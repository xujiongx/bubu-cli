import fs from 'fs';
import path from 'path';
import os from 'os';
import { PEXELS_API_KEY as BUILTIN_PEXELS_API_KEY } from './builtin-env.js';

const CONFIG_DIR = path.join(os.homedir(), '.bubu-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export const DEFAULT_WALLPAPER_DIR = path.join(
  os.homedir(),
  'Desktop',
  'bubu-wallpapers'
);

export const DEFAULT_NEWS_DIR = path.join(
  os.homedir(),
  'Desktop',
  'bubu-news'
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

export function getPexelsApiKey(): string {
  return (
    BUILTIN_PEXELS_API_KEY ||
    process.env.PEXELS_API_KEY ||
    getConfig().pexelsApiKey ||
    ''
  );
}

export function hasBuiltinPexelsApiKey(): boolean {
  return Boolean(BUILTIN_PEXELS_API_KEY);
}

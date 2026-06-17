import { execFileSync } from 'child_process';
import path from 'path';

const PLIST_UPDATE_SCRIPT = `
import plistlib
import shutil
import subprocess
import sys
from pathlib import Path

image_path = Path(sys.argv[1]).resolve()
file_url = f"file://{image_path}"
plist_path = Path.home() / "Library/Application Support/com.apple.wallpaper/Store/Index.plist"

if not plist_path.exists():
    sys.exit(0)

shutil.copy2(plist_path, str(plist_path) + ".bak")

with open(plist_path, "rb") as f:
    data = plistlib.load(f)

def set_desktop(entry, url):
    if not isinstance(entry, dict) or "Desktop" not in entry:
        return False
    try:
        choice = entry["Desktop"]["Content"]["Choices"][0]
        choice["Provider"] = "com.apple.wallpaper.choice.image"
        choice["Files"] = [{"relative": url}]
        return True
    except (KeyError, IndexError, TypeError):
        return False

updated = 0
for display in data.get("Displays", {}).values():
    if set_desktop(display, file_url):
        updated += 1

for space in data.get("Spaces", {}).values():
    if not isinstance(space, dict):
        continue
    if set_desktop(space.get("Default", {}), file_url):
        updated += 1
    for display in space.get("Displays", {}).values():
        if set_desktop(display, file_url):
            updated += 1

with open(plist_path, "wb") as f:
    plistlib.dump(data, f)

subprocess.run(["killall", "WallpaperAgent"], stderr=subprocess.DEVNULL)
print(updated)
`.trim();

export async function setMacOSWallpaperAllSpaces(imagePath: string): Promise<void> {
  const resolvedPath = path.resolve(imagePath);

  const { setWallpaper } = await import('wallpaper');
  await setWallpaper(resolvedPath, { screen: 'all', scale: 'fill' });

  try {
    execFileSync('python3', ['-c', PLIST_UPDATE_SCRIPT, resolvedPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf-8',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`更新所有桌面 Space 失败: ${message}`);
  }
}

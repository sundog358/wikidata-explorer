import { copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const sourceDir = path.resolve(".tmp/visual-qa");
const targetDir = path.resolve("docs/screenshots");

const screenshots = [
  ["01-home-desktop.png", "home-desktop.png"],
  ["02-search-q42-graph-desktop.png", "search-q42-graph-desktop.png"],
  ["03-chat-desktop.png", "research-assistant-desktop.png"],
  ["06-search-q42-mobile.png", "search-q42-mobile.png"],
];

async function ensureFile(filePath) {
  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error(`${filePath} is not a file`);
  } catch (error) {
    throw new Error(`Missing ${filePath}. Run npm run visual:qa before npm run screenshots:update.`, { cause: error });
  }
}

await mkdir(targetDir, { recursive: true });

for (const [sourceName, targetName] of screenshots) {
  const sourcePath = path.join(sourceDir, sourceName);
  const targetPath = path.join(targetDir, targetName);
  await ensureFile(sourcePath);
  await copyFile(sourcePath, targetPath);
  console.log(`UPDATED ${path.relative(process.cwd(), targetPath)} from ${path.relative(process.cwd(), sourcePath)}`);
}

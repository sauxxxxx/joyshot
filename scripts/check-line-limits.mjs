import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const ignored = new Set([".git", ".next", "coverage", "dist", "node_modules"]);
const checkedExtensions = new Set([
  ".css",
  ".js",
  ".jsx",
  ".mjs",
  ".ts",
  ".tsx",
]);

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collect(path)));
    else if (checkedExtensions.has(extname(entry.name))) files.push(path);
  }

  return files;
}

const offenders = [];
for (const file of await collect(root)) {
  const lineCount = (await readFile(file, "utf8")).split(/\r?\n/u).length;
  if (lineCount > 600) offenders.push(`${relative(root, file)} (${lineCount})`);
}

if (offenders.length > 0) {
  console.error(`Files exceed the 600-line limit:\n${offenders.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log("All source files are within the 600-line limit.");
}

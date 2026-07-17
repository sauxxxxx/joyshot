import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const tsxCli = require.resolve("tsx/cli");
const realtimeDirectory = fileURLToPath(new URL("../apps/realtime/", import.meta.url));

const child = spawn(process.execPath, [tsxCli, "watch", "src/index.ts"], {
  cwd: realtimeDirectory,
  env: {
    ...process.env,
    LOCAL_HTTPS: "true",
    WEB_ORIGIN: "https://localhost:3000",
  },
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code) => process.exit(code ?? 1));

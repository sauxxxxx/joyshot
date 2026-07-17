import { readFileSync } from "node:fs";
import { env } from "./config/env.js";
import { createRealtimeServer } from "./createRealtimeServer.js";

const tls = env.LOCAL_HTTPS
  ? {
      cert: readFileSync(env.HTTPS_CERT_PATH),
      key: readFileSync(env.HTTPS_KEY_PATH),
    }
  : undefined;

const { httpServer } = createRealtimeServer({
  webOrigin: env.WEB_ORIGIN,
  allowLanOrigins: process.env.NODE_ENV !== "production",
  roomTtlMs: env.ROOM_TTL_MINUTES * 60_000,
  reconnectGraceMs: env.RECONNECT_GRACE_SECONDS * 1_000,
  maxImageBytes: env.MAX_IMAGE_BYTES,
  tls,
});

httpServer.listen(env.PORT, () => {
  const protocol = tls ? "https" : "http";
  console.log(`Realtime server listening on ${protocol}://localhost:${env.PORT}`);
});

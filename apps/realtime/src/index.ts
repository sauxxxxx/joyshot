import { readFileSync } from "node:fs";
import { env } from "./config/env.js";
import { createRealtimeServer } from "./createRealtimeServer.js";
import { logger } from "./observability/logger.js";
import { attachRedisRealtime } from "./infrastructure/redisRealtime.js";

const tls = env.LOCAL_HTTPS
  ? {
      cert: readFileSync(env.HTTPS_CERT_PATH),
      key: readFileSync(env.HTTPS_KEY_PATH),
    }
  : undefined;

const { httpServer, io } = createRealtimeServer({
  webOrigin: env.WEB_ORIGIN,
  allowLanOrigins: process.env.NODE_ENV !== "production",
  roomTtlMs: env.ROOM_TTL_MINUTES * 60_000,
  reconnectGraceMs: env.RECONNECT_GRACE_SECONDS * 1_000,
  maxImageBytes: env.MAX_IMAGE_BYTES,
  tls,
});

const closeRedis = await attachRedisRealtime(io, env.REDIS_URL);
httpServer.on("close", () => void closeRedis());

httpServer.listen(env.PORT, () => {
  const protocol = tls ? "https" : "http";
  logger.info("Realtime server listening", { protocol, port: env.PORT });
});

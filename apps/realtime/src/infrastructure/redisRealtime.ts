import { createAdapter } from "@socket.io/redis-adapter";
import type { ClientToServerEvents, ServerToClientEvents } from "@photobooth/shared";
import { createClient } from "redis";
import type { Server } from "socket.io";
import { logger } from "../observability/logger.js";

export async function attachRedisRealtime(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  redisUrl?: string,
) {
  if (!redisUrl) return async () => undefined;
  const publisher = createClient({ url: redisUrl });
  const subscriber = publisher.duplicate();
  publisher.on("error", (error) => logger.error("Redis publisher error", { error: error.message }));
  subscriber.on("error", (error) => logger.error("Redis subscriber error", { error: error.message }));
  await Promise.all([publisher.connect(), subscriber.connect()]);
  io.adapter(createAdapter(publisher, subscriber));
  logger.info("Redis Socket.IO adapter connected");
  return async () => { await Promise.all([publisher.quit(), subscriber.quit()]); };
}

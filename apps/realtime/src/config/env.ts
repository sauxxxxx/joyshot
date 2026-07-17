import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  ROOM_TTL_MINUTES: z.coerce.number().int().positive().default(30),
  RECONNECT_GRACE_SECONDS: z.coerce.number().int().positive().default(45),
  MAX_IMAGE_BYTES: z.coerce.number().int().positive().default(1_048_576),
  LOCAL_HTTPS: z.string().optional().transform((value) => value === "true"),
  HTTPS_KEY_PATH: z.string().default("../../certificates/lan-key.pem"),
  HTTPS_CERT_PATH: z.string().default("../../certificates/lan.pem"),
});

export const env = envSchema.parse(process.env);

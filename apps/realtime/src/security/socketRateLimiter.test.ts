import { describe, expect, it, vi } from "vitest";
import { SocketRateLimiter } from "./socketRateLimiter.js";

describe("SocketRateLimiter", () => {
  it("blocks requests beyond a fixed-window limit and resets later", () => {
    vi.useFakeTimers();
    const limiter = new SocketRateLimiter();
    expect(limiter.allow("join", 2, 1_000)).toBe(true);
    expect(limiter.allow("join", 2, 1_000)).toBe(true);
    expect(limiter.allow("join", 2, 1_000)).toBe(false);
    vi.advanceTimersByTime(1_001);
    expect(limiter.allow("join", 2, 1_000)).toBe(true);
    vi.useRealTimers();
  });
});

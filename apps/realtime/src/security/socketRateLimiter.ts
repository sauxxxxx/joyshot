interface Bucket { count: number; resetsAt: number; }

export class SocketRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  allow(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    const current = this.buckets.get(key);
    if (!current || current.resetsAt <= now) {
      this.buckets.set(key, { count: 1, resetsAt: now + windowMs });
      return true;
    }
    current.count += 1;
    return current.count <= limit;
  }

  clear() { this.buckets.clear(); }
}

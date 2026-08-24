"use strict";

class RateLimiter {
  constructor({ limit = 60, windowMs = 60_000, clock = () => Date.now() } = {}) {
    if (!Number.isInteger(limit) || limit < 1) throw new TypeError("limit must be a positive integer");
    if (!Number.isInteger(windowMs) || windowMs < 1) throw new TypeError("windowMs must be a positive integer");
    this.limit = limit;
    this.windowMs = windowMs;
    this.clock = clock;
    this.buckets = new Map();
  }

  check(key) {
    if (!key) throw new TypeError("rate-limit key is required");
    const now = this.clock();
    const bucket = this.buckets.get(key);
    if (!bucket || now - bucket.startedAt >= this.windowMs) {
      this.buckets.set(key, { startedAt: now, count: 1 });
      return { allowed: true, remaining: this.limit - 1, retryAfterMs: 0 };
    }

    if (bucket.count >= this.limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(0, this.windowMs - (now - bucket.startedAt)),
      };
    }

    bucket.count += 1;
    return { allowed: true, remaining: this.limit - bucket.count, retryAfterMs: 0 };
  }
}

module.exports = { RateLimiter };

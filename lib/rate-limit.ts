/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Works well on a single serverless instance. For multi-instance deployments
 * at scale, swap the Map for Upstash Redis (@upstash/ratelimit + @upstash/redis)
 * — the call signature is identical.
 */

interface Window {
  timestamps: number[];
}

const store = new Map<string, Window>();

/**
 * Returns true if the request should be blocked (limit exceeded).
 *
 * @param key        A unique identifier — usually `route:ip` (e.g. "submit:1.2.3.4")
 * @param maxRequests  Max allowed requests within the window
 * @param windowMs   Window size in milliseconds
 */
export function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;

  const entry = store.get(key) ?? { timestamps: [] };
  // Drop timestamps older than the window
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
  entry.timestamps.push(now);
  store.set(key, entry);

  return entry.timestamps.length > maxRequests;
}

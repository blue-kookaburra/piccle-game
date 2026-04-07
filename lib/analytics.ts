/**
 * Thin wrapper around PostHog. If NEXT_PUBLIC_POSTHOG_KEY is not set,
 * all calls are silent no-ops — safe to call unconditionally.
 *
 * Setup: add NEXT_PUBLIC_POSTHOG_KEY=phc_xxxx to .env.local
 * Get a key at: https://posthog.com (free tier covers small apps)
 */

let _ph: import("posthog-js").PostHog | null = null;

async function getPostHog() {
  if (_ph) return _ph;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || typeof window === "undefined") return null;
  const { default: posthog } = await import("posthog-js");
  if (!posthog.__loaded) {
    posthog.init(key, { api_host: "https://app.posthog.com", capture_pageview: true });
  }
  _ph = posthog;
  return posthog;
}

export async function track(event: string, props?: Record<string, unknown>) {
  const ph = await getPostHog();
  ph?.capture(event, props);
}

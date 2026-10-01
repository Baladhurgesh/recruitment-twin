import { NextRequest } from "next/server";

const ALLOWED_ORIGINS = new Set([
  "https://baladhurgesh.github.io",
  "https://bala-recruitment-twin.vercel.app",
  "http://localhost:3000",
  "http://localhost:8765",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:8765",
]);

export function corsHeaders(origin: string | null, methods: string): HeadersInit {
  const headers: Record<string, string> = {
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = methods;
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Access-Control-Max-Age"] = "86400";
  }
  return headers;
}

export function requestOrigin(request: NextRequest): string | null {
  const origin = request.headers.get("origin");
  if (origin) return origin;

  const referer = request.headers.get("referer");
  if (!referer) return null;

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export function isAllowed(origin: string | null): boolean {
  return origin !== null && ALLOWED_ORIGINS.has(origin);
}

export function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

type Bucket = { count: number; resetAt: number };

export function createRateLimiter(windowMs: number, maxRequests: number) {
  const buckets = new Map<string, Bucket>();
  return function rateLimited(key: string): boolean {
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || now > existing.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return false;
    }

    existing.count += 1;
    return existing.count > maxRequests;
  };
}

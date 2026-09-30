import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = new Set([
  "https://baladhurgesh.github.io",
  "https://bala-recruitment-twin.vercel.app",
  "http://localhost:3000",
  "http://localhost:8765",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:8765",
]);

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 8;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function corsHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Access-Control-Max-Age"] = "86400";
  }
  return headers;
}

function requestOrigin(request: NextRequest): string | null {
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

function isAllowed(origin: string | null): boolean {
  return origin !== null && ALLOWED_ORIGINS.has(origin);
}

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const existing = buckets.get(ip);

  if (!existing || now > existing.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  existing.count += 1;
  return existing.count > MAX_REQUESTS;
}

export async function OPTIONS(request: NextRequest) {
  const origin = requestOrigin(request);
  if (!isAllowed(origin)) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function GET(request: NextRequest) {
  const origin = requestOrigin(request);
  if (!isAllowed(origin)) {
    return NextResponse.json(
      { error: "Origin is not allowed" },
      { status: 403, headers: corsHeaders(origin) }
    );
  }

  if (rateLimited(clientIp(request))) {
    return NextResponse.json(
      { error: "Too many voice sessions. Try again in a few minutes." },
      { status: 429, headers: corsHeaders(origin) }
    );
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!apiKey || !agentId) {
    return NextResponse.json(
      { error: "Voice session is not configured" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }

  try {
    const eleven = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`,
      {
        headers: { "xi-api-key": apiKey },
        cache: "no-store",
      }
    );

    if (!eleven.ok) {
      return NextResponse.json(
        { error: "Failed to create voice session" },
        { status: 502, headers: corsHeaders(origin) }
      );
    }

    const body = (await eleven.json()) as { token?: string };
    if (!body.token) {
      return NextResponse.json(
        { error: "Failed to create voice session" },
        { status: 502, headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json({ token: body.token }, { headers: corsHeaders(origin) });
  } catch {
    return NextResponse.json(
      { error: "Failed to create voice session" },
      { status: 502, headers: corsHeaders(origin) }
    );
  }
}

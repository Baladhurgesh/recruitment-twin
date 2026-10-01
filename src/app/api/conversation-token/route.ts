import { NextRequest, NextResponse } from "next/server";
import { clientIp, corsHeaders as cors, createRateLimiter, isAllowed, requestOrigin } from "@/lib/guard";

const corsHeaders = (origin: string | null) => cors(origin, "GET, OPTIONS");

const rateLimited = createRateLimiter(10 * 60 * 1000, 8);

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

import { NextRequest, NextResponse } from "next/server";
import { clientIp, corsHeaders as cors, createRateLimiter, isAllowed, requestOrigin } from "@/lib/guard";

const corsHeaders = (origin: string | null) => cors(origin, "POST, OPTIONS");
const rateLimited = createRateLimiter(60 * 60 * 1000, 5);

const MAX_NAME = 100;
const MAX_CONTACT = 200;
const MAX_MESSAGE = 4000;

function field(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function OPTIONS(request: NextRequest) {
  const origin = requestOrigin(request);
  if (!isAllowed(origin)) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request: NextRequest) {
  const origin = requestOrigin(request);
  const headers = corsHeaders(origin);

  if (!isAllowed(origin)) {
    return NextResponse.json({ error: "Origin is not allowed" }, { status: 403, headers });
  }

  if (rateLimited(clientIp(request))) {
    return NextResponse.json(
      { error: "Too many messages. Try again later." },
      { status: 429, headers }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.MESSAGE_TO_EMAIL;
  const from = process.env.MESSAGE_FROM_EMAIL || "Bala's Twin <onboarding@resend.dev>";

  if (!apiKey || !to) {
    return NextResponse.json({ error: "Messaging is not configured" }, { status: 500, headers });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers });
  }

  const name = field(body?.name, MAX_NAME).replace(/[\r\n]+/g, " ");
  const contact = field(body?.contact, MAX_CONTACT).replace(/[\r\n]+/g, " ");
  const message = field(body?.message, MAX_MESSAGE);

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400, headers });
  }

  const emailContact = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) ? contact : undefined;

  try {
    const resend = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Twin message from ${name || "a visitor"}`,
        text: [
          `Name: ${name || "(not given)"}`,
          `Contact: ${contact || "(not given)"}`,
          `Origin: ${origin}`,
          "",
          message,
        ].join("\n"),
        ...(emailContact && { reply_to: emailContact }),
      }),
      cache: "no-store",
    });

    if (!resend.ok) {
      console.error("Resend error:", resend.status, await resend.text().catch(() => ""));
      return NextResponse.json({ error: "Failed to send message" }, { status: 502, headers });
    }

    return NextResponse.json({ success: true }, { headers });
  } catch (error) {
    console.error("leave-message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 502, headers });
  }
}

import { NextRequest, NextResponse } from "next/server";

const IAUTOS_API_URL = process.env.NEXT_PUBLIC_IAUTOS_API_URL || "http://localhost:8080";

const scenarioMap: Record<string, { path: string; method: "GET" | "POST" }> = {
  ping: { path: "/api/v1/dev/errorwatch/ping", method: "GET" },
  warning: { path: "/api/v1/dev/errorwatch/log-warning", method: "POST" },
  error: { path: "/api/v1/dev/errorwatch/log-error", method: "POST" },
  exception: { path: "/api/v1/dev/errorwatch/log-exception", method: "POST" },
  throw: { path: "/api/v1/dev/errorwatch/throw", method: "GET" },
  http500: { path: "/api/v1/dev/errorwatch/http-500", method: "GET" },
  breadcrumbs: { path: "/api/v1/dev/errorwatch/breadcrumb-sequence", method: "POST" },
  timeout: { path: "/api/v1/dev/errorwatch/timeout-sim", method: "POST" },
};

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const scenario = typeof body?.scenario === "string" ? body.scenario : "ping";
    const metadata = typeof body?.metadata === "object" && body.metadata ? body.metadata : {};

    const target = scenarioMap[scenario];
    if (!target) {
      return NextResponse.json({ error: "Unknown scenario" }, { status: 400 });
    }

    const response = await fetch(`${IAUTOS_API_URL}${target.path}`, {
      method: target.method,
      headers: {
        "Content-Type": "application/json",
      },
      ...(target.method === "POST"
        ? { body: JSON.stringify({ source: "errorwatch-dashboard", scenario, ...metadata }) }
        : {}),
    });

    const data = await response.json().catch(() => null);
    return NextResponse.json(
      {
        ok: response.ok,
        status: response.status,
        scenario,
        target: `${IAUTOS_API_URL}${target.path}`,
        data,
      },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}


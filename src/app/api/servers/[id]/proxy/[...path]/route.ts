import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Disable body parsing and set max duration for SSE
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string; path: string[] }>;
};

async function proxyRequest(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse | Response> {
  const { id, path } = await context.params;
  const pathString = "/" + path.join("/");

  // Get server from database
  const server = await prisma.server.findUnique({
    where: { id },
  });

  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  // Build agent URL (use HTTPS for port 443, e.g., Tailscale Serve)
  const protocol = server.port === 443 ? "https" : "http";
  const portSuffix = server.port === 443 ? "" : `:${server.port}`;
  const agentUrl = `${protocol}://${server.tailscaleIp}${portSuffix}${pathString}`;
  const url = new URL(agentUrl);

  // Forward query params
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  // Check if this is an SSE request (events endpoint)
  const isSSE = pathString.includes("/events");

  try {
    // Forward the request to the agent
    const headers: HeadersInit = {
      Authorization: `Bearer ${server.apiKey}`,
    };

    if (!isSSE) {
      headers["Content-Type"] = "application/json";
    }

    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
      cache: "no-store",
    };

    // Include body for POST/PUT/PATCH
    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      const body = await request.text();
      if (body) {
        fetchOptions.body = body;
      }
    }

    const response = await fetch(url.toString(), fetchOptions);

    // Check if this is an SSE endpoint
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("text/event-stream") || isSSE) {
      // For SSE, stream the response directly
      if (!response.body) {
        return NextResponse.json(
          { error: "No response body from agent" },
          { status: 502 }
        );
      }

      // Create a ReadableStream that passes through the SSE data
      let controllerClosed = false;
      const reader = response.body!.getReader();

      const stream = new ReadableStream({
        async start(controller) {
          // Handle client disconnect
          request.signal.addEventListener("abort", () => {
            controllerClosed = true;
            reader.cancel().catch(() => {});
            try {
              controller.close();
            } catch {
              // Controller already closed
            }
          });

          try {
            while (!controllerClosed) {
              const { done, value } = await reader.read();
              if (done) break;

              // Pass through the SSE data
              if (!controllerClosed) {
                controller.enqueue(value);
              }
            }
          } catch (error) {
            // Only log if not a normal disconnect
            if (!controllerClosed && !(error instanceof Error && error.name === "AbortError")) {
              console.error("SSE stream error:", error);
            }
          } finally {
            if (!controllerClosed) {
              controllerClosed = true;
              try {
                controller.close();
              } catch {
                // Controller already closed
              }
            }
            reader.releaseLock();
          }
        },
        cancel() {
          controllerClosed = true;
          reader.cancel().catch(() => {});
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // Regular JSON response
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to agent" },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

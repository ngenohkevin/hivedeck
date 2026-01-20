import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/servers - List all servers
export async function GET() {
  try {
    const servers = await prisma.server.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(servers);
  } catch (error) {
    console.error("Error fetching servers:", error);
    return NextResponse.json({ error: "Failed to fetch servers" }, { status: 500 });
  }
}

// POST /api/servers - Create a new server
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, hostname, tailscaleIp, port, apiKey, skipHealthCheck } = body;

    if (!name || !tailscaleIp || !apiKey) {
      return NextResponse.json(
        { error: "Missing required fields: name, tailscaleIp, apiKey" },
        { status: 400 }
      );
    }

    // Check for duplicate tailscaleIp
    const existing = await prisma.server.findUnique({
      where: { tailscaleIp },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A server with this Tailscale IP already exists" },
        { status: 400 }
      );
    }

    // Validate connection to the agent (unless skipped)
    if (!skipHealthCheck) {
      try {
        const healthRes = await fetch(`http://${tailscaleIp}:${port || 8091}/health`, {
          signal: AbortSignal.timeout(5000),
        });
        if (!healthRes.ok) {
          return NextResponse.json(
            { error: "Failed to connect to agent - server responded with error" },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Failed to connect to agent - check IP/hostname and port. Enable 'Skip connection test' if running in Docker." },
          { status: 400 }
        );
      }
    }

    const server = await prisma.server.create({
      data: {
        name,
        hostname: hostname || name,
        tailscaleIp,
        port: port || 8091,
        apiKey,
      },
    });

    return NextResponse.json(server, { status: 201 });
  } catch (error) {
    console.error("Error creating server:", error);
    return NextResponse.json({ error: "Failed to create server" }, { status: 500 });
  }
}

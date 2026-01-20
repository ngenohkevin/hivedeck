import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/servers/:id - Get a specific server
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const server = await prisma.server.findUnique({
      where: { id },
    });

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    return NextResponse.json(server);
  } catch (error) {
    console.error("Error fetching server:", error);
    return NextResponse.json({ error: "Failed to fetch server" }, { status: 500 });
  }
}

// PUT /api/servers/:id - Update a server
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    const server = await prisma.server.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(server);
  } catch (error) {
    console.error("Error updating server:", error);
    return NextResponse.json({ error: "Failed to update server" }, { status: 500 });
  }
}

// DELETE /api/servers/:id - Delete a server
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;

    await prisma.server.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting server:", error);
    return NextResponse.json({ error: "Failed to delete server" }, { status: 500 });
  }
}

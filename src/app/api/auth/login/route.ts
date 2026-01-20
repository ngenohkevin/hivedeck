import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { password } = body;

  const correctPassword = process.env.ADMIN_PASSWORD || "admin";

  if (password !== correctPassword) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.json({ success: true });
}

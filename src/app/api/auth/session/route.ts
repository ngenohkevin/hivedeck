import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData, defaultSession } from "@/lib/session";

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

  return NextResponse.json({
    isLoggedIn: session.isLoggedIn || defaultSession.isLoggedIn,
  });
}

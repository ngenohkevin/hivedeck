import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData, defaultSession } from "@/lib/session";

export async function POST() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.isLoggedIn = defaultSession.isLoggedIn;
  await session.save();

  return NextResponse.json({ success: true });
}

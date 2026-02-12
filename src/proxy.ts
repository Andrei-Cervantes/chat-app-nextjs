import { NextRequest, NextResponse } from "next/server";
import { redis } from "./lib/redis";
import { nanoid } from "nanoid";

export const proxy = async (req: NextRequest) => {
  const pathname = req.nextUrl.pathname;

  const roomMatch = pathname.match(/^\/room\/([^/]+)$/);
  if (!roomMatch) return NextResponse.redirect(new URL("/", req.url));

  const roomId = roomMatch[1];

  const meta = await redis.hgetall(`meta:${roomId}`);

  // redirect to error page if room not found
  if (Object.keys(meta).length === 0) {
    return NextResponse.redirect(new URL("/?error=room-not-found", req.url));
  }

  const connected: string[] = meta.connected ? JSON.parse(meta.connected) : [];
  console.log("Connected users:", connected);
  const existingToken = req.cookies.get("x-auth-token")?.value;

  // if user already has a token, allow them in
  if (existingToken && connected.includes(existingToken)) {
    return NextResponse.next();
  }

  // room is full
  if (connected.length >= 2) {
    return NextResponse.redirect(new URL("/?error=room-full", req.url));
  }

  const response = NextResponse.next();

  const token = nanoid();
  response.cookies.set("x-auth-token", token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  await redis.hset(`meta:${roomId}`, {
    connected: JSON.stringify([...connected, token]),
  });

  return response;
};

export const config = {
  matcher: "/room/:path*",
};

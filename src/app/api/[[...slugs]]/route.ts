import { Elysia } from "elysia";
import { nanoid } from "nanoid";
import { redis } from "@/lib/redis";

const ROOM_TTL_SECONDS = 60 * 10; // 10 minutes

const rooms = new Elysia({ prefix: "/room" }).post("/create", async () => {
  const roomId = nanoid();

  await redis.hset(`meta:${roomId}`, {
    connected: JSON.stringify([]),
    createdAt: Date.now().toString(),
  });

  await redis.expire(`meta:${roomId}`, ROOM_TTL_SECONDS);

  return { roomId };
});

const App = new Elysia({ prefix: "/api" }).use(rooms);

export const GET = App.fetch;
export const POST = App.fetch;

export type App = typeof App;

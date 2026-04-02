// src/app/api/trips/explore/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

// ─── In-memory cache ──────────────────────────────────────────
// Key = query string, Value = { data, expiresAt }
const cache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCacheKey(params: {
  difficulty: string | null;
  sort: string;
  search: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
}): string {
  return JSON.stringify(params);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const difficulty = searchParams.get("difficulty");
    const sort       = searchParams.get("sort") ?? "newest";
    const search     = searchParams.get("search")?.trim() ?? "";
    const location   = searchParams.get("location")?.trim() ?? null;
    const startDate  = searchParams.get("startDate") ?? null;
    const endDate    = searchParams.get("endDate")   ?? null;

    // ── Check cache first ──────────────────────────────────────
    const cacheKey    = getCacheKey({ difficulty, sort, search, location, startDate, endDate });
    const cachedEntry = cache.get(cacheKey);

    if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
      return NextResponse.json(
        { success: true, trips: cachedEntry.data, fromCache: true },
        {
          headers: {
            "Cache-Control": "public, s-maxage=600, stale-while-revalidate=60",
            "X-Cache": "HIT",
          },
        }
      );
    }

    // ── Build where clause ────────────────────────────────────
    const where: any = { isPublic: true };

    // Difficulty filter
    if (difficulty && difficulty !== "All") {
      // MongoDB Prisma enum — must match exactly: EASY, MODERATE, HARD, EXPERT
      where.difficulty = difficulty.toUpperCase();
    }

    // Location filter (server-side)
    if (location) {
      where.location = { contains: location }; // MongoDB: no mode needed, case-sensitive regex
    }

    // Date range filter
    if (startDate) {
      where.startDate = { gte: new Date(startDate) };
    }
    if (endDate) {
      where.endDate = { lte: new Date(endDate) };
    }

    // Search — MongoDB does NOT support mode:"insensitive" on all fields
    // Use regex-style contains without mode, or split into separate conditions
    if (search) {
      where.OR = [
        { title:       { contains: search } },
        { location:    { contains: search } },
        { description: { contains: search } },
      ];
    }

    // ── Sort ──────────────────────────────────────────────────
    // NOTE: "popular" sort removed — no likes field in schema
    // Using currentParticipants as popularity proxy instead
    const orderBy: any =
      sort === "newest"   ? { createdAt: "desc" }
      : sort === "oldest" ? { createdAt: "asc"  }
      : sort === "popular"? { currentParticipants: "desc" } // most joined = most popular
      : sort === "spots"  ? { maxParticipants: "desc"     }
      : { createdAt: "desc" }; // default

    // ── Query ─────────────────────────────────────────────────
    const trips = await prisma.trip.findMany({
      where,
      orderBy,
      take: 50, // limit results for performance
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        startDate: true,
        endDate: true,
        difficulty: true,
        maxParticipants: true,
        currentParticipants: true,
        images: true,
        isPublic: true,
        participants: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // ── Store in cache ────────────────────────────────────────
    cache.set(cacheKey, {
      data:      trips,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    // Auto-cleanup old cache entries (keep memory tidy)
    if (cache.size > 200) {
      const now = Date.now();
      for (const [key, entry] of cache.entries()) {
        if (entry.expiresAt < now) cache.delete(key);
      }
    }

    return NextResponse.json(
      { success: true, trips, fromCache: false },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=60",
          "X-Cache": "MISS",
        },
      }
    );
  } catch (error: any) {
    console.error("Explore API error:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
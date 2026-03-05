import { NextRequest, NextResponse } from "next/server";

function fallbackTitleFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const slug = u.pathname.split("/").filter(Boolean).pop() || "";
    return slug
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase())
      .slice(0, 120);
  } catch {
    return "";
  }
}

function extractMeta(html: string): string {
  const patterns = [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:title["'][^>]*>/i,
    /<title[^>]*>([^<]*)<\/title>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    const title = (match?.[1] || "").replace(/\s+/g, " ").trim();
    if (title) return title;
  }

  return "";
}

export async function POST(req: NextRequest) {
  try {
    const { url } = (await req.json()) as { url?: string };
    if (!url) return NextResponse.json({ title: "" }, { status: 200 });

    const fallback = fallbackTitleFromUrl(url);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 ProposalTrackerBot/1.0" },
      });

      clearTimeout(timeout);
      if (!res.ok) return NextResponse.json({ title: fallback }, { status: 200 });

      const html = await res.text();
      const title = extractMeta(html);
      return NextResponse.json({ title: title || fallback }, { status: 200 });
    } catch {
      clearTimeout(timeout);
      return NextResponse.json({ title: fallback }, { status: 200 });
    }
  } catch {
    return NextResponse.json({ title: "" }, { status: 200 });
  }
}

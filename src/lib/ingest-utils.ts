export function verifyIngestAuth(req: Request): Response | null {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.INGEST_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}

export function sourceLabel(platform: string): string {
  const map: Record<string, string> = {
    devto: "Dev.to",
    hackernews: "Hacker News",
    github: "GitHub",
    producthunt: "Product Hunt",
  };
  return map[platform] ?? platform;
}

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET() {
  const raw = process.env.DATABASE_URL || "";
  let parsed: URL | null = null;

  try {
    parsed = new URL(raw);
  } catch {}

  const username = parsed?.username || "";
  const host = parsed?.hostname || "";
  const port = parsed?.port || "";
  const hasPassword = Boolean(parsed?.password);
  const pgbouncer = parsed?.searchParams.get("pgbouncer") === "true";

  const config = {
    databaseUrlPresent: Boolean(raw),
    passwordPresent: hasPassword,
    usernamePrefix: username.startsWith("postgres.") ? "postgres.<project-ref>" : username || "(missing)",
    poolerHost: host.endsWith(".pooler.supabase.com"),
    port,
    pgbouncer,
  };

  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, config });
  } catch (error: any) {
    const message = String(error?.message || "Unknown database error");
    let category = "unknown";
    if (/authentication failed|credentials.*not valid|password authentication/i.test(message)) category = "authentication";
    else if (/tenant or user not found/i.test(message)) category = "tenant-or-user";
    else if (/timed out|timeout|ETIMEDOUT|ECONNREFUSED/i.test(message)) category = "network";
    else if (/ENOTFOUND|getaddrinfo/i.test(message)) category = "host";
    else if (/P1001/i.test(message)) category = "unreachable";
    return NextResponse.json({ ok: false, category, config }, { status: 503 });
  }
}

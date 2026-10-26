import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { cronEnv } from "@/server/env";
import { JOBS, runJob, type JobName } from "@/server/jobs";

export const maxDuration = 60;

function authorised(request: Request): boolean {
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${cronEnv().CRON_SECRET}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Vercel Cron llama por GET con `Authorization: Bearer $CRON_SECRET`.
export async function GET(request: Request, ctx: RouteContext<"/api/jobs/[job]">) {
  if (!authorised(request)) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const { job } = await ctx.params;
  if (!JOBS.includes(job as JobName)) return NextResponse.json({ error: "unknown job" }, { status: 404 });
  try {
    return NextResponse.json({ job, ...(await runJob(job as JobName)) });
  } catch (e) {
    console.error("[job] failed:", job, e instanceof Error ? e.message : "unknown");
    return NextResponse.json({ error: "job failed" }, { status: 500 });
  }
}

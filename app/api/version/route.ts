import { NextResponse } from "next/server";
import { getBuildVersion } from "@/lib/version";

export const dynamic = "force-static";

/**
 * GET /api/version → מידע על הגרסה החיה
 *
 * שימוש: לבדוק אם deploy חדש עלה לאחר merge.
 * curl https://tora-live.co.il/api/version
 */
export async function GET() {
  const v = getBuildVersion();
  return NextResponse.json({
    ok: true,
    commit: v.commit,
    commitShort: v.commitShort,
    commitMessage: v.commitMessage,
    branch: v.branch,
    env: v.env,
    buildTime: v.buildTime,
  });
}

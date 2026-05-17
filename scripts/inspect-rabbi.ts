import { db } from "@/lib/db";
async function main() {
  const slug = process.argv[2];
  const r = await db.rabbi.findUnique({
    where: { slug },
    include: {
      lessons: {
        select: { id: true, title: true, scheduledAt: true, isPublic: true, approvalStatus: true, isSuspended: true, broadcastType: true, streamId: true, isLive: true },
        orderBy: { scheduledAt: "desc" },
      },
    },
  });
  if (!r) { console.log("rabbi not found"); return; }
  console.log(`rabbi: ${r.name} | status: ${r.status} | blocked: ${r.isBlocked}`);
  console.log(`total lessons: ${r.lessons.length}`);
  r.lessons.forEach((l) =>
    console.log(` - ${l.title} | ${l.scheduledAt.toISOString().slice(0, 16)} | public:${l.isPublic} | approval:${l.approvalStatus} | susp:${l.isSuspended} | type:${l.broadcastType} | streamId:${l.streamId ? "yes" : "no"} | live:${l.isLive}`),
  );
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

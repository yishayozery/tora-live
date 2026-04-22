"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ExternalLink, CheckCircle2, XCircle, Shield, ShieldCheck, AlertTriangle, Facebook, Youtube, Clock } from "lucide-react";

type Candidate = {
  id: string;
  name: string;
  platform: string;
  handle: string | null;
  channelUrl: string | null;
  facebookUrl: string | null;
  category: string;
  priority: number;
  content: string | null;
  concerns: string | null;
  recommendedStatus: string;
  reviewStatus: string;
  reviewNotes: string | null;
  approvedSourceId: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  yeshiva: "ישיבה",
  rabbi: "רב",
  midrasha: "מדרשה",
  org: "ארגון",
  facebook_only: "Facebook",
};

const RECOMMENDED_LABELS: Record<string, { label: string; color: string }> = {
  approve_trusted: { label: "מומלץ: אישור מהימן", color: "text-live" },
  approve_pending: { label: "מומלץ: אישור + בדיקה ידנית לכל שיעור", color: "text-primary" },
  verify: { label: "מומלץ: לאמת ידנית", color: "text-gold" },
  reject: { label: "מומלץ: דחייה", color: "text-danger" },
};

export function CandidateRow({ candidate }: { candidate: Candidate }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function action(action: "approve_trusted" | "approve_pending" | "reject" | "defer" | "reopen") {
    setError(null);
    setBusy(action);
    const res = await fetch(`/api/admin/candidates/${candidate.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setError(data?.error || "שגיאה");
      return;
    }
    router.refresh();
  }

  const rec = RECOMMENDED_LABELS[candidate.recommendedStatus] ?? { label: candidate.recommendedStatus, color: "text-ink-muted" };
  const isPending = candidate.reviewStatus === "PENDING";
  const isApproved = candidate.reviewStatus === "APPROVED";
  const isRejected = candidate.reviewStatus === "REJECTED";

  // בניית URL לצפייה
  const youtubeUrl = candidate.handle
    ? (candidate.handle.startsWith("@") || candidate.handle.startsWith("channel/") || candidate.handle.startsWith("user/") || candidate.handle.startsWith("youtube.com"))
      ? (candidate.handle.startsWith("youtube.com") || candidate.handle.startsWith("http") ? `https://${candidate.handle.replace(/^https?:\/\//, "")}` : `https://www.youtube.com/${candidate.handle}`)
      : null
    : null;
  const facebookUrl = candidate.facebookUrl ? `https://${candidate.facebookUrl.replace(/^https?:\/\//, "")}` : null;

  return (
    <Card className={
      isApproved ? "border-live/40 bg-live/5"
      : isRejected ? "border-danger/30 bg-danger/5 opacity-70"
      : candidate.priority === 1 ? "border-primary/30"
      : ""
    }>
      <div className="flex flex-col sm:flex-row items-start gap-4">
        {/* Main info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="font-bold text-ink">{candidate.name}</span>

            <span className="text-xs px-2 py-0.5 rounded-full bg-paper-soft text-ink-soft border border-border">
              {CATEGORY_LABELS[candidate.category] ?? candidate.category}
            </span>

            {candidate.priority === 1 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-soft text-primary">עדיפות 1</span>
            )}
            {candidate.priority === 3 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-paper-warm text-ink-muted">עדיפות 3</span>
            )}

            {isApproved && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-live bg-live/10 border border-live/30 rounded-full px-2 py-0.5">
                <CheckCircle2 className="w-3 h-3" /> אושר
              </span>
            )}
            {isRejected && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger bg-danger/10 border border-danger/30 rounded-full px-2 py-0.5">
                <XCircle className="w-3 h-3" /> נדחה
              </span>
            )}
          </div>

          {/* Recommended */}
          <div className={`text-xs font-medium mb-2 ${rec.color}`}>💡 {rec.label}</div>

          {/* Content description */}
          {candidate.content && (
            <p className="text-sm text-ink-soft mb-2">{candidate.content}</p>
          )}

          {/* Concerns */}
          {candidate.concerns && (
            <div className="flex items-start gap-1.5 text-xs text-gold bg-gold-soft/40 border border-gold/20 rounded-btn px-2 py-1.5 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{candidate.concerns}</span>
            </div>
          )}

          {/* Links */}
          <div className="flex items-center gap-3 text-xs text-ink-muted flex-wrap">
            {youtubeUrl && (
              <a href={youtubeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-danger hover:underline">
                <Youtube className="w-3.5 h-3.5" />
                {candidate.handle}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {facebookUrl && (
              <a href={facebookUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#1877F2] hover:underline">
                <Facebook className="w-3.5 h-3.5" />
                Facebook
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {!youtubeUrl && !facebookUrl && (
              <span className="italic">אין URL מזוהה — לאמת ידנית ב-YouTube</span>
            )}
          </div>

          {error && (
            <div className="mt-2 text-sm text-danger bg-danger/10 border border-danger/30 rounded-btn px-3 py-1.5">
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
          {isPending && (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={() => action("approve_trusted")}
                disabled={!!busy}
                title="אישור + פרסום אוטומטי של שיעורים"
              >
                <ShieldCheck className="w-3 h-3" />
                {busy === "approve_trusted" ? "..." : "אשר — מהימן"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => action("approve_pending")}
                disabled={!!busy}
                title="אישור — שיעורים ממתינים לאישור ידני"
              >
                <Shield className="w-3 h-3" />
                {busy === "approve_pending" ? "..." : "אשר — בדיקה ידנית"}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => action("reject")}
                disabled={!!busy}
              >
                <XCircle className="w-3 h-3" />
                {busy === "reject" ? "..." : "דחה"}
              </Button>
              <button
                onClick={() => action("defer")}
                disabled={!!busy}
                className="text-xs text-ink-muted hover:text-ink"
              >
                דחה להחלטה
              </button>
            </>
          )}

          {(isApproved || isRejected) && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => action("reopen")}
              disabled={!!busy}
            >
              <Clock className="w-3 h-3" />
              {busy === "reopen" ? "..." : "פתח מחדש"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

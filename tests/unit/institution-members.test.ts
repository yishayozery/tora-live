// בדיקות ל-API של חברי מוסד: POST /api/institutions/[slug]/members
// מוודא auth (רכז בלבד), upsert על role, 404 על אימייל לא רשום.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/db", () => {
  const institution = { findUnique: vi.fn() };
  const institutionMember = {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  };
  const user = { findUnique: vi.fn() };
  return { db: { institution, institutionMember, user } };
});

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { POST as POST_MEMBER } from "@/app/api/institutions/[slug]/members/route";

function req(body: any): Request {
  return new Request("http://localhost/api/institutions/y-a/members", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.ADMIN_EMAIL;
});

describe("POST /api/institutions/[slug]/members", () => {
  it("401 when not authenticated", async () => {
    (getServerSession as any).mockResolvedValueOnce(null);
    const res = await POST_MEMBER(req({ email: "x@y.com" }), { params: { slug: "y-a" } });
    expect(res.status).toBe(401);
  });

  it("403 when caller is not a RAKAZ", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1", email: "x@y.com" } });
    (db.institution.findUnique as any).mockResolvedValueOnce({ id: "I1" });
    (db.institutionMember.findUnique as any).mockResolvedValueOnce({ role: "RABBI" });
    const res = await POST_MEMBER(req({ email: "rabbi@y.com" }), { params: { slug: "y-a" } });
    expect(res.status).toBe(403);
  });

  it("400 on invalid email", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1", email: "x@y.com" } });
    (db.institution.findUnique as any).mockResolvedValueOnce({ id: "I1" });
    (db.institutionMember.findUnique as any).mockResolvedValueOnce({ role: "RAKAZ" });
    const res = await POST_MEMBER(req({ email: "not-an-email" }), { params: { slug: "y-a" } });
    expect(res.status).toBe(400);
  });

  it("404 when target user doesn't exist", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1", email: "x@y.com" } });
    (db.institution.findUnique as any).mockResolvedValueOnce({ id: "I1" });
    (db.institutionMember.findUnique as any).mockResolvedValueOnce({ role: "RAKAZ" });
    (db.user.findUnique as any).mockResolvedValueOnce(null);
    const res = await POST_MEMBER(req({ email: "nobody@y.com" }), { params: { slug: "y-a" } });
    expect(res.status).toBe(404);
  });

  it("200 — upserts member with default role RABBI", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1", email: "x@y.com" } });
    (db.institution.findUnique as any).mockResolvedValueOnce({ id: "I1" });
    (db.institutionMember.findUnique as any).mockResolvedValueOnce({ role: "RAKAZ" });
    (db.user.findUnique as any).mockResolvedValueOnce({ id: "U2", email: "rabbi@y.com" });
    (db.institutionMember.upsert as any).mockResolvedValueOnce({ id: "M1", role: "RABBI" });
    const res = await POST_MEMBER(req({ email: "rabbi@y.com" }), { params: { slug: "y-a" } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.role).toBe("RABBI");
  });

  it("200 — promotes existing member to RAKAZ", async () => {
    (getServerSession as any).mockResolvedValueOnce({ user: { id: "U1", email: "x@y.com" } });
    (db.institution.findUnique as any).mockResolvedValueOnce({ id: "I1" });
    (db.institutionMember.findUnique as any).mockResolvedValueOnce({ role: "RAKAZ" });
    (db.user.findUnique as any).mockResolvedValueOnce({ id: "U2", email: "co-rakaz@y.com" });
    (db.institutionMember.upsert as any).mockImplementationOnce(async ({ create, update }: any) => ({
      id: "M2",
      role: update.role,
    }));
    const res = await POST_MEMBER(req({ email: "co-rakaz@y.com", role: "RAKAZ" }), { params: { slug: "y-a" } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.role).toBe("RAKAZ");
  });
});

import { ImageResponse } from "next/og";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "TORA_LIVE — דף הרב";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: { slug: string } }) {
  const rabbi = await db.rabbi.findUnique({
    where: { slug: params.slug },
    select: { name: true, bio: true, photoUrl: true },
  });

  const name = rabbi?.name ?? "רב";
  const bio = (rabbi?.bio ?? "שיעורי תורה בשידור חי").slice(0, 120);
  const photo = rabbi?.photoUrl && !rabbi.photoUrl.startsWith("data:") ? rabbi.photoUrl : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1E40AF 0%, #0B2A6B 100%)",
          color: "#fff",
          fontFamily: "sans-serif",
          padding: 60,
          textAlign: "center",
        }}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={name}
            width={220}
            height={220}
            style={{
              borderRadius: 9999,
              objectFit: "cover",
              border: "6px solid #B8862F",
              marginBottom: 32,
            }}
          />
        ) : (
          <div
            style={{
              width: 220,
              height: 220,
              borderRadius: 9999,
              background: "rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 120,
              border: "6px solid #B8862F",
              marginBottom: 32,
            }}
          >
            {name.charAt(0)}
          </div>
        )}
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>
          הרב {name}
        </div>
        <div
          style={{
            fontSize: 32,
            marginTop: 24,
            color: "#F5E6C8",
            maxWidth: 900,
            lineHeight: 1.3,
          }}
        >
          {bio}
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 28,
            color: "#B8862F",
            letterSpacing: 4,
            fontWeight: 600,
          }}
        >
          TORA_LIVE
        </div>
      </div>
    ),
    { ...size }
  );
}

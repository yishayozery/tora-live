"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { HandHeart, Receipt } from "lucide-react";

type MyDonation = {
  id: string;
  amount: number;
  donorName: string;
  dedicationName: string | null;
  dedicationType: string | null;
  receiptSent: boolean;
  createdAt: string;
};

export default function DonationsPage() {
  const [donations, setDonations] = useState<MyDonation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/me/donations");
        if (res.ok) setDonations(await res.json());
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function formatDate(dateStr: string) {
    return new Intl.DateTimeFormat("he-IL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr));
  }

  function formatAmount(amountInCents: number) {
    return `${(amountInCents / 100).toLocaleString("he-IL")} \u20AA`;
  }

  function formatDedication(type: string | null, name: string | null) {
    if (!type || !name) return null;
    const typeLabel = type === "LEZEKHER" ? "לזכר" : type === "LEZEKHUT" ? "לזכות" : type;
    return `${typeLabel} ${name}`;
  }

  if (loading) {
    return <div className="text-center py-10 text-ink-muted">טוען תרומות...</div>;
  }

  return (
    <div>
      <h1 className="hebrew-serif text-2xl font-bold flex items-center gap-2 mb-6">
        <HandHeart className="w-6 h-6 text-primary" /> התרומות שלי
      </h1>

      {donations.length === 0 ? (
        <Card className="text-center py-8">
          <CardDescription className="mb-4">עדיין לא ביצעת תרומות.</CardDescription>
          <Link href="/donate">
            <Button className="gap-2">
              <HandHeart className="w-4 h-4" /> תרום עכשיו
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {donations.map((d) => {
            const dedication = formatDedication(d.dedicationType, d.dedicationName);
            return (
              <Card key={d.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-lg">{formatAmount(d.amount)}</div>
                    <div className="text-xs text-ink-muted mt-1">{formatDate(d.createdAt)}</div>
                    {dedication && (
                      <div className="text-sm text-ink-soft mt-1">{dedication}</div>
                    )}
                  </div>
                  <div className="shrink-0">
                    {d.receiptSent ? (
                      <span className="text-xs bg-live/10 text-live px-2 py-1 rounded-full flex items-center gap-1">
                        <Receipt className="w-3 h-3" /> קבלה נשלחה
                      </span>
                    ) : (
                      <span className="text-xs bg-gold/10 text-gold px-2 py-1 rounded-full flex items-center gap-1">
                        <Receipt className="w-3 h-3" /> ממתין לקבלה
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          <div className="text-center pt-4">
            <Link href="/donate">
              <Button variant="secondary" className="gap-2">
                <HandHeart className="w-4 h-4" /> תרום שוב
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

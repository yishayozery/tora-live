// אירועים פנימיים — hook-bus קטן ל-side-effects אחרי יצירת שיעור.
// שימוש עתידי: תמלול Whisper, סיכום AI, תיוג אוטומטי.

export type ShiurCreatedEvent = {
  lesson: {
    id: string;
    rabbiId: string | null;
    title: string;
    recordingUrl: string | null;
  };
};

type Handler = (e: ShiurCreatedEvent) => Promise<void> | void;

const handlers: Handler[] = [];

export function onShiurCreated(handler: Handler): void {
  handlers.push(handler);
}

export async function emitShiurCreated(e: ShiurCreatedEvent): Promise<void> {
  for (const h of handlers) {
    try {
      await h(e);
    } catch (err) {
      console.error("[events] onShiurCreated handler failed:", err);
    }
  }
}

// handler ברירת מחדל — לוג בלבד, בעתיד נחליף בתמלול וכו'.
onShiurCreated((e) => {
  console.log("[events] shiur created:", e.lesson.id, e.lesson.title);
});

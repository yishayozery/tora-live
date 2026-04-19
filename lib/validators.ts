import { z } from "zod";
import { BROADCAST_TYPE_VALUES } from "@/lib/enums";

export const loginSchema = z.object({
  email: z.string().email("מייל לא תקין"),
  password: z.string().min(6, "סיסמה חייבת להכיל לפחות 6 תווים"),
});

export const studentRegisterSchema = z.object({
  name: z.string().min(2, "שם קצר מדי"),
  email: z.string().email("מייל לא תקין"),
  password: z.string().min(6, "סיסמה חייבת להכיל לפחות 6 תווים"),
});

export const rabbiRegisterSchema = z.object({
  name: z.string().min(2, "שם קצר מדי"),
  email: z.string().email("מייל לא תקין"),
  password: z.string().min(6, "סיסמה חייבת להכיל לפחות 6 תווים"),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]*$/, "טלפון לא תקין")
    .optional()
    .or(z.literal("")),
  photoUrl: z
    .string()
    .max(800_000, "התמונה גדולה מדי (מקסימום 600KB)")
    .refine(
      (v) => !v || /^https?:\/\//.test(v) || /^data:image\/(jpeg|png|webp|gif);base64,/.test(v),
      "כתובת תמונה לא תקינה"
    )
    .optional()
    .or(z.literal("")),
});

export const mediaLinksSchema = z.object({
  youtube: z.string().url().optional().or(z.literal("")),
  spotify: z.string().url().optional().or(z.literal("")),
  applePodcast: z.string().url().optional().or(z.literal("")),
  soundcloud: z.string().url().optional().or(z.literal("")),
  facebook: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  other: z.string().url().optional().or(z.literal("")),
});
export type MediaLinks = z.infer<typeof mediaLinksSchema>;

export const rabbiProfileSchema = z.object({
  bio: z.string().min(20, "תיאור קצר מדי — לפחות 20 תווים"),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "כתובת באנגלית באותיות קטנות ומקפים בלבד")
    .optional(),
  media: mediaLinksSchema.optional(),
});

export const lessonSchema = z.object({
  title: z.string().min(3, "כותרת קצרה מדי"),
  description: z.string().min(5, "תיאור קצר מדי"),
  categoryId: z.string().optional().nullable(),
  scheduledAt: z.string().datetime().or(z.date()),
  durationMin: z.coerce.number().int().positive().optional(),
  language: z
    .enum(["he", "en", "yi", "ladino", "fr", "es", "ru", "other"])
    .optional(),
  broadcastType: z.enum(BROADCAST_TYPE_VALUES).optional(),
  youtubeUrl: z.string().url().optional().or(z.literal("")),
  spotifyUrl: z.string().url().optional().or(z.literal("")),
  applePodcastUrl: z.string().url().optional().or(z.literal("")),
  soundcloudUrl: z.string().url().optional().or(z.literal("")),
  otherUrl: z.string().url().optional().or(z.literal("")),
  sourcesPdfUrl: z.string().url().optional().or(z.literal("")),
  syncToCalendar: z.boolean().optional(),
  isLive: z.boolean().optional(),
  liveEmbedUrl: z.string().url().optional().or(z.literal("")),
  locationName: z.string().max(200).optional().or(z.literal("")),
  locationUrl: z.string().url().optional().or(z.literal("")),
  isPublic: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  recurringRule: z
    .object({
      freq: z.enum(["DAILY", "WEEKLY"]),
      dayOfWeek: z.number().int().min(0).max(6).optional(),
      hour: z.number().int().min(0).max(23),
      minute: z.number().int().min(0).max(59),
      endDate: z.string().optional(),
    })
    .optional()
    .nullable(),
});

export const categorySchema = z.object({
  name: z.string().min(2, "שם קטגוריה קצר מדי").max(50),
});

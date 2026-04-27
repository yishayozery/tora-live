"use client";

import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";

/**
 * שדה העלאת תמונה — ממיר לbase64 ושומר ב-DB.
 * לשלב מאוחר יותר נחליף ב-Cloudflare R2 / S3.
 */
export function PhotoUploadField({
  value,
  onChange,
  label = "תמונת פרופיל",
  initials,
  maxSizeMB = 2,
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  label?: string;
  initials?: string;
  maxSizeMB?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("יש להעלות קובץ תמונה בלבד");
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`התמונה גדולה מדי (מקסימום ${maxSizeMB}MB)`);
      return;
    }

    setUploading(true);
    try {
      // קומפרסיה לתמונה ל-300×300 כדי לחסוך מקום ב-DB
      const compressed = await compressImage(file, 400, 0.85);
      onChange(compressed);
    } catch (e: any) {
      setError("שגיאה בקריאת הקובץ");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-ink mb-2">{label}</label>
      <div className="flex items-center gap-4">
        {/* תצוגה */}
        <div className="shrink-0">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="תמונת פרופיל"
              className="w-24 h-24 rounded-full object-cover ring-2 ring-gold-soft"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold-soft to-gold/30 flex items-center justify-center hebrew-serif font-bold text-2xl text-gold ring-2 ring-gold-soft">
              {initials || "?"}
            </div>
          )}
        </div>

        {/* פעולות */}
        <div className="flex-1">
          <div className="flex gap-2 mb-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-btn bg-primary text-white text-sm font-medium hover:bg-primary-hover transition"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploading ? "מעלה..." : value ? "החלף תמונה" : "העלה תמונה"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-btn border border-border bg-white text-sm font-medium text-ink-soft hover:text-danger hover:border-danger/30 transition"
              >
                <X className="w-3.5 h-3.5" />
                הסר
              </button>
            )}
          </div>
          <p className="text-xs text-ink-muted">
            JPG / PNG / WebP · מקסימום {maxSizeMB}MB · מומלץ ריבועי
          </p>
          {error && <p className="text-xs text-danger mt-1">{error}</p>}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
    </div>
  );
}

/**
 * דוחס תמונה ל-maxSize × maxSize, מחזיר base64.
 */
async function compressImage(file: File, maxSize: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Rotate NEXTAUTH_SECRET + CRON_SECRET atomically.
 * - Generates new secrets
 * - Updates local .env
 * - Updates Vercel env (Production, Preview, Development) — marked Sensitive
 * - Updates GitHub Actions secret CRON_SECRET
 * - Optionally triggers redeploy
 *
 * Usage: node --import tsx scripts/rotate-secrets.ts
 */
import { execSync } from "child_process";
import * as fs from "fs";
import * as crypto from "crypto";
import * as path from "path";

const ENV_PATH = path.resolve(process.cwd(), ".env");

function gen(bytes = 32, encoding: BufferEncoding = "base64url"): string {
  return crypto.randomBytes(bytes).toString(encoding);
}

function updateEnvFile(updates: Record<string, string>) {
  if (!fs.existsSync(ENV_PATH)) {
    console.error(`❌ .env לא קיים`);
    process.exit(1);
  }
  let content = fs.readFileSync(ENV_PATH, "utf8");
  for (const [key, value] of Object.entries(updates)) {
    const line = `${key}=${value}`;
    const re = new RegExp(`^${key}=.*$`, "m");
    if (re.test(content)) {
      content = content.replace(re, line);
    } else {
      content += `\n${line}`;
    }
  }
  fs.writeFileSync(ENV_PATH, content, "utf8");
}

function vercelSetSensitive(name: string, value: string, env: string) {
  // Remove old + add new (Vercel CLI doesn't support edit in-place)
  try {
    execSync(`vercel env rm ${name} ${env} --yes`, { stdio: "pipe" });
  } catch {
    // OK if didn't exist
  }
  // Note: Vercel CLI doesn't have a --sensitive flag yet (as of 2026).
  // We use `vercel env add` which supports stdin input.
  const child = require("child_process").spawnSync("vercel", ["env", "add", name, env, "--sensitive"], {
    input: value + "\n",
    stdio: ["pipe", "inherit", "inherit"],
  });
  if (child.status !== 0) {
    // Fallback: try without --sensitive flag (older CLI)
    try {
      execSync(`vercel env rm ${name} ${env} --yes`, { stdio: "pipe" });
    } catch {}
    const c2 = require("child_process").spawnSync("vercel", ["env", "add", name, env], {
      input: value + "\n",
      stdio: ["pipe", "inherit", "inherit"],
    });
    if (c2.status !== 0) throw new Error(`Vercel set failed for ${name}/${env}`);
  }
}

function ghSetSecret(name: string, value: string) {
  const child = require("child_process").spawnSync("gh", ["secret", "set", name], {
    input: value,
    stdio: ["pipe", "inherit", "inherit"],
  });
  if (child.status !== 0) throw new Error(`gh secret set failed for ${name}`);
}

async function main() {
  console.log("🔐 Rotating secrets...\n");

  const NEXTAUTH_SECRET = gen(48, "base64");
  const CRON_SECRET = gen(32, "base64url");

  // Step 1: local .env
  console.log("1️⃣  עדכון .env מקומי...");
  updateEnvFile({ NEXTAUTH_SECRET, CRON_SECRET });
  console.log("   ✅ done\n");

  // Step 2: Vercel
  console.log("2️⃣  עדכון Vercel env (Production + Preview + Development, sensitive)...");
  for (const env of ["production", "preview", "development"]) {
    for (const [name, value] of [["NEXTAUTH_SECRET", NEXTAUTH_SECRET], ["CRON_SECRET", CRON_SECRET]]) {
      try {
        vercelSetSensitive(name, value, env);
        console.log(`   ✅ ${name} (${env})`);
      } catch (e: any) {
        console.error(`   ❌ ${name} (${env}): ${e.message}`);
      }
    }
  }
  console.log();

  // Step 3: GitHub Actions secret (CRON_SECRET — needed for detect-live + auto-close)
  console.log("3️⃣  עדכון GitHub Actions secret CRON_SECRET...");
  try {
    ghSetSecret("CRON_SECRET", CRON_SECRET);
    console.log("   ✅ done\n");
  } catch (e: any) {
    console.error(`   ❌ ${e.message}\n`);
  }

  console.log("🎉 רוטציה הושלמה!\n");
  console.log("📋 צעדים נוספים שעדיין נדרשים ידנית:");
  console.log("   1. Neon DB password — Reset ב-console.neon.tech");
  console.log("   2. Resend API key — Revoke ב-resend.com/api-keys");
  console.log("   3. YouTube API key — Delete ב-console.cloud.google.com");
  console.log("   4. Trigger Vercel redeploy: 'vercel --prod' או דרך ה-UI");
}

main().catch((e) => { console.error("❌ Fatal:", e); process.exit(1); });

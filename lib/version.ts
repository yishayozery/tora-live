/**
 * Build version metadata — מבוסס על ENV של Vercel.
 * תקף בכל סביבה: Production / Preview / Local.
 */
export function getBuildVersion() {
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA ?? "local";
  const commitShort = commitSha.slice(0, 7);
  const commitMessage = process.env.VERCEL_GIT_COMMIT_MESSAGE ?? "";
  const branch = process.env.VERCEL_GIT_COMMIT_REF ?? "local";
  const env = process.env.VERCEL_ENV ?? "development";
  // Vercel doesn't provide a build timestamp env var directly,
  // but BUILD_TIME is injected at build time below
  const buildTime = process.env.BUILD_TIME ?? new Date().toISOString();

  return {
    commit: commitSha,
    commitShort,
    commitMessage: commitMessage.split("\n")[0],
    branch,
    env,
    buildTime,
    /** Display string: "2026-05-01 · 3852af8" */
    display: `${buildTime.slice(0, 10)} · ${commitShort}`,
  };
}

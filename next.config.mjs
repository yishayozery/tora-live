/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000", "tora-live.co.il"] },
  },
  env: {
    // מוטמע בזמן build, נחשף ל-server וגם ל-client
    BUILD_TIME: new Date().toISOString(),
  },
  async headers() {
    const commit = (process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 7);
    const buildTime = new Date().toISOString().slice(0, 10);
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Build-Version", value: `${buildTime}.${commit}` },
        ],
      },
    ];
  },
};
export default nextConfig;

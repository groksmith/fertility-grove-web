import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// The API origin the browser calls (`src/config/env.ts` reads the same variable).
const apiOrigin = new URL(process.env.NEXT_PUBLIC_API_URL || "https://api.fertilitygrove.click")
  .origin;
// Google Identity Services: its script, its sign-in iframe and its token endpoint.
const google = "https://accounts.google.com";

// ⚠️ **Content-Security-Policy — every origin here is one the app really loads from; add, don't
// widen.** A page that breaks after a change to this list is showing a CSP violation in the console.
//   · Fonts are self-hosted by `next/font`, and every image and film is under `public/assets/`.
//     `connect-src` adds exactly the API origin (from NEXT_PUBLIC_API_URL) and Google sign-in.
//   · `'unsafe-inline'` on scripts is a known gap, not an oversight: Next's hydration payload is
//     inline, and a nonce would make every page dynamically rendered.
//   · Dev only: `'unsafe-eval'` (React Refresh) and `ws:` for hot reload.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${google}/gsi/client${isDev ? " 'unsafe-eval'" : ""}`,
  `style-src 'self' 'unsafe-inline' ${google}/gsi/style`,
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin} ${google}/gsi/${isDev ? " ws:" : ""}`,
  `frame-src ${google}/gsi/`,
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]),
  // Legacy twin of `frame-ancestors 'none'` for browsers that predate CSP level 2.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // No surface uses these. Clipboard (copy invite and share links) is not listed, so it keeps its
  // default of this origin only.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  // The deploys (`.github/workflows/deploy.*.yaml`) zip `.next/standalone` with `runserver.sh` for
  // AWS Lambda, and sync `.next/static` + `public/assets` to S3 behind CloudFront — as pharos-web.
  output: "standalone",
  // ⚠️ **`next build` and `next dev` share `.next/` by default, and the build wins.** A verification
  // build while a dev server is up overwrites the manifests that server holds open: every route
  // answers 500 and the CSS 404s. `yarn build:check` sets NEXT_DIST_DIR=.next-check to build
  // beside it instead. Unset, nothing changes.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  devIndicators: false,
  // Cache Components (the kit's default) is OFF here: every screen is a client component reading
  // localStorage, so the member layout's `usePathname()` would need new <Suspense> boundaries (and
  // their fallbacks) to prerender. Revisit when the backend lands and data moves to the server.
  reactStrictMode: true,
  // 90 for the painted backdrops, which soften visibly at the default 75.
  images: { qualities: [75, 90] },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Home was renamed Feed, and the profile now lives on the Dashboard. Old
  // links and bookmarks still land; query strings (?edit=1) pass through.
  async redirects() {
    return [
      { source: "/home", destination: "/feed", permanent: false },
      { source: "/profile", destination: "/dashboard", permanent: false },
      // Routes the API's emails link to (api-handoff: account deletion, notifications).
      { source: "/sign-in", destination: "/login", permanent: false },
      {
        source: "/settings/notifications",
        destination: "/settings#notifications",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

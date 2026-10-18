declare const process: { env: Record<string, string | undefined> }

// Fake data is only for local work. A production build without Supabase keys must fail loudly, never show fake data.
const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_KEY)
const useMock = process.env.USE_MOCK === "1" || (process.env.NODE_ENV !== "production" && !hasSupabase)

const securityHeaders = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co",
    "manifest-src 'self'",
    "worker-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; "),
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(self), microphone=(), geolocation=(), publickey-credentials-get=(self), publickey-credentials-create=(self)",
};

import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  ssr: false,
  devtools: { enabled: true },
  modules: ["shadcn-nuxt", "@vite-pwa/nuxt", "@nuxtjs/color-mode", "@vueuse/nuxt", "@nuxt/fonts"],
  fonts: { families: [{ name: "Hanken Grotesk", provider: "google", weights: [400, 500, 600] }] },
  components: [{ path: "~/components/app", pathPrefix: false }],
  css: ["~/assets/css/tailwind.css"],
  colorMode: { preference: "system", classSuffix: "" },
  shadcn: { prefix: "", componentDir: "./app/components/ui" },
  nitro: { prerender: { routes: ["/"] }, vercel: { functions: { maxDuration: 60 } }, routeRules: { "/**": { headers: securityHeaders } } },
  runtimeConfig: {
    public: {
      useMock,
      supabaseUrl: process.env.SUPABASE_URL ?? "",
      supabaseKey: process.env.SUPABASE_KEY ?? "",
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: "en" },
      title: "Wallet Wyse",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { key: "theme-color", name: "theme-color", content: "#F5F5F7" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-title", content: "Wallet Wyse" },
        { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      ],
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/icon.svg" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      ],
    },
  },
  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "Wallet Wyse",
      short_name: "Wallet Wyse",
      description: "Expenses, savings and investments for two.",
      display: "standalone",
      start_url: "/",
      theme_color: "#F5F5F7",
      background_color: "#F5F5F7",
      icons: [
        { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
        { src: "pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    workbox: {
      navigateFallback: "/",
      navigateFallbackDenylist: [/^\/api\//],
      globPatterns: ["**/*.{js,css,html,png,svg,ico,woff2}"],
      runtimeCaching: [
        { urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith("/api/"), handler: "NetworkOnly" },
        { urlPattern: ({ url }: { url: URL }) => url.hostname.endsWith(".supabase.co"), handler: "NetworkOnly" },
      ],
    },
    client: { installPrompt: false },
    devOptions: { enabled: false },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});

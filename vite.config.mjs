import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { siteHeaders, netlifyHeadersFile } from "./site-headers.mjs";

// Writes the security headers to dist/_headers for Netlify
const netlifyHeaders = {
  name: "netlify-headers",
  generateBundle() {
    this.emitFile({ type: "asset", fileName: "_headers", source: netlifyHeadersFile() });
  },
};

export default defineConfig({
  plugins: [react(), netlifyHeaders],
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
  // `npm run preview` serves the production build with the live site's headers; same proxy so it can be tested locally
  preview: {
    headers: siteHeaders,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});

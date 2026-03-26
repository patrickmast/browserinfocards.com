import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Read build version
const version = JSON.parse(readFileSync("./version.json", "utf-8"));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_VERSION__: JSON.stringify(version.build),
    __BUILD_DATE__: JSON.stringify(version.deployedAt || "")
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  }
})

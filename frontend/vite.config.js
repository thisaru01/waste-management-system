import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Vitest configuration
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    globals: true,
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      include: [
        "src/pages/CollectorScanBin.jsx",
        "src/hooks/useCollectionSession.js",
        "src/context/AuthContext.jsx",
        "src/services/api.js",
        "src/services/bins.js",
      ],
      exclude: ["node_modules/**", "src/test/**"],
    },
    // Increase default timeouts for async UI + timers
    testTimeout: 15000,
    hookTimeout: 15000,
  },
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify("http://localhost"),
  },
});

import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { hindsightApi } from "./server/hindsight-plugin.ts"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, "")
  const baseUrl = env.VITE_HINDSIGHT_URL || env.HINDSIGHT_URL || "http://localhost:8888"

  return {
    plugins: [react(), tailwindcss(), hindsightApi({ baseUrl })],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
    },
  }
})

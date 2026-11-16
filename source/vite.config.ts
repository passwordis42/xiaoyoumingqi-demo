import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

declare const process: { env: { VITE_BASE?: string } };

// 本地预览用相对路径。GitHub Pages 工作流传入 /xiaoyoumingqi-web/，资源落在项目子路径下。
const base = process.env.VITE_BASE?.trim() || "./";

export default defineConfig({
  base,
  plugins: [react()],
  build: { sourcemap: false },
  server: { host: "127.0.0.1", port: 43123, strictPort: true },
  preview: { host: "127.0.0.1", port: 43123, strictPort: true },
});

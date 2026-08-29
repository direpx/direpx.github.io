import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  plugins: [react()],
  root: "source",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});

import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    proxy: {
      "/api": "http://192.168.68.64:8000", // forward /api to express
      "/storage": "http://192.168.68.64:8000", // forward /storage to express
      "/uploads": "http://192.168.68.64:8000", // forward /storage to express
    },
  },
});

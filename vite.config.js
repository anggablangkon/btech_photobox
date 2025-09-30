import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  console.log("Loaded VITE_ADMIN_URL:", env.VITE_ADMIN_URL); // Debug log

  return {
    plugins: [tailwindcss(), sveltekit()],
    server: {
      proxy: {
        "/api": {
          target: env.VITE_ADMIN_URL,
        },
        "/storage": {
          target: env.VITE_ADMIN_URL,
        },
        "/uploads": {
          target: env.VITE_ADMIN_URL,
        },
      },
    },
  };
});

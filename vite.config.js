import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [tailwindcss(), sveltekit()],
    server: {
      proxy: {
        "/api": {
          target: env.VITE_ADMIN_URL,
          changeOrigin: true,
          secure: true,
        },
        "/storage": {
          target: env.VITE_ADMIN_URL,
          changeOrigin: true,
          secure: true,
        },
        "/uploads": {
          target: env.VITE_ADMIN_URL,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});

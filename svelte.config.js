import adapter from "@sveltejs/adapter-static";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      // default options
      pages: "build",
      assets: "build",
      fallback: "index.html", // <-- important for dynamic routes
    }),
    paths: {
      base: "", // adjust if your site is in a subfolder
    },
  },
};

export default config;

import { getFrames } from "$lib/api/frame.js";

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, url }) {
  // Check if we should use static data (for development)
  const useStatic = url.searchParams.get("static") === "true";
  const storeId = url.searchParams.get("store");
  try {
    const frames = await getFrames({ static: useStatic });
    return {
      frames,
      isStatic: useStatic,
    };
  } catch (error) {
    console.error("Error loading frames:", error);

    // Return empty array on complete failure
    return {
      frames: [],
      error: "Failed to load frames",
      isStatic: false,
    };
  }
}

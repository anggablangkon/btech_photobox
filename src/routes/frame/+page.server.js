import { json } from "@sveltejs/kit";

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
  // Static data for frames
  const staticFrames = [
    {
      id: 1,
      ip_id: 1,
      frame_id: 3,
      src: "/frame/FRAME_SHEILAON7_1.png",
      count: 4,
      width: 400,
      height: 600,
    },
    {
      id: 2,
      ip_id: 1,
      frame_id: 2,
      src: "/frame/FRAME_JUMBO_2.png",
      count: 4,
      width: 400,
      height: 600,
    },
    {
      id: 3,
      ip_id: 1,
      frame_id: 3,
      src: "/frame/FRAME_JUMBO_3.png",
      count: 4,
      width: 400,
      height: 600,
    },
    {
      id: 5,
      ip_id: 3,
      frame_id: 1,
      src: "/frame/FRAME_JUMBO_1.png",
      count: 4,
      width: 400,
      height: 600,
    },
    {
      id: 6,
      ip_id: 3,
      frame_id: 2,
      src: "/frame/FRAME_JUMBO_2.png",
      count: 4,
      width: 400,
      height: 600,
    },
    {
      id: 7,
      ip_id: 3,
      frame_id: 3,
      src: "/frame/FRAME_JUMBO_3.png",
      count: 4,
      width: 400,
      height: 600,
    },
  ];

  // Function to get data from API (not used currently)
  async function getFramesFromAPI() {
    try {
      const response = await fetch("http://localhost:8000/api/frames", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.frames || [];
    } catch (error) {
      console.error("Error fetching frames from API:", error);
      // Return static data as fallback
      return staticFrames;
    }
  }

  // Use static data for now
  // const frames = await getFramesFromAPI(); // Uncomment to use API
  const frames = staticFrames;

  return {
    frames,
  };
}


import { readable, writable } from "svelte/store";
// Store both photos and frame type
export const photosStore = writable({
  photos: [], // array of frames, each frame can have 1-4 photos
  frameType: 0, // selected frame layout index
  photoCount: 0,
});

export const photoFrame = readable({
  1: {
    src: "/frame/Green Clean Aesthetic Photostrip.png",
    count: 4,
    width: 200,
    height: 600,
  },
  2: {
    src: "/frame/frame3.png",
    count: 2,
    width: 338,
    height: 600,
  },
  3: {
    src: "/frame/Brown and Beige Aesthetic Gradient Elegant Photo Studio Photostrip.png",
    count: 4,
    width: 200,
    height: 600,
  },
  4: {
    src: "/frame/frame2.png",
    count: 4,
    width: 400,
    height: 600,
  },
});

export const photoOptions = readable({
  1: [
    { image: 1, x: 10, y: 10, w: 181, h: 110 },
    { image: 2, x: 10, y: 135, w: 181, h: 110 },
    { image: 3, x: 10, y: 255, w: 181, h: 110 },
    { image: 4, x: 10, y: 380, w: 181, h: 110 },
  ],
  2: [
    { image: 1, x: 24, y: 99, w: 289, h: 203 },
    { image: 2, x: 24, y: 305, w: 289, h: 203 },
  ],
  3: [
    { image: 1, x: 22, y: 17, w: 157, h: 113 },
    { image: 2, x: 22, y: 147, w: 157, h: 113 },
    { image: 3, x: 22, y: 277, w: 157, h: 113 },
    { image: 4, x: 22, y: 405, w: 157, h: 113 },
  ],
  4: [
    { image: 1, x: 26, y: 16, w: 215, h: 153 },
    { image: 2, x: 339, y: 16, w: 215, h: 153 },
    { image: 1, x: 26, y: 205, w: 215, h: 153 },
    { image: 2, x: 339, y: 205, w: 215, h: 153 },
  ],
});

import { readable, writable } from "svelte/store";
// Store both photos and frame type
export const photosStore = writable({
  photos: [], // array of frames, each frame can have 1-4 photos
  frameType: 0, // selected frame layout index
  photoCount: 0,
  photoIp: null,
  photoType: {},
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
    src: "/frame/Styling 1.png",
    count: 4,
    width: 400,
    height: 600,
  },
});

export const photoOptions = writable({
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
    { image: 1, x: 32, y: 22, w: 164, h: 210 },
    { image: 2, x: 205, y: 22, w: 164, h: 210 },
    { image: 3, x: 32, y: 237, w: 164, h: 210 },
    { image: 4, x: 205, y: 237, w: 164, h: 210 },
  ],
});

export const ipOptions = writable({
  1: {
    name: "Sheila On 7",
  },
  2: {
    name: "Sheila On 7",
  },
  3: {
    name: "Sheila On 7",
  },
  4: {
    name: "Sheila On 7",
  },
  5: {
    name: "Sheila On 7",
  },
});

export function resetPhotoStore() {
  photosStore.set({
    photos: [], // array of frames, each frame can have 1-4 photos
    frameType: 0, // selected frame layout index
    photoCount: 0,
  });
}

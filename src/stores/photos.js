import { readable, writable } from "svelte/store";
// Store both photos and frame type
export const photosStore = writable({
  photos: [], // array of frames, each frame can have 1-4 photos
  frameType: 0, // selected frame layout index
  photoCount: 0,
  photoIp: null,
  imageResult: null,
  photoType: {},
  selectedSong: null,
  filteredPhotos: [],
});

export const photoFrame = readable([
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
]);

export const photoOptions = writable({
  1: [
    { image: 1, x: 25, y: 42, w: 160, h: 210 },
    { image: 2, x: 215, y: 42, w: 160, h: 210 },
    { image: 3, x: 25, y: 288, w: 160, h: 210 },
    { image: 4, x: 215, y: 288, w: 160, h: 210 },
  ],
  2: [
    { image: 1, x: 25, y: 118, w: 160, h: 210 },
    { image: 2, x: 215, y: 36, w: 160, h: 210 },
    { image: 3, x: 25, y: 364, w: 160, h: 210 },
    { image: 4, x: 215, y: 260, w: 160, h: 210 },
  ],
  3: [
    { image: 1, x: 24, y: 89, w: 157, h: 92 },
    { image: 2, x: 24, y: 185, w: 157, h: 92 },
    { image: 3, x: 24, y: 281, w: 157, h: 92 },
    { image: 4, x: 24, y: 377, w: 157, h: 92 },
    { image: 1, x: 217, y: 89, w: 157, h: 92 },
    { image: 2, x: 217, y: 185, w: 157, h: 92 },
    { image: 3, x: 217, y: 281, w: 157, h: 92 },
    { image: 4, x: 217, y: 377, w: 157, h: 92 },
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

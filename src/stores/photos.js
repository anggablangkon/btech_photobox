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

export const photoOptions = writable({
  1: [
    { image: 1, x: 25, y: 42, w: 160, h: 210 },
    { image: 2, x: 215, y: 42, w: 160, h: 210 },
    { image: 3, x: 25, y: 288, w: 160, h: 210 },
    { image: 4, x: 215, y: 288, w: 160, h: 210 },
  ],
  2: [
    { image: 1, x: 25, y: 116, w: 160, h: 210 },
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
  4: [
    { image: 1, x: 15, y: 101, w: 182, h: 145 },
    { image: 2, x: 204, y: 101, w: 182, h: 145 },
    { image: 3, x: 15, y: 252, w: 182, h: 145 },
    { image: 4, x: 204, y: 252, w: 182, h: 145 },
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

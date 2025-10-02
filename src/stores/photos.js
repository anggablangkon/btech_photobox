import { readable, writable } from "svelte/store";
// Store both photos and frame type
export const photosStore = writable({
  photos: [], // array of frames, each frame can have 1-4 photos
  frameType: 0, // selected frame layout index
  photoCount: 0,
  photoIp: null,
  imageResult: null,
  photoType: null,
  selectedSong: null,
  filteredPhotos: [],
});

export const photoOptions = writable({
  1: [
    { image: 1, x: 6.4, y: 6.9, w: 40, h: 35 },
    { image: 2, x: 53.5, y: 6.9, w: 40, h: 35 },
    { image: 3, x: 6.4, y: 48, w: 40, h: 35 },
    { image: 4, x: 53.5, y: 48, w: 40, h: 35 },
  ],
  2: [
    { image: 1, x: 6.3, y: 19.4, w: 40, h: 35 },
    { image: 2, x: 6.3, y: 60.5, w: 40, h: 35 },
    { image: 3, x: 53.7, y: 6, w: 40, h: 35 },
    { image: 4, x: 53.7, y: 47, w: 40, h: 35 },
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
    { image: 1, x: 4, y: 16.9, w: 45, h: 24 },
    { image: 2, x: 51, y: 16.9, w: 45, h: 24 },
    { image: 3, x: 4, y: 42.2, w: 45, h: 24 },
    { image: 4, x: 51, y: 42.2, w: 45, h: 24 },
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
    photoIp: null,
    imageResult: null,
    photoType: {},
    selectedSong: null,
    filteredPhotos: [],
  });
}

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
    { image: 1, x: 7, y: 14.5, w: 38, h: 15.5 },
    { image: 2, x: 7, y: 30.8, w: 38, h: 15.5 },
    { image: 3, x: 7, y: 46.5, w: 38, h: 15.5 },
    { image: 4, x: 7, y: 62.5, w: 38, h: 15.5 },
    { image: 1, x: 55.5, y: 14.5, w: 38, h: 15.5 },
    { image: 2, x: 55.5, y: 30.8, w: 38, h: 15.5 },
    { image: 3, x: 55.5, y: 46.5, w: 38, h: 15.5 },
    { image: 4, x: 55.5, y: 62.5, w: 38, h: 15.5 },
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

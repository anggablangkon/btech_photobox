import { writable } from "svelte/store";

export const appSettings = writable({
  backgroundPage: "/background/BACKGROUND 1.jpg",
  title: null,
});

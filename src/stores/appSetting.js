import { writable } from "svelte/store";

export const appSettings = writable({
  backgroundPage: null,
  title: null,
});

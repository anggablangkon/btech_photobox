<script>
  import { PauseCircleIcon, PlayCircleIcon } from "svelte-feather-icons";
  import { onDestroy, onMount, tick } from "svelte";
  import { photosStore } from "../../stores/photos";
  import { afterNavigate, goto } from "$app/navigation";
  import { appSettings } from "../../stores/appSetting";
  import { getSongById } from "$lib/api/songs";
  import { createOrder } from "$lib/api/order";

  // store references to <audio>
  let audio = [];
  let isPaused = [];
  let isLoading = true;
  let photoData;
  let fadeIntervals;
  let songLists;
  let selectedIp;
  let isSaving = false; // Add saving state

  afterNavigate(() => {
    appSettings.update((state) => {
      return {
        ...state,
        backgroundPage: "/background/BACKGROUND 10.jpg",
        title: "Pilih Lagu",
      };
    });
  });

  $: photoData = $photosStore;

  onMount(async () => {
    console.log("[SONG] Photo data:", photoData);

    try {
      songLists = await getSongById(photoData.photoIp.id);
      console.log("[SONG] Songs loaded:", songLists);

      isPaused = songLists.map(() => true);
      fadeIntervals = songLists.map(() => null);

      await tick();
    } catch (error) {
      console.error("[SONG] Error loading songs:", error);
      songLists = [];
    } finally {
      isLoading = false;
    }
  });

  onDestroy(() => {
    // Clean up audio and intervals
    audio.forEach((a, i) => {
      if (a) {
        a.pause();
        isPaused[i] = true;
      }
    });

    fadeIntervals.forEach((interval, i) => {
      if (interval) {
        clearInterval(interval);
        fadeIntervals[i] = null;
      }
    });
  });

  function handlePlay(index) {
    if (!audio[index].paused) {
      audio[index].pause();
      isPaused[index] = true;
    } else {
      // Else play clicked and pause others
      audio.forEach((a, i) => {
        if (i !== index) {
          a.pause();
          isPaused[i] = true;
        } else {
          a.currentTime = 0;
          a.volume = 0.15;
          a.play();
          isPaused[i] = false;
        }
      });
    }

    // ✅ Reassign array to trigger reactivity
    isPaused = [...isPaused];
  }

  function handleTimeUpdate(index) {
    const a = audio[index];
    if (a.currentTime >= 15) {
      a.pause();
      a.currentTime = 0; // optional reset to start
      startFadeOut(a, index);
      isPaused[index] = true;
    }
    audio = [...audio];
    isPaused = [...isPaused];
  }

  function startFadeOut(audioEl, index) {
    const steps = 20; // how many steps for fade
    const stepTime = (5 * 1000) / steps;
    let step = 0;

    fadeIntervals[index] = setInterval(() => {
      step++;
      const newVol = 0.3 * (1 - step / steps);
      audioEl.volume = Math.max(newVol, 0);

      if (step >= steps) {
        clearInterval(fadeIntervals[index]);
        fadeIntervals[index] = null;
      }
    }, stepTime);
  }

  // Convert base64 image to Blob
  function base64ToBlob(base64Data, contentType = "image/jpeg") {
    if (!base64Data || typeof base64Data !== "string") {
      console.error("[SONG] Invalid base64 data:", base64Data);
      return null;
    }

    try {
      const base64Parts = base64Data.split(",");
      if (base64Parts.length !== 2) {
        console.error(
          "[SONG] Invalid base64 format:",
          base64Data.substring(0, 50) + "..."
        );
        return null;
      }

      const byteCharacters = atob(base64Parts[1]);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: contentType });
    } catch (error) {
      console.error("[SONG] Error converting base64 to blob:", error);
      return null;
    }
  }

  async function saveToOrder() {
    if (isSaving) {
      console.log("[SONG] Already saving, skipping...");
      return;
    }

    isSaving = true;
    console.log("[SONG] Starting to save order with data:", photoData);

    try {
      const form = new FormData();

      // Basic order information
      form.append("order_id", photoData.order_id || "");
      if (photoData.background) {
        form.append("image_id", photoData.background.id || "");
      }
      form.append("type", photoData.photoType?.title || "");
      form.append("ip_id", photoData.photoIp?.id || "");
      form.append("frame_id", photoData.frameType?.id || "");
      form.append("price", photoData.photoType?.price || "");

      // Song selection
      const songId = photoData.selectedSong ? photoData.selectedSong.id : null;
      form.append("song_id", songId || "");

      console.log("[SONG] Basic form data added");

      // Main processed image
      if (photoData.imageResult) {
        const imageBlob = base64ToBlob(photoData.imageResult, "image/jpeg");
        if (imageBlob) {
          form.append("image_result", imageBlob, "processed_image.jpg");
          console.log("[SONG] Main image added to form");
        } else {
          console.error("[SONG] Failed to convert main image");
        }
      }

      // Individual photos
      if (photoData.photos && Array.isArray(photoData.photos)) {
        const formPhoto = [];
        photoData.photos.forEach((photo, index) => {
          if (photo && typeof photo === "string") {
            const photoBlob = base64ToBlob(photo, "image/jpeg");
            if (photoBlob) {
              form.append(`photos[${index}]`, photoBlob, `photo_${index}.jpg`);
              console.log(`[SONG] Photo ${index} added to form`);
            }
          }
        });
      } else {
        console.warn("[SONG] No photos array found or invalid format");
      }

      // Debug: Log form contents
      console.log("[SONG] Form data contents:");
      for (let pair of form.entries()) {
        console.log(
          `${pair[0]}:`,
          pair[1] instanceof Blob ? `Blob (${pair[1].size} bytes)` : pair[1]
        );
      }

      // Send to API with retry logic
      let retryCount = 0;
      const maxRetries = 1;

      async function attemptCreateOrder() {
        try {
          console.log(
            `[SONG] Attempting to create order (attempt ${retryCount + 1}/${maxRetries + 1})`
          );
          const response = await createOrder(form);
          console.log("[SONG] Order saved successfully:", response);

          // Navigate to result page on success
          goto("/result");
        } catch (error) {
          console.error(
            `[SONG] Error saving order (attempt ${retryCount + 1}):`,
            error
          );

          // if (retryCount < maxRetries) {
          //   retryCount++;
          //   console.log(`[SONG] Retrying... (${retryCount}/${maxRetries})`);
          //   await new Promise((resolve) =>
          //     setTimeout(resolve, 1000 * retryCount)
          //   ); // Exponential backoff
          //   await attemptCreateOrder();
          // } else {
          //   console.error("[SONG] Max retries reached. Order creation failed.");
          //   alert("Failed to save order. Please try again.");
          //   throw error;
          // }
        }
      }
      await attemptCreateOrder();
    } catch (error) {
      console.error("[SONG] Final error in saveToOrder:", error);
    } finally {
      isSaving = false;
    }
  }

  async function selectSong(song) {
    if (isSaving) {
      console.log("[SONG] Already processing, please wait...");
      return;
    }

    console.log("[SONG] Song selected:", song);

    // Update store with selected song
    photosStore.update((state) => {
      return { ...state, selectedSong: song };
    });

    // Wait for store to update
    await tick();

    // Save to order
    await saveToOrder();
  }

  async function skipSong() {
    if (isSaving) {
      console.log("[SONG] Already processing, please wait...");
      return;
    }

    console.log("[SONG] Song skipped");

    // Update store with no song
    photosStore.update((state) => {
      return { ...state, selectedSong: null };
    });

    // Wait for store to update
    await tick();

    // Save to order
    await saveToOrder();
  }
</script>

{#if !isLoading}
  <div class="size-full">
    <button
      class="btn bg-base-100 border-3 border-b-6 border-base-200 rounded-full my-3 px-10"
      on:click={skipSong}
      disabled={isSaving}
    >
      {#if isSaving}
        <span class="loading loading-spinner loading-sm mr-2"></span>
      {/if}
      Skip
    </button>

    <div class="grid grid-cols-3 gap-2 w-full">
      {#if songLists && songLists.length === 0}
        <div class="col-span-3 text-center">
          <p class="text-lg font-bold">No songs available for this IP</p>
        </div>
      {:else}
        {#each songLists as song, i}
          <div class="h-40 w-full bg-primary p-3 rounded-md">
            <div class="flex h-full">
              <div class="flex-1 p-3 flex flex-grow flex-col">
                <p class="font-bold text-xl text-white">
                  {song.singer || song.ip?.name || "Unknown Artist"}
                </p>
                <p class="text-white">{song.title || "Untitled"}</p>

                <audio
                  class="w-full h-12 rounded-lg bg-gray-800 text-white shadow-lg hidden"
                  bind:this={audio[i]}
                  src={song.song_url}
                  on:timeupdate={() => handleTimeUpdate(i)}
                  controls
                  height="20px"
                />

                <button
                  type="button"
                  on:click={() => selectSong(song)}
                  class="btn btn-secondary shadow border-none mt-auto hover:bg-blue-900"
                  disabled={isSaving}
                >
                  {#if isSaving}
                    <span class="loading loading-spinner loading-sm mr-2"
                    ></span>
                  {/if}
                  Pilih Lagu
                </button>
              </div>
              <div class="w-40 h-full items-center justify-center flex">
                <button
                  type="button"
                  class="hover:bg-emerald-300"
                  on:click={() => handlePlay(i)}
                  disabled={isSaving}
                >
                  <PlayCircleIcon
                    size="48"
                    class={`text-white ${isPaused[i] ? "" : "hidden"}`}
                  />
                  <PauseCircleIcon
                    size="48"
                    class={`text-white ${isPaused[i] ? "hidden" : ""}`}
                  />
                </button>
              </div>
            </div>
          </div>
        {/each}
      {/if}
    </div>

    {#if isSaving}
      <div
        class="fixed inset-0 bg-black/90 bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="bg-white rounded-lg p-6 text-center">
          <span class="loading loading-spinner loading-lg mb-4"></span>
          <p class="text-lg font-semibold">Saving your order...</p>
          <p class="text-sm text-gray-600">
            Please wait, this may take a moment
          </p>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <div class="w-full my-auto text-center">
    <span class="loading loading-spinner loading-lg"></span>
    <p class="mt-4">Loading songs...</p>
  </div>
{/if}

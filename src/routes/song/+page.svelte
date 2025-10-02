<script>
  import { PauseCircleIcon, PlayCircleIcon } from "svelte-feather-icons";
  import { onDestroy, onMount, tick } from "svelte";
  import { photosStore } from "../../stores/photos";
  import { afterNavigate, goto } from "$app/navigation";
  import { appSettings } from "../../stores/appSetting";
  import { getSongById } from "$lib/api/songs";


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
        title: "Select Song",
      };
    });
  });

  $: photoData = $photosStore;

  onMount(async () => {
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

    goto("/frame");
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
    
    goto("/frame");
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
                  Select Song
                </button>
              </div>
              <div class="w-40 h-full items-center justify-center flex">
                <button
                  type="button"
                  class="hover:bg-orange-200"
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
  </div>
{:else}
  <div class="w-full my-auto text-center">
    <span class="loading loading-spinner loading-lg"></span>
    <p class="mt-4">Loading songs...</p>
  </div>
{/if}

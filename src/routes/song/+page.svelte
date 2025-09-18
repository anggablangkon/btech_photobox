<script>
  import { PauseCircleIcon, PlayCircleIcon } from "svelte-feather-icons";
  import { songLists } from "$lib/songList";
  import { onDestroy, onMount, tick } from "svelte";
  import { photosStore } from "../../stores/photos";
  import { goto } from "$app/navigation";

  // store references to <audio>
  let audio = [];
  let isPaused = [];
  let isLoading = true;
  let fadeIntervals;

  onMount(async () => {
    isPaused = songLists.map(() => true);
    fadeIntervals = songLists.map(() => true);

    await tick();
    isLoading = false;
  });

  onDestroy(() => {
    audio.forEach((a, i) => {
      a.pause();
      isPaused[i] = true;
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
          a.volume = 0.3;
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

  function selectSong(song) {
    const selectedAudio = song;
    photosStore.update((state) => {
      return { ...state, selectedSong: selectedAudio };
    });

    goto("/result");
  }
</script>

{#if !isLoading}
  <div class="size-full">
    <div class="grid grid-cols-3 gap-2 w-full">
      {#each songLists as song, i}
        <div class="h-40 w-full bg-primary p-3 rounded-md">
          <div class="flex h-full">
            <div class="flex-1 p-3 flex flex-grow flex-col">
              <p class="font-bold text-xl text-white">{song.singer}</p>
              <p class="text-white">{song.title}</p>

              <audio
                class="w-full h-12 rounded-lg bg-gray-800 text-white shadow-lg hidden"
                bind:this={audio[i]}
                src={song.url}
                on:timeupdate={() => handleTimeUpdate(i)}
                controls
                height="20px"
              />

              <button
                type="button"
                on:click={() => selectSong(song)}
                class="btn btn-secondary shadow border-none mt-auto hover:bg-blue-900"
              >
                Pilih Lagu
              </button>
            </div>
            <div class="w-40 h-full items-center justify-center flex">
              <button
                type="button"
                class="hover:bg-emerald-300"
                on:click={() => handlePlay(i)}
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
    </div>
  </div>
{:else}
  <div class="w-full my-auto text-center">
    <span class="loading"></span>
  </div>
{/if}

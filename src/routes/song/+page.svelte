<script>
  import { PlayCircleIcon } from "svelte-feather-icons";
  import { songLists } from "$lib/songList";
  import { onMount } from "svelte";

  // store references to <audio>
  let audio = [];
  let fadeIntervals;

  function handlePlay(index) {
    audio.forEach((a, i) => {
      if (i !== index) {
        a.pause();
      }
      a.currentTime = 10;
      a.volume = 0.3; // 30% volume
    });
  }

  function handleTimeUpdate(index) {
    const a = audio[index];
    console.log(a.currentTime);
    if (a.currentTime >= 20) {
      a.pause();
      a.currentTime = 0; // optional reset to start
      startFadeOut(a, index);
    }
  }

  function startFadeOut(audioEl, index) {
    const steps = 20; // how many steps for fade
    const stepTime = (5 * 1000) / steps;
    let step = 0;

    fadeIntervals[index] = setInterval(() => {
      step++;
      const newVol = 30 * (1 - step / steps);
      audioEl.volume = Math.max(newVol, 0);

      if (step >= steps) {
        clearInterval(fadeIntervals[index]);
        fadeIntervals[index] = null;
      }
    }, stepTime);
  }
</script>

<div class="size-full">
  <div class="grid grid-cols-3 gap-2 w-full">
    {#each songLists as song, i}
      <div class="h-40 w-full bg-primary">
        <div class="flex h-full">
          <div class="w-40 h-full flex items-center">
            <div class="cover-song w-35 h-35 mx-auto my-auto">
              <img
                src="/photo-1606107557195-0e29a4b5b4aa.webp"
                class="object-cover w-full h-full"
                alt=""
              />
            </div>
          </div>
          <div class="flex-1 p-3 grid">
            <p class="font-bold text-xl text-white">{song.singer}</p>
            <p class="text-white">{song.name}</p>

            <audio
              bind:this={audio[i]}
              src={song.url}
              on:play={() => handlePlay(i)}
              on:timeupdate={() => handleTimeUpdate(i)}
              controls
            />

            <button
              class="btn btn-secondary shadow border-none mt-auto hover:bg-blue-900"
            >
              Pilih Lagu
            </button>
          </div>
          <div class="w-40 h-full items-center justify-center flex">
            <PlayCircleIcon size="48" class="text-white"></PlayCircleIcon>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>

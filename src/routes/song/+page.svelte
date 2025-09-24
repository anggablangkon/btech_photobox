<script>
  import { PauseCircleIcon, PlayCircleIcon } from "svelte-feather-icons";
  import { songLists } from "$lib/songList";
  import { onDestroy, onMount, tick } from "svelte";
  import { photosStore } from "../../stores/photos";
  import { afterNavigate, goto } from "$app/navigation";
  import { appSettings } from "../../stores/appSetting";

  // store references to <audio>
  let audio = [];
  let isPaused = [];
  let isLoading = true;
  let photoData;
  let fadeIntervals;
  let songList;
  let selectedIp;

  afterNavigate(() => {
    appSettings.update((state) => {
      return {
        ...state,
        backgroundPage: "/background/BACKGROUND 10.jpg",
        title: "Pilih Lagu",
      };
    });
  });

  onMount(async () => {
    photosStore.subscribe((v) => {
      photoData = v;
    });

    songList = songLists.filter((s) => s.ip_id === photoData.photoIp.id);
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

  // Convert base64 image to Blob
  function base64ToBlob(base64Data, contentType = "") {
    const sliceSize = 1024;
    const byteCharacters = atob(base64Data.split(",")[1]);
    const bytesLength = byteCharacters.length;
    const byteArrays = new Array(Math.ceil(bytesLength / sliceSize));

    for (
      let sliceIndex = 0;
      sliceIndex < Math.ceil(bytesLength / sliceSize);
      sliceIndex++
    ) {
      const begin = sliceIndex * sliceSize;
      const end = Math.min(begin + sliceSize, bytesLength);

      const bytes = new Array(end - begin);
      for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
        bytes[i] = byteCharacters[offset].charCodeAt(0);
      }
      byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    return new Blob(byteArrays, { type: contentType });
  }

  function saveToOrder() {
    const form = new FormData();
    form.append("order_id", photoData.order_id);
    form.append("type", photoData.photoType.title);

    const imageBlob = base64ToBlob(photoData.imageResult, "image/jpeg");
    form.append("image", imageBlob, "image.jpg");

    form.append("ip", photoData.photoIp);
    form.append("frame", photoData.frameType.id);
    form.append(
      "song",
      photoData.selectedSong ? photoData.selectedSong.id : "No Song"
    );

    const photos = photoData.photos;
    for (const key in photos) {
      if (
        key !== "photos" &&
        key !== "imageResult" &&
        key !== "photoIp" &&
        key !== "frameType" &&
        key !== "selectedSong" &&
        key !== "order_id" &&
        key !== "photoType"
      ) {
        form.append(key, base64ToBlob(photos[key], "image/jpeg"));
      }
    }

    fetch("http://localhost:8000/api/order/create", {
      method: "POST",
      body: form,
    })
      .then((response) => response.json())
      .then((data) => {
        goto("/payment");
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  function selectSong(song) {
    const selectedAudio = song;
    photosStore.update((state) => {
      return { ...state, selectedSong: selectedAudio };
    });

    goto("/result");
  }

  function skipSong() {
    photosStore.update((state) => {
      return { ...state, selectedSong: null };
    });

    goto("/result");
    // saveToOrder();
  }
</script>

{#if !isLoading}
  <div class="size-full">
    <button
      class="btn bg-base-100 border-3 border-b-6 border-base-200 rounded-full my-3 px-10"
      on:click={() => skipSong()}
    >
      Skip
    </button>
    <div class="grid grid-cols-3 gap-2 w-full">
      {#if songList && songList.length === 0}
        <div class="col-span-3 text-center">
          <p class="text-lg font-bold">No songs available for this IP</p>
        </div>
      {:else}
        {#each songList as song, i}
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
      {/if}
    </div>
  </div>
{:else}
  <div class="w-full my-auto text-center">
    <span class="loading"></span>
  </div>
{/if}

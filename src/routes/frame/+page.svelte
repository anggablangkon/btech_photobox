<script>
  import { goto } from "$app/navigation";
  import { onDestroy, onMount } from "svelte";
  import { photosStore, photoFrame as photoFrames } from "../../stores/photos";

  let autoContinueTimer;
  let autoCountdownTimer;
  let selectedFrame = null;
  let frames;
  onMount(async () => {
    photoFrames.subscribe((v) => {
      frames = v;
      startCountdownTimer();
    });
  });

  onDestroy(() => {
    clearInterval(autoContinueTimer);
  });

  function startCountdownTimer() {
    clearInterval(autoContinueTimer);
    autoCountdownTimer = 30;
    autoContinueTimer = setInterval(() => {
      autoCountdownTimer -= 1;
      if (autoCountdownTimer <= 0) {
        clearInterval(autoContinueTimer);
        const frameRand = Math.floor(Math.random() * frames.length);
        selectedFrame = frames[frameRand];
        selectFrame(selectedFrame.id);
      }
    }, 1000);
  }

  function selectFrame(i) {
    photosStore.update((state) => {
      return { ...state, frameType: i };
    });

    goto("/background");
  }
</script>

<div class="w-full block pb-15">
  <div class="flex justify-between">
    <h1 class="mb-3 font-bold text-xl text-center">Pilih Frame</h1>
    <h1 class="mb-3 font-bold text-xl text-center">
      Waktu anda sisa {autoCountdownTimer}
    </h1>
  </div>
  <div
    class="h-full mx-auto flex flex-wrap justify-start gap-2 rounded-md p-1 overflow-auto"
  >
    {#if frames}
      {#each Object.entries(frames) as [i, frames]}
        <div
          class="shadow-lg border border-1 border-base-300 w-[200px] h-[300px] flex justify-center"
          on:click={() => selectFrame(frames.id)}
        >
          <figure class="h-full p-2 overflow-hidden">
            <img
              src={frames.src}
              alt="/frame/Styling 1.png"
              class="object-cover h-full"
            />
          </figure>
        </div>
      {/each}
    {:else}
      <div
        class="w-1/3 h-3/4 shadow-lg border border-1 border-base-300"
        on:click={goto("/photobooth")}
      >
        <figure class="h-full p-2 border-base-200 shadow overflow-hidden">
          <img
            src="/frame/Styling 1.png"
            alt="/frame/Styling 1.png"
            class="object-contain w-full h-full"
          />
        </figure>
      </div>{/if}
  </div>
</div>

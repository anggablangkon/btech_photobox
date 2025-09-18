<script>
  import { goto } from "$app/navigation";
  import { onDestroy, onMount } from "svelte";
  import { photosStore } from "../../stores/photos";
  import { backgroundLists } from "$lib/backgroundLists";
  let autoContinueTimer;
  let autoCountdownTimer;
  let frames;
  let isLoading = true;

  onMount(() => {
    isLoading = false;
  });
  function startCountdownTimer() {
    clearInterval(autoContinueTimer);
    autoCountdownTimer = 5;
    autoContinueTimer = setInterval(() => {
      autoCountdownTimer -= 1;
      if (autoCountdownTimer <= 0) {
        clearInterval(autoContinueTimer);
        const backgroundRand = Math.floor(Math.random() * frames.length);
        const background = backgroundLists.find((v) => (v.id = backgroundRand));
        selectFrame(background.id);
      }
    }, 1000);
  }

  onDestroy(() => {
    clearInterval(autoContinueTimer);
  });

  function selectFrame(i) {
    const background = backgroundLists.find((v) => (v.id = i));
    photosStore.update((state) => {
      return { ...state, background: background };
    });
    goto("/photobooth");
  }
</script>

{#if !isLoading}
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
      {#if backgroundLists}
        {#each Object.entries(backgroundLists) as [i, frames]}
          <div
            class="shadow-lg border border-1 border-base-300 w-[300px] h-[200px] flex justify-center"
            on:click={() => selectFrame(frames.id)}
          >
            <figure class="h-full p-2 overflow-hidden">
              <img
                src={frames.url}
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
{/if}

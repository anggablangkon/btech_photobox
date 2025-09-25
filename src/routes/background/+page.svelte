<script>
  import { afterNavigate, goto } from "$app/navigation";
  import { onDestroy, onMount } from "svelte";
  import { photosStore } from "../../stores/photos";
  import { appSettings } from "../../stores/appSetting";
  import { getBackgroundById, getBackgroundsByIpId } from "$lib/api/background";
  let autoContinueTimer;
  let autoCountdownTimer;
  let selectedIp;
  let backgroundLists = [];
  let isLoading = true;

  afterNavigate(() => {
    appSettings.update((state) => {
      return {
        ...state,
        backgroundPage: "/background/BACKGROUND 6.jpg",
        title: "Pilih Background",
      };
    });
  });

  $: selectedIp = $photosStore.photoIp;

  onMount(async () => {
    isLoading = false;

    backgroundLists = await getBackgroundsByIpId(selectedIp.id);
    console.log(backgroundLists);
    // startCountdownTimer();
  });

  function startCountdownTimer() {
    clearInterval(autoContinueTimer);
    autoCountdownTimer = 30;
    autoContinueTimer = setInterval(() => {
      autoCountdownTimer -= 1;
      if (autoCountdownTimer <= 0) {
        clearInterval(autoContinueTimer);
        const backgroundRand =
          backgroundLists[Math.floor(Math.random() * backgroundLists.length)]
            .id;
        const background = backgroundLists.find((v) => v.id == backgroundRand);
        selectBackground(background.id);
      }
    }, 1000);
  }

  onDestroy(() => {
    clearInterval(autoContinueTimer);
  });

  function selectBackground(i) {
    const background = backgroundLists.find((v) => v.id == i);

    photosStore.update((state) => {
      return { ...state, background: background };
    });
    goto("/photobooth");
  }
</script>

{#if !isLoading}
  <div class="w-full block pb-15">
    <div class="flex justify-between">
      <h1
        class="mb-3 font-bold text-xl text-center p-2 bg-base-100 border-3 border-b-6 rounded-full"
      >
        Waktu anda sisa {autoCountdownTimer}
      </h1>
    </div>
    <div
      class="h-full mx-auto flex flex-wrap justify-start gap-2 rounded-md p-1 overflow-auto"
    >
      {#if backgroundLists}
        {#each Object.entries(backgroundLists) as [i, background]}
          <div
            class="shadow-lg border border-1 border-base-300 w-[300px] h-[200px] flex justify-center"
            on:click={() => selectBackground(background.id)}
          >
            {#if background.image}
              <figure
                class="h-full p-2 overflow-hidden border border-double bg-white"
              >
                <img
                  src={background.image}
                  alt="/frame/Styling 1.png"
                  class="object-cover h-full"
                />
              </figure>
            {:else}
              <div
                class="h-full w-full flex items-center justify-center bg-white text-gray-400"
              >
                Tanpa Background
              </div>
            {/if}
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

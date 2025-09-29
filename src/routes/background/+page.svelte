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
    startCountdownTimer();
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
    if (i != null) {
      const background = backgroundLists.find((v) => v.id == i);
      photosStore.update((state) => {
        return { ...state, background: background };
      });
    } else {
      photosStore.update((state) => {
        return { ...state, background: null };
      });
    }

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
      <div
        class="w-[300px] h-[200px] bg-white flex items-center justify-center border-3 rounded-xl"
        on:click={() => selectBackground(null)}
      >
        <span> Tanpa Background </span>
      </div>
      {#if backgroundLists}
        {#each Object.entries(backgroundLists) as [i, background]}
          <div
            class="w-[300px] h-[200px] bg-white flex items-center justify-center border-3 rounded-xl"
            on:click={() => selectBackground(background.id)}
          >
            {#if background.image}
              <img
                src={background.image}
                alt="/frame/Styling 1.png"
                class="object-cover h-full"
              />
            {:else}
              <span> Tanpa Background </span>
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

<script>
  import Loading from "$lib/components/Loading.svelte";
  import { afterNavigate, goto } from "$app/navigation";
  import { onDestroy, onMount } from "svelte";
  import { photosStore } from "../../stores/photos";
  import {
    ArrowLeftCircleIcon,
    ArrowRightCircleIcon,
  } from "svelte-feather-icons";
  import { appSettings } from "../../stores/appSetting";
  import { getIps } from "$lib/api/ips";

  let selectedType;
  let autoCountdownTimer = null;
  let swiperEl;
  let autoContinueTimer;
  let ips = null;
  let isLoading = true;

  afterNavigate(() => {
    appSettings.update((state) => {
      return {
        ...state,
        backgroundPage: "/background/BACKGROUND 3.jpg",
        title: "Pilih IP",
      };
    });
  });

  onMount(async () => {
    try {
      ips = await getIps();
    } catch (error) {
      console.error("Error loading frames:", error);
    }
    isLoading = false;
    startCountdownTimer();
  });

  onDestroy(() => {
    clearInterval(autoContinueTimer);
  });

  const prevSlide = () => {
    swiperEl?.swiper.slidePrev();
  };
  const nextSlide = () => {
    swiperEl?.swiper.slideNext();
  };

  function startCountdownTimer() {
    clearInterval(autoContinueTimer);
    autoCountdownTimer = 30;

    autoContinueTimer = setInterval(() => {
      autoCountdownTimer -= 1;
      if (autoCountdownTimer <= 0) {
        clearInterval(autoContinueTimer);
        const ipRand = ips[Math.floor(Math.random() * ips.length)];
        onSelectIp(ipRand);
      }
    }, 1000);
  }

  function onSelectIp(ip) {
    const selectedIp = ip;
    photosStore.update((state) => {
      return { ...state, photoIp: selectedIp };
    });
    goto("/song");
  }
</script>

<div class="w-full overflow-hidden relative h-full">
  {#if !isLoading}
    <div class="flex justify-between">
      <h1
        class="mb-3 font-bold text-xl text-center p-2 bg-base-300 border border-2 rounded-full"
      >
        Waktu anda sisa {autoCountdownTimer}
      </h1>
    </div>

    <div class="h-10/12 mx-auto">
      {#if ips.length > 2}
        <button
          class="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-blue-300 .prev-button p-0"
          on:click={prevSlide}
        >
          <ArrowLeftCircleIcon size="32" />
        </button>
        <button
          class="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-blue-300 .next-button p-0"
          on:click={nextSlide}
        >
          <ArrowRightCircleIcon size="32" />
        </button>
      {/if}
      <swiper-container
        bind:this={swiperEl}
        class="mx-auto h-full w-3/4"
        slides-per-view="2"
        loop="true"
        space-between="30"
      >
        {#each Object.entries(ips) as [i, ip]}
          <swiper-slide class="p-10 flex items-center justify-center">
            <div class="h-3/4">
              <button
                class="aspect-square h-full flex flex-col shrink items-center border-double border-8 rounded-2xl bg-blue-50 shadow-md mx-auto text-center"
                on:click={() => onSelectIp(ip)}
              >
                <img
                  src={ip.image}
                  alt={ip.image}
                  class="object-cover h-full w-full"
                />
              </button>
            </div>
          </swiper-slide>
        {/each}
      </swiper-container>
    </div>
  {:else}
    <Loading text="Loading..."></Loading>
  {/if}
</div>

<script>
  import Loading from "$lib/components/Loading.svelte";
  import { afterNavigate, goto } from "$app/navigation";
  import { onDestroy, onMount } from "svelte";
  import { photosStore } from "../../stores/photos";
  import { appSettings } from "../../stores/appSetting";
  import {
    ArrowLeftCircleIcon,
    ArrowRightCircleIcon,
  } from "svelte-feather-icons";
  import { getFrames } from "$lib/api/frame";

  let autoContinueTimer;
  let autoCountdownTimer;
  let swiperEl;
  let selectedIp;
  let isLoading = true;
  let selectedFrame = null;
  let frames;

  afterNavigate(() => {
    appSettings.update((state) => {
      return {
        ...state,
        backgroundPage: "/background/BACKGROUND 7.jpg",
        title: "Select Frame",
      };
    });
  });

  $: selectedIp = $photosStore?.photoIp || null;

  onMount(async () => {
    frames = await getFrames({ ip_id: selectedIp.id });
    isLoading = false;
    // startCountdownTimer();
  });

  const prevSlide = () => {
    swiperEl?.swiper.slidePrev();
  };
  const nextSlide = () => {
    swiperEl?.swiper.slideNext();
  };

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
        selectFrame(selectedFrame);
      }
    }, 1000);
  }

  function selectFrame(frame) {
    photosStore.update((state) => {
      return { ...state, frameType: frame };
    });

    goto("/photobooth");
  }
</script>

<div class="size-full block pb-15">
  {#if !isLoading}
    <h1
      class="inline-flex p-2 font-bold text-xl text-center bg-base-100 border-3 border-b-6 border-base-200 rounded-full"
    >
      Waktu anda sisa {autoCountdownTimer}
    </h1>
    <div class="h-11/12 mx-auto justify-start gap-2 rounded-md relative">
      {#if frames && Object.keys(frames).length > 2}
        <button
          type="button"
          class="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-blue-300 .prev-button p-0"
          on:click={prevSlide}
        >
          <ArrowLeftCircleIcon size="32" />
        </button>
        <button
          type="button"
          class="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-blue-300 .next-button p-0"
          on:click={nextSlide}
        >
          <ArrowRightCircleIcon size="32" />
        </button>
      {/if}
      <swiper-container
        bind:this={swiperEl}
        class="h-full mx-auto w-3/4"
        slides-per-view="2"
        space-between="30"
      >
        {#if frames}
          {#each Object.entries(frames) as [i, frame]}
            <swiper-slide class="p-5 h-full flex items-center justify-center">
              <button
                class="shadow-lg rounded-xl bg-white border border-1 border-base-300 aspect-[2/3] h-full flex justify-center p-5"
                on:click={() => selectFrame(frame)}
              >
                <figure
                  class="aspect-[2/3] h-full overflow-hidden flex bg-amber-800"
                >
                  <img
                    src={frame.image}
                    alt="/frame/Styling 1.png"
                    class="object-cover w-full h-full"
                  />
                </figure>
              </button>
            </swiper-slide>
          {/each}
        {:else}
          <swiper-slide class="p-5 h-full flex items-center justify-center">
            <button
              class="shadow-lg rounded-xl bg-white border border-1 border-base-300 aspect-[2/3] h-full flex justify-center p-5"
              on:click={() => selectFrame(frame)}
            >
              <figure
                class="aspect-[2/3] h-full overflow-hidden flex bg-amber-800"
              >
                <img
                  src="/frame/Styling 1.png"
                  alt="/frame/Styling 1.png"
                  class="object-contain w-full h-full"
                />
              </figure>
            </button>
          </swiper-slide>
        {/if}
      </swiper-container>
    </div>
  {:else}
    <Loading text="Loading..."></Loading>
  {/if}
</div>

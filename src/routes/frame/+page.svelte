<script>
  import { goto } from "$app/navigation";
  import { onDestroy, onMount } from "svelte";
  import { photosStore, photoFrame as photoFrames } from "../../stores/photos";
  import { appSettings } from "../../stores/appSetting";
  import {
    ArrowLeftCircleIcon,
    ArrowRightCircleIcon,
  } from "svelte-feather-icons";

  let autoContinueTimer;
  let autoCountdownTimer;
  let swiperEl;
  let selectedIp;
  let selectedFrame = null;
  let isLoading = true;
  let frames;
  onMount(async () => {
    photosStore.subscribe((v) => {
      selectedIp = v.photoIp;
    });

    photoFrames.subscribe((v) => {
      frames = v.filter((f) => f.ip_id === selectedIp.id);
      startCountdownTimer();
    });

    appSettings.update((state) => {
      return {
        ...state,
        backgroundPage: "/background/BACKGROUND 7.jpg",
        title: "Pilih Frame",
      };
    });

    isLoading = false;
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

<div class="size-full block pb-15">
  <h1
    class="inline-flex p-2 font-bold text-xl text-center bg-base-100 border-3 border-b-6 border-base-200 rounded-full"
  >
    Waktu anda sisa {autoCountdownTimer}
  </h1>
  <div
    class="h-full mx-auto flex flex-wrap justify-start gap-2 rounded-md overflow-auto"
  >
    {#if frames && Object.keys(frames).length > 2}
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
      class="mx-auto h-10/12 w-3/4"
      slides-per-view="2"
      space-between="30"
      navigation="true"
    >
      {#if frames}
        {#each Object.entries(frames) as [i, frame]}
          <swiper-slide class="p-5 h-full flex items-center justify-center">
            <div
              class="shadow-lg rounded-xl h-full bg-white border border-1 border-base-300 aspect-[2/3] flex justify-center p-5"
              on:click={() => selectFrame(frame.id)}
            >
              <figure class="aspect-[2/3] overflow-hidden flex bg-amber-800">
                {#if [1, 3].includes(frame.id)}
                  <img
                    src={frame.src}
                    alt="/frame/Styling 1.png"
                    class="object-cover w-1/2 h-full"
                  />
                  <img
                    src={frame.src}
                    alt="/frame/Styling 1.png"
                    class="object-cover w-1/2 h-full"
                  />
                {:else}
                  <img
                    src={frame.src}
                    alt="/frame/Styling 1.png"
                    class="object-cover w-full h-full"
                  />
                {/if}
              </figure>
            </div>
          </swiper-slide>
        {/each}
      {:else}
        <div
          class="w-3/4 h-full shadow-lg border border-1 border-base-300"
          on:click={() => {
            const frameRand = Math.floor(Math.random() * frames.length);
            selectFrame(frames[frameRand].id);
          }}
        >
          <figure class="h-full p-2 border-base-200 shadow overflow-hidden">
            <img
              src="/frame/Styling 1.png"
              alt="/frame/Styling 1.png"
              class="object-contain w-full h-full"
            />
          </figure>
        </div>
      {/if}
    </swiper-container>
  </div>
</div>

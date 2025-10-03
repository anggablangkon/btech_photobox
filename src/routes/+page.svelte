<script>
  import { afterNavigate, goto } from "$app/navigation";
  import CardProduct from "$lib/components/CardProduct.svelte";
  import { onMount } from "svelte";
  import { photosStore } from "../stores/photos";
  import { appSettings } from "../stores/appSetting";
  import {
    ArrowRightCircleIcon,
    ArrowLeftCircleIcon,
  } from "svelte-feather-icons";
  let swiperEl;
  let selectedType;
  let isLoading = true;
  const photoTypes = [
    {
      id: 1,
      title: "Standard",
      img: "/Standard.png",
      description: "Cetakan 4 kali foto ",
      price: "30000",
    },
    {
      id: 2,
      title: "Strip",
      img: "/Strip.png",
      description: "Cetakan 4 kali foto dan bisa di potong menjadi dua",
      price: "35000",
    },
  ];

  afterNavigate(() => {
    appSettings.update((state) => {
      return {
        ...state,
        backgroundPage: "/background/BACKGROUND 1.jpg",
        title: "Select Produk",
      };
    });
  });

  onMount(() => {
    isLoading = false;
  });

  const prevSlide = () => {
    swiperEl?.swiper.slidePrev();
  };
  const nextSlide = () => {
    swiperEl?.swiper.slideNext();
  };

  const goPaymentPage = (data) => {
    const { photoType } = data;
    photosStore.update((state) => {
      return { ...state, photoType: photoType };
    });
    goto("/payment");
  };
</script>

{#if !isLoading}
  <div class="mx-auto flex items-center size-full">
    <!-- Button positioned absolute to the wrapper -->
    {#if Object.keys(photoTypes) > 2}
      <button
        type="button"
        class="absolute left-0 top-1/2 -translate-y-1/2 rounded-full text-white bg-blue-300 .prev-button"
        on:click={prevSlide}
      >
        <ArrowLeftCircleIcon size="32" />
      </button>
      <button
        type="button"
        class="absolute right-0 top-1/2 -translate-y-1/2 rounded-full text-white bg-blue-300 .next-button"
        on:click={nextSlide}
      >
        <ArrowRightCircleIcon size="32" />
      </button>
    {/if}

    <swiper-container
      bind:this={swiperEl}
      class="w-3/4 h-11/12 mx-auto"
      slides-per-view="2"
      space-between="30"
      navigation="true"
    >
      {#each photoTypes as photoType, i}
        <swiper-slide>
          <CardProduct {photoType} onSelect={goPaymentPage}></CardProduct>
        </swiper-slide>
      {/each}
    </swiper-container>
  </div>
{:else}
  <div class="w-full my-auto text-center">
    <span class="loading"></span>
  </div>
{/if}

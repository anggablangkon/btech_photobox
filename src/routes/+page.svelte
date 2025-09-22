<script>
  import { goto } from "$app/navigation";
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

  onMount(() => {
    appSettings.update((state) => {
      return {
        ...state,
        backgroundPage: "/background/BACKGROUND 1.jpg",
        title: "Pilih Produk",
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

  const goPaymentPage = (photoType) => {
    selectedType = photoType;
    photosStore.update((state) => {
      return { ...state, photoType: selectedType };
    });
    alert("test");
    goto("/payment");
  };
</script>

{#if !isLoading}
  <div class="flex justify-center relative h-full">
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
      class="w-3/4 h-11/12"
      slides-per-view="2"
      space-between="30"
      navigation="true"
    >
      {#each photoTypes as photoType, i}
        <swiper-slide>
          <CardProduct {photoType} onSelect={goPaymentPage}></CardProduct>

          <!-- <div
            class="w-full h-full flex flex-col shrink items-center border-4 bg-blue-50 shadow-md mx-auto text-center rounded-xl
        {selectedType && selectedType.id == photoType.id
              ? 'border-blue-400'
              : 'border-blue-100'}"
            on:click={() => goPaymentPage(photoType)}
          >
            <h1 class="mb-3 font-bold text-xl mt-3">{photoType.title}</h1>
            <div class="w-5/6 h-10/12 bg-blue-200 items-center rounded-xl">
              <img src={photoType.img} alt="" class="h-full mx-auto" />
            </div>
            <p class="mt-3 text-white-500 w-5/6 text-center mx-auto">
              {photoType.description}
            </p>
            <h1
              class="mb-3 inline-flex font-bold bg-red-600 text-white p-2 rounded-xl ,mt-2"
            >
              Rp{parseInt(photoType.price).toLocaleString("id-id")}
            </h1>
          </div> -->
        </swiper-slide>
      {/each}
    </swiper-container>
  </div>
{:else}
  <div class="w-full my-auto text-center">
    <span class="loading"></span>
  </div>
{/if}

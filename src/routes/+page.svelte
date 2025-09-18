<script>
  import { goto } from "$app/navigation";
  import { photosStore } from "../stores/photos";
  import {
    ArrowRightCircleIcon,
    ArrowLeftCircleIcon,
  } from "svelte-feather-icons";
  let swiperEl;
  let selectedType;
  const photoTypes = [
    {
      id: 1,
      title: "Standard",
      img: "/Standard.png",
      description: "Lorem ipsum aja 1",
      price: "30000",
    },
    {
      id: 2,
      title: "Strip",
      img: "/Strip.png",
      description: "Lorem ipsum aja 2",
      price: "35000",
    },
  ];

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
    goto("/payment");
  };
</script>

<div class="w-full flex flex-col items-center justify-center h-full">
  <h1 class="mb-3 font-bold text-xl">Pilih Produk</h1>
  <div class="w-full flex justify-center relative">
    <!-- Button positioned absolute to the wrapper -->
    {#if Object.keys(photoTypes) > 2}
      <button
        class="absolute left-0 top-1/2 -translate-y-1/2 rounded-full text-white bg-blue-300 .prev-button"
        on:click={prevSlide}
      >
        <ArrowLeftCircleIcon size="32" />
      </button>
      <button
        class="absolute right-0 top-1/2 -translate-y-1/2 rounded-full text-white bg-blue-300 .next-button"
        on:click={nextSlide}
      >
        <ArrowRightCircleIcon size="32" />
      </button>
    {/if}
    <swiper-container
      bind:this={swiperEl}
      class="w-3/4 h-full"
      slides-per-view="2"
      space-between={10}
      navigation="true"
    >
      {#each photoTypes as photoType, i}
        <swiper-slide>
          <div
            class="w-4/6 flex flex-col shrink items-center border-4 bg-blue-50 shadow-md mx-auto text-center
        {selectedType && selectedType.id == photoType.id
              ? 'border-blue-400'
              : 'border-blue-100'}"
            on:click={() => goPaymentPage(photoType)}
          >
            <h1 class="mb-3 font-bold text-xl mt-3">Standard</h1>
            <div class="w-5/6 bg-blue-200 items-center">
              <img src={photoType.img} alt="" class="h-[400px] mx-auto" />
            </div>
            <p class="mt-1 text-white-500 w-5/6 text-sm">
              {photoType.description}
            </p>
            <h1 class="mb-3 font-bold text-lg">
              {parseInt(photoType.price).toLocaleString("id-ID")}
            </h1>
          </div>
        </swiper-slide>
      {/each}
    </swiper-container>
  </div>
</div>

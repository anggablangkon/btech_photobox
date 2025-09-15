<script>
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  import { photosStore, resetPhotoStore } from "../../stores/photos.js";
  let swiperEl;
  let photoType;

  onMount(async () => {
    photosStore.subscribe((v) => {
      photoType = v.photoType;
    });

    if (Object.keys(photoType).length < 1) {
      goto("/");
    }
  });

  function backToHomePage() {
    resetPhotoStore();
    goto("/");
  }
</script>

<div class="mx-auto w-5/6 h-5/6 my-auto items-center justify-center">
  <h1 class="mb-3 font-bold text-xl text-center">Ringkasan Pembayaran</h1>

  {#if photoType && Object.keys(photoType).length > 0}
    <div class="w-full h-full flex justify-center relative mx-auto">
      <div class="p-2 w-1/2">
        <div
          class="w-3/4 h-3/4 p-2 bg-base-300/25 shadow-md mx-auto text-center my-3"
        >
          <h1 class="mb-3 font-bold text-xl mt-3">{photoType.title}</h1>
          <div class=" w-5/6 h-5/6 bg-base-300 items-center mx-auto">
            <img src={photoType.img} alt="" class="h-full mx-auto" />
          </div>
          <p class="mt-3 text-white-500 w-5/6 text-sm text-center mx-auto">
            {photoType.description}
          </p>
          <h1 class="mb-3 font-bold text-lg">
            Rp{parseInt(photoType.price).toLocaleString("id-id")}
          </h1>
        </div>
        <p class="text-center">Pastikan Anda sudah siap setelah membayar</p>
      </div>
      <div class="p-2 w-1/2">
        <div class="flex flex-grow flex-col mx-auto w-3/4 h-3/4 p-3">
          <div class="mx-auto my-auto h-5/6 min-w-100 border"></div>
          <div class="grid grid-cols-2 gap-3 mt-auto w-full">
            <button
              class="p-2 bg-base-300 border-2 rounded-md text-white"
              on:click={backToHomePage}>Kembali</button
            >
            <button
              class="p-2 bg-primary rounded-md text-white"
              on:click={() => goto("/ip")}>Saya Sudah Membayar</button
            >
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="w-full flex justify-center items-center h-full w-full">
      <span class="loading loading-dots loading-xl"></span>
    </div>
  {/if}
</div>

<script>
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { photosStore, photoFrame as photoFrames } from "../../stores/photos";

  let selectedType;
  let selectedFrame = null;
  let frames;
  onMount(async () => {
    photoFrames.subscribe((v) => {
      frames = v;
    });
  });
</script>

<div class="w-full block pb-15">
  <h1 class="mb-3 font-bold text-xl text-center">Pilih Frame</h1>
  <div
    class="h-full mx-auto flex flex-wrap justify-center gap-2 rounded-md p-1 overflow-auto"
  >
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
    </div>
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
    </div>
  </div>
</div>

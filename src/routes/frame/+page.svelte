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

<div class="w-full h-full overflow-hidden">
  <h1 class="mb-3 font-bold text-xl text-center">Pilih Frame</h1>
  <div
    class="w-full grid grid-cols-2 gap-4 h-full bg-base-200/50 py-4 px-2 rounded-md overflow-hidden"
  >
    <div
      class="h-[600px] shadow-lg border border-1 border-base-300"
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
      class="h-[600px] shadow-lg border border-1 border-base-300"
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

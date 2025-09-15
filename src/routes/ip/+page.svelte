<script>
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { photosStore, photoFrame as photoFrames } from "../../stores/photos";

  let selectedType;
  let selectedFrame = null;
  let ips = [
    { title: "Sheila On 7", img: "/ip/Sheila.png" },
    { title: "Noah", img: "/ip/noah.jpg" },
    { title: "Jumbo", img: "/ip/jumbo.jpg" },
    { title: "One For All", img: "/ip/one_for_all.jpg" },
  ];
  let frames;
  onMount(async () => {
    photoFrames.subscribe((v) => {
      frames = v;
    });
  });

  function onSelectIp(ip) {
    const selectedIp = ip;
    photosStore.update((state) => {
      return { ...state, photoIp: selectedIp };
    });
    goto("/frame");
  }
</script>

<div class="w-full overflow-hidden">
  <h1 class="mb-3 font-bold text-xl text-center">Pilih IP</h1>
  {#if ips}
    <div
      class="mx-auto flex flex-wrap gap-2 bg-base-200/50 rounded-md justify-start p-1 h-full overflow-auto"
    >
      {#each Object.entries(ips) as [i, ip]}
        <div
          class="h-[300px] w-[300px] order-base-300 bg-base-100 rounded-lg border border-2 shadow overflow-hidden hover:bg-blue-800"
          on:click={onSelectIp(ip)}
        >
          <figure class="h-5/6 w-full inline-flex overflow-hidden">
            <img
              src={ip.img}
              alt={ip.img}
              class="object-contain w-full my-auto"
            />
          </figure>
          <p class="m-0 text-center pt-2">{ip.title}</p>
        </div>
      {/each}
    </div>
  {:else}
    <div class="mx-auto">
      <span class="loading loading-spinner loading-xl"></span>
    </div>
  {/if}
</div>

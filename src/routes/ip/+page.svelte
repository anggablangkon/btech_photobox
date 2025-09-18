<script>
  import { goto } from "$app/navigation";
  import { onDestroy, onMount } from "svelte";
  import { photosStore, photoFrame as photoFrames } from "../../stores/photos";

  let selectedType;
  let autoCountdownTimer = null;
  let autoContinueTimer;
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

    startCountdownTimer();
  });

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
    goto("/frame");
  }
</script>

<div class="w-full overflow-hidden">
  <div class="flex justify-between">
    <h1 class="mb-3 font-bold text-xl text-center">Pilih IP</h1>
    <h1 class="mb-3 font-bold text-xl text-center">
      Waktu anda sisa {autoCountdownTimer}
    </h1>
  </div>
  {#if ips}
    <div
      class="mx-auto flex flex-wrap gap-2 justify-start p-1 h-full overflow-auto"
    >
      {#each Object.entries(ips) as [i, ip]}
        <div
          class="h-[200px] w-[200px] overflow-hidden"
          on:click={() => onSelectIp(ip)}
        >
          <figure
            class="h-5/6 border-2 w-full inline-flex overflow-hidden rounded-md shadow-sm"
          >
            <img
              src={ip.img}
              alt={ip.img}
              class="object-contain h-full w-full"
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

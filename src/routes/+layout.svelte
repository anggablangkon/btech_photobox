<script>
  import { onMount, setContext, tick } from "svelte";
  import "../app.css";
  import { register } from "swiper/element/bundle";
  import { appSettings } from "../stores/appSetting";
  import { photosStore } from "../stores/photos";

  let title;
  let background = "";
  let audio;
  let isMuted = false;
  let currentUrl = "";

  onMount(async () => {
    register();
  });

  $: title = $appSettings.title;
  $: background = $appSettings.backgroundPage;
  $: currentUrl = $photosStore.selectedSong?.song_url || "";
  $: if (currentUrl) {
    audio.src = currentUrl || "";
    audio.play();
  }

  function muteAudio() {
    if (audio) {
      audio.muted = !audio.muted;
      isMuted = !isMuted;
    }
  }

  function destroyAudio() {
    if (audio) {
      audio.pause();
      audio.src = "";
    }
  }

  setContext("layoutFunctions", { muteAudio, isMuted, destroyAudio });
</script>

<div
  class="size flex flex-col h-screen font-sans overflow-hidden"
  data-theme="light"
  style={`background-image: url('${background}'); background-size: cover; background-position: center;`}
>
  <!-- Main (always fills screen below header) -->
  <audio bind:this={audio} loop></audio>
  <main class="size-full mx-auto px-10 overflow-auto z-0">
    <!-- Scrollable content -->
    <div class="flex-grow flex-col flex size-full py-5">
      {#if title != null}
        <span
          class="p-2 bg-base-100 border-base-200 border-3 border-b-6 rounded-full inline-flex mx-auto px-10 text-xl font-bold shadow-2xl"
        >
          {title}
        </span>
      {/if}
      <slot />
    </div>
  </main>
</div>

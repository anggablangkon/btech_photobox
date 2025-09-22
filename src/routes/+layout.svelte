<script>
  import { onMount, tick } from "svelte";
  import "../app.css";
  import { register } from "swiper/element";
  import { appSettings } from "../stores/appSetting";


  let title;
  let background = "";
  let isLoading = true;

  onMount(async () => {
    appSettings.subscribe((v) => {
      title = v.title;
      background = v.backgroundPage;
    });
    register();
    isLoading = false;
    await tick();
  });
</script>

<div
  class="flex flex-col h-screen font-sans overflow-hidden"
  data-theme="light"
>
  <!-- Main (always fills screen below header) -->
  <main
    class="size-full max-w-12xl mx-auto px-10 pt-3 overflow-auto z-0"
    style={`background-image: url('${background}'); background-size: cover; background-position: center;`}
  >
    <!-- Scrollable content -->
    <div
      class="flex-grow flex-col flex size-full pt-4 pb-4 h-full"
      class:hidden={isLoading}
    >
      {#if title != null}
        <span
          class="p-2 bg-base-100 border-base-200 border-3 border-b-6 rounded-full inline-flex mx-auto px-10 mb-5 text-xl font-bold shadow-2xl"
        >
          {title}
        </span>
      {/if}
      <slot />
    </div>
    <div
      class="flex size-full items-center justify-center"
      class:hidden={!isLoading}
    >
      <span class="loading mx-auto my-auto"></span>
    </div>
  </main>
</div>

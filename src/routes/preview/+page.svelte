<script>
  import {
    photosStore,
    photoFrame,
    photoOptions,
  } from "../../stores/photos.js";
  import { goto } from "$app/navigation";
  import { onMount, onDestroy, tick } from "svelte";
  import html2canvas from "html2canvas-pro";
  import { filterPresets } from "$lib/filterPresets.js";
  import { appSettings } from "../../stores/appSetting.js";

  let photos = [];
  let frame;
  let frameOption;
  let selectedMenu = "filter";
  let autoContinueTimer = 0;
  let autoContinueCountdown;
  let selectedFilter = "normal";
  let processSaving = false;
  let finishStatus = false;
  let isLoading = true;
  let selectedFrameType = 1;
  let unsubscribe;

  onMount(async () => {
    unsubscribe = photosStore.subscribe((v) => {
      selectedFrameType = v.frameType || 7;
      photos = v.photos || [];
    });
    photoFrame.subscribe((v) => {
      frame = v.find((frame) => frame.id == selectedFrameType);
    });

    photoOptions.subscribe((v) => {
      frameOption = v[frame.frame_id];
    });

    appSettings.update((state) => {
      return {
        ...state,
        backgroundPage: "/background/BACKGROUND 9.jpg",
        title: "Select Filter",
      };
    });

    await tick();
    console.log(frame);
    isLoading = false;
    startAutoContinueTimer();
  });

  onDestroy(() => {
    clearInterval(autoContinueTimer);
  });

  async function finishSessionFilter() {
    selectedMenu = "sticker";
    processSaving = true;
    const node = document.querySelector(".frame");
    const photoContainers = document.querySelectorAll(
      ".frame div.absolute img"
    );
    const filteredPhotos = [];
    // Replace images with canvas
    await Promise.all(
      Array.from(photoContainers).map((img) => {
        return new Promise((resolve) => {
          const filter = img.style.filter || "";
          const index = img?.dataset.index;
          if (!filter) return resolve();

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          const imageObj = new Image();
          imageObj.src = img.src;
          imageObj.onload = () => {
            // Use the displayed size of the img
            const displayWidth = img.offsetWidth;
            const displayHeight = img.offsetHeight;

            canvas.width = displayWidth;
            canvas.height = displayHeight;

            // Apply filter
            ctx.filter = filter;

            // === Object-fit: cover emulation ===
            const iw = imageObj.width;
            const ih = imageObj.height;
            const cw = canvas.width;
            const ch = canvas.height;

            const scale = Math.max(cw / iw, ch / ih);
            const sw = iw * scale;
            const sh = ih * scale;

            const dx = (cw - sw) / 2;
            const dy = (ch - sh) / 2;

            ctx.filter = filter;
            ctx.drawImage(imageObj, dx, dy, sw, sh);

            // Replace image with canvas in DOM
            if (!img.parentNode) {
              console.warn("Image has no parent node:", img);
              return resolve();
            }
            img.parentNode.replaceChild(canvas, img);
            resolve();
          };
        });
      })
    );
    await tick();

    if (!node) {
      alert("Frame element not found!");
      isLoading = false;
      return;
    }
    html2canvas(node, {
      useCORS: true,
      allowTaint: false,
      scale: 2,
    }).then((a) => {
      const dataUrl = a.toDataURL("img/png", 1.0);
      photosStore.update((state) => {
        return { ...state, imageResult: dataUrl };
      });

      goto("/song");
    });
  }

  function startAutoContinueTimer() {
    clearInterval(autoContinueTimer);
    autoContinueCountdown = 30;

    autoContinueTimer = setInterval(() => {
      autoContinueCountdown -= 1;
      if (autoContinueCountdown <= 0) {
        clearInterval(autoContinueTimer);
        finishSessionFilter();
      }
    }, 1000);
  }
</script>

{#if !isLoading}
  <div class="content h-[80vh] w-full">
    <!-- FRAME -->
    <div class="flex justify-end ms-auto gap-2 w-full">
      <button
        on:click={finishSessionFilter}
        class="btn font-bold p-2 bg-base-100 border border-3 border-b-6 border-base-200 rounded-full px-10 btn-lg"
        class:hidden={finishStatus}
        disabled={processSaving}
      >
        Finish
        <span class="loading" class:hidden={!processSaving}></span>
      </button>
      <!-- 
    <button
      on:click={downloadImage}
      class="btn bg-base-100 border border-base-200 shadow rounded-full border-3 border-b-6 relative"
      class:hidden={!finishStatus}
    >
      ⬇️ Download Frame
    </button> -->

      <span
        class="font-bold p-2 bg-base-100 border border-3 border-b-6 border-base-200 rounded-full"
      >
        Waktu tersisa {autoContinueCountdown} detik lagi
      </span>
    </div>

    <div class="flex gap-6 p-6 flex-wrap max-h-full">
      {#if frame}
        <div
          class="flex justify-center overflow-hidden flex-shrink-0 w-1/3 rounded-4xl"
        >
          <div class="p-2 bg-base-200 rounded-md shadow h-min shadow-xl">
            <div
              id="frame"
              class="frame relative bg-white overflow-hidden object-contain"
              style="height:{frame.height}px;width:{frame.width}px;"
              on:click={deselectSticker}
            >
              <img
                src={frame.src}
                class="absolute z-10 h-full w-[{frame.width}px] frame"
              />
              {#each frameOption || [] as t, i}
                {#if photos[t.image - 1]}
                  <div
                    class="absolute overflow-hidden shadow flex items-center justify-center {t.image}"
                    style="left:{t.x}px; top:{t.y}px; width:{t.w}px; height:{t.h}px;"
                  >
                    <img
                      src={photos[t.image - 1] || ""}
                      alt={`Foto ${i}`}
                      class="h-full w-full object-cover"
                      crossorigin="anonymous"
                      style="filter:{filterPresets[selectedFilter] || ''}; "
                      data-index={i}
                    />
                  </div>
                {:else}
                  <div
                    class="absolute overflow-hidden shadow flex items-center justify-center {t.image}"
                    style="left:{t.x}px; top:{t.y}px; width:{t.w}px; height:{t.h}px;"
                  >
                    <img
                      src={photos[t.image - 1] ||
                        "photo-1606107557195-0e29a4b5b4aa.webp"}
                      alt={`Foto ${i}`}
                      class="h-full w-full object-cover"
                      crossorigin="anonymous"
                      style="filter:{filterPresets[selectedFilter] || ''}; "
                      data-index={i}
                    />
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        </div>
      {/if}

      <div class="h-[75vh] flex-1 rounded-xl overflow-hidden gap-2 w-full">
        <div class="grid grid-cols-3 gap-5 max-h-full overflow-y-auto">
          {#each Object.entries(filterPresets) as [filterName, filterValue]}
            <button
              type="button"
              class={`w-full flex-shrink-0 cursor-pointer text-center p-3`}
              on:click={() => (selectedFilter = filterName)}
            >
              <figure
                class={`aspect-square w-8/12 overflow-hidden mx-auto rounded-xl shadow ${
                  selectedFilter === filterName
                    ? "border-4 border-base-200"
                    : ""
                }`}
              >
                <img
                  src="https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"
                  alt={filterName}
                  class="object-cover w-full h-full"
                  style={`filter:${filterValue}`}
                />
              </figure>
              <div
                class={`px-10 py-2 border-3 border-b-6 inline-flex text-xl rounded-full mt-3 shadow ${
                  selectedFilter === filterName
                    ? "bg-base-200 border-base-200 text-white"
                    : "bg-base-100 border-base-200"
                }`}
              >
                <h2 class="card-title text-sm">{filterName}</h2>
              </div>
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>
{:else}
  <div class="w-full my-auto text-center">
    <span class="loading"></span>
  </div>
{/if}

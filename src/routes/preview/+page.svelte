<script>
  import {
    photosStore,
    photoFrame,
    photoOptions,
  } from "../../stores/photos.js";
  import { goto } from "$app/navigation";
  import { onMount, onDestroy } from "svelte";
  import Konva from "konva";
  import html2canvas from "html2canvas-pro";

  let stage;
  let layer;
  let photos = [];
  let tr;
  let frame;
  let frameOption;
  let selectedMenu = "filter";
  let selectedFilter = "normal";

  const filterPresets = {
    normal: "",
    grayscale: "grayscale(100%)",
    bright: "brightness(150%)",
    vintage: "sepia(0.5) contrast(1.2) brightness(1.1)",
    noir: "grayscale(100%) contrast(2) brightness(0.8)",
    pastel: "saturate(1.2) brightness(1.2) contrast(0.9)",
  };

  let selectedFrameType = 1;
  const availableStickers = ["😎", "🎉", "❤️", "✨", "😂", "🌸", "👑"];
  let unsubscribe;

  onMount(() => {
    unsubscribe = photosStore.subscribe((v) => {
      selectedFrameType = v.frameType || 2;
      photos = v.photos || [];
    });
    photoFrame.subscribe((v) => {
      frame = v[selectedFrameType];
    });

    photoOptions.subscribe((v) => {
      frameOption = v[selectedFrameType];
    });
  });

  $: if (frame) {
    stage = new Konva.Stage({
      container: "frame-sticker",
      width: frame.width,
      height: frame.height,
    });
    layer = new Konva.Layer();
    stage.add(layer);

    tr = new Konva.Transformer({
      centeredScaling: true,
    });
    layer.add(tr);

    // clicks should select/deselect shapes
    stage.on("click tap", function (e) {
      // if we are selecting with rect, do nothing
      // if click on empty area - remove all selections
      if (e.target === stage) {
        tr.nodes([]);
        return;
      }

      tr.nodes([e.target]);
    });
  }

  // --- Stickers ---
  function addSticker(content) {
    const simpleText = new Konva.Text({
      x: stage.width() / 2,
      y: 15,
      text: content,
      fontSize: 48,
      draggable: true,
    });

    layer.add(simpleText);
  }

  function updateSticker(idx, key, value) {
    stickers[idx] = { ...stickers[idx], [key]: value };
    stickers = [...stickers];
  }

  function toggleFlip(idx) {
    stickers[idx] = { ...stickers[idx], flipped: !stickers[idx].flipped };
    stickers = [...stickers];
  }
  function removeSticker(idx) {
    stickers = stickers.filter((_, i) => i !== idx);
  }

  function finishSession() {
    alert("✅ Frame selesai!");
    photosStore.set([]);
    goto("/");
  }

  function deselectSticker(e) {
    if (e.target.closest(".sticker")) return;
  }

  // ... your existing code ...

  async function downloadImage() {
    // Now capture the frame
    const node = document.querySelector(".frame");

    html2canvas(node, {
      useCORS: true,
      allowTaint: false,
      imageTimeout: 3000,
      scale: 2,
    }).then((canvas) => {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "photobox.png";
      link.click();
    });
  }

  async function finishSessionFilter() {
    selectedMenu = "sticker";
    const photoContainers = document.querySelectorAll(
      ".frame div.absolute img"
    );

    console.log(photoContainers);

    // Replace images with canvas
    await Promise.all(
      Array.from(photoContainers).map((img) => {
        return new Promise((resolve) => {
          const filter = img.style.filter || "";
          if (!filter) return resolve();

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          const imageObj = new Image();
          imageObj.src = img.src;
          imageObj.onload = () => {
            canvas.width = img.width; // match displayed size
            canvas.height = img.height;

            // Apply filter
            ctx.filter = filter;
            ctx.drawImage(imageObj, 0, 0, canvas.width, canvas.height);

            // Replace image with canvas in DOM
            if (!img.parentNode) {
              console.warn("Image has no parent node:", img);
              return resolve();
            }

            img.parentNode.replaceChild(canvas, img);
            console.log(img.parentNode);

            resolve();
          };
        });
      })
    );
  }
</script>

<div class="content">
  <!-- FRAME -->
  <div class="inline-flex ms-auto gap-2 w-full s">
    <!-- Action Buttons -->
    <button on:click={finishSession} class="btn btn-success">
      ✅ Selesai
    </button>

    <button on:click={downloadImage} class="btn btn-primary">
      ⬇️ Download Frame
    </button>
  </div>

  <div class="flex flex-col xl:flex-row gap-6 p-6 overflow-hidden">
    {#if frame}
      <div
        class="flex justify-center md:items-center overflow-hidden w-full h-full"
      >
        <div
          id="frame"
          class="frame relative shadow-lg overflow-hidden object-contain"
          style="height:{frame.height}px;width:{frame.width}px;"
          on:click={deselectSticker}
        >
          <img src={frame.src} class="absolute z-10 h-full" alt="" srcset="" />
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
                />
              </div>
            {/if}
          {/each}
          <div id="frame-sticker" class="z-20 absolute"></div>
        </div>
      </div>
    {/if}

    <div class="tabs tabs-border xl:w-1/2">
      <!-- FILTER TAB -->
      <input
        type="radio"
        name="menuPreview"
        class="tab"
        aria-label="Filter"
        bind:group={selectedMenu}
        value="filter"
        disabled={selectedMenu != "filter"}
      />
      <div class="tab-content bg-base-100 p-2">
        <div
          class="w-full flex xl:flex-wrap overflow-x-auto xl:overflow-y-auto gap-12 py-2 max-h-[500px]"
        >
          {#each Object.entries(filterPresets) as [filterName, filterValue]}
            <div
              class="card flex-shrink-0 xl:flex-shrink-1 w-40 bg-base-100 shadow-sm text-center cursor-pointer hover:shadow-md
          {selectedFilter === filterName ? 'border-2 border-primary' : ''}"
              on:click={() => (selectedFilter = filterName)}
            >
              <figure class="w-full h-40 overflow-hidden">
                <img
                  src="https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"
                  alt={filterName}
                  class="object-cover w-full h-full"
                  style={`filter:${filterValue}`}
                />
              </figure>
              <div class="card-body p-2">
                <h2 class="card-title text-sm">{filterName}</h2>
              </div>
            </div>
          {/each}
        </div>
        <button on:click={finishSessionFilter} class="btn btn-primary">
          Finish
        </button>
      </div>

      <!-- STICKER TAB -->
      <input
        type="radio"
        name="menuPreview"
        class="tab"
        aria-label="Sticker"
        bind:group={selectedMenu}
        value="sticker"
        disabled={selectedMenu != "sticker"}
      />
      <div class="tab-content bg-base-100 p-10">
        <div class="w-full flex flex-col gap-6 overflow-y-auto">
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">✨ Tambah Stiker:</span>
            </label>
            <div class="flex gap-2 flex-wrap">
              {#each availableStickers as st}
                <button
                  class="btn btn-sm btn-outline"
                  on:click={() => addSticker(st)}
                >
                  {st}
                </button>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

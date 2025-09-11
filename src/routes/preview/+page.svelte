<script>
  import { photosStore } from "../../stores/photos.js";
  import { goto } from "$app/navigation";
  import { onMount, onDestroy } from "svelte";
  import Konva from "konva";
  import html2canvas from "html2canvas-pro";
  import select from "daisyui/components/select/index.js";
  import { stages } from "konva/lib/Stage";

  let frameEl;
  let stage;
  let layer;
  let photos = [];
  let selectedFilter = "normal";
  let widthFrame = 0;
  let heightFrame = 0;
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

  const framesTemplatesPx = {
    1: [
      { image: 1, x: 25, y: 25, w: 450, h: 550 },
      { image: 1, x: 25, y: 25, w: 450, h: 550 },
      { image: 1, x: 25, y: 25, w: 450, h: 550 },
      { image: 1, x: 25, y: 25, w: 450, h: 550 },
    ],
    2: [
      { image: 1, x: 26, y: 16, w: 215, h: 153 },
      { image: 2, x: 339, y: 16, w: 215, h: 153 },
      { image: 1, x: 26, y: 205, w: 215, h: 153 },
      { image: 2, x: 339, y: 205, w: 215, h: 153 },
    ],
    3: [
      { image: 1, x: 23, y: 82, w: 160, h: 96 },
      { image: 2, x: 23, y: 201, w: 160, h: 96 },
      { image: 3, x: 23, y: 320, w: 160, h: 96 },
      { image: 3, x: 215, y: 82, w: 160, h: 96 },
      { image: 2, x: 215, y: 201, w: 160, h: 96 },
      { image: 1, x: 215, y: 320, w: 160, h: 96 },
    ],
    4: [
      { image: 1, x: 26, y: 16, w: 215, h: 153 },
      { image: 2, x: 339, y: 16, w: 215, h: 153 },
      { image: 1, x: 26, y: 205, w: 215, h: 153 },
      { image: 2, x: 339, y: 205, w: 215, h: 153 },
    ],
  };

  const frameBg = {
    1: { src: "/frame/frame2.png", width: 600, height: 400 },
    2: { src: "/frame/frame2.png", width: 600, height: 400 },
    3: { src: "/frame/frame.png", width: 400, height: 600 },
    4: { src: "/frame/frame2.png", width: 600, height: 400 },
  };

  let unsubscribe;

  onMount(() => {
    unsubscribe = photosStore.subscribe((v) => {
      selectedFrameType = v.frameType || 0;
      photos = v.photos || [];
    });

    stage = new Konva.stages({
      container: "frame",
      width: frameBg[selectedFilter].width,
      height: frameBg[selectedFilter].height,
    });
  });

  onDestroy(() => {
    unsubscribe && unsubscribe();
  });

  // --- Stickers ---
  function addSticker(content) {
    const simpleText = new Konva.Text({
      x: stage.width() / 2,
      y: 15,
      text: content,
      fontSize: 48,
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

  function downloadImage() {
    const node = document.querySelector(".frame");

    html2canvas(node, {
      scale: 2, // higher resolution
    }).then((canvas) => {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "photobox.png";
      link.click();
    });
  }
</script>

<!-- FRAME -->
<div class="inline-flex ms-auto gap-2 w-full">
  <!-- Action Buttons -->
  <button on:click={finishSession} class="btn btn-success"> ✅ Selesai </button>

  <button on:click={downloadImage} class="btn btn-primary">
    ⬇️ Download Frame
  </button>
</div>

<div class="flex flex-col 2xl:flex-row gap-6 p-6 overflow-hidden">
  <div
    class="flex justify-center md:items-center overflow-hidden w-full h-full"
  >
    <div
      id="frame"
      class="frame relative shadow-lg overflow-hidden"
      style="height:{frameBg[selectedFrameType].height}px;width:{frameBg[
        selectedFrameType
      ].width}px;"
      on:click={deselectSticker}
    >
      <img
        src={frameBg[selectedFrameType].src}
        class="absolute z-10"
        alt=""
        srcset=""
      />
      {#each framesTemplatesPx[selectedFrameType] || [] as t, i}
        {#if photos[t.image - 1]}
          <div
            class="absolute overflow-hidden shadow flex items-center justify-center {t.image}"
            style="left:{t.x}px; top:{t.y}px; width:{t.w}px; height:{t.h}px;"
          >
            <img
              src={photos[t.image - 1]}
              alt={`Foto ${i}`}
              class="w-full object-cover"
              style="filter:{filterPresets[selectedFilter] || ''}; "
            />
          </div>
        {/if}
      {/each}
    </div>
  </div>

  <!-- name of each tab group should be unique -->
  <div class="tabs tabs-border xl:w-1/2">
    <input
      type="radio"
      name="menuPreview"
      class="tab"
      aria-label="Filter"
      checked="checked"
    />
    <div class="tab-content bg-base-100 p-2">
      <div
        class="w-full flex xl:flex-wrap overflow-x-auto xl:overflow-y-auto gap-12 py-2 max-h-[500px]"
      >
        <!-- Filter -->
        {#each Object.entries(filterPresets) as [filterName, filterValue]}
          <div
            class="card shrink xl:shrink-1 w-40 bg-base-100 shadow-sm text-center cursor-pointer hover:shadow-md
            {selectedFilter === filterName ? 'border-2 border-primary' : ''}"
            on:click={() => (selectedFilter = filterName)}
          >
            <figure class="w-full h-40 overflow-hidden">
              <img
                src="https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"
                alt={filterName}
                class="object-cover w-full h-full"
                style="filter: {filterValue};"
              />
            </figure>
            <div class="card-body p-2">
              <h2 class="card-title text-sm">{filterName}</h2>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <input type="radio" name="menuPreview" class="tab" aria-label="Stiker" />
    <div class="tab-content bg-base-100 p-10">
      <div class="w-full flex flex-col gap-6 overflow-y-auto">
        <!-- CONTROLS -->
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

    <input type="radio" name="menuPreview" class="tab" aria-label="Tab 3" />
    <div class="tab-content bg-base-100 p-10">Tab content 3</div>
  </div>
</div>

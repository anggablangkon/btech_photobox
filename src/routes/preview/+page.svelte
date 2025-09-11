<script>
  import { photosStore } from "../../stores/photos.js";
  import { goto } from "$app/navigation";
  import { onMount, onDestroy } from "svelte";
  import Konva from "konva";
  import html2canvas from "html2canvas-pro";

  let stage;
  let layer;
  let selectedMenu = "filter";
  let photos = [];
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
      selectedFrameType = v.frameType || 1;
      photos = v.photos || [];
    });

    stage = new Konva.Stage({
      container: "frame-sticker",
      width: frameBg[selectedFrameType].width,
      height: frameBg[selectedFrameType].height,
    });
    layer = new Konva.Layer();
    stage.add(layer);

  });

  onDestroy(() => {
    unsubscribe && unsubscribe();
  });

  // --- Stickers ---
  function addSticker(content) {
    console.log(stage);
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
    const photoContainers = document.querySelectorAll(
      ".frame div.absolute img"
    );

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
            img.parentNode.replaceChild(canvas, img);

            resolve();
          };
        });
      })
    );

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

  function finishSessionFilter() {
    selectedMenu = "sticker";
  }
</script>

<!-- FRAME -->
<div class="inline-flex ms-auto gap-2 w-full s">
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
      <div id="frame-sticker" class="z-20 absolute"></div>
    </div>
  </div>

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
            class="card shrink xl:shrink-1 w-40 bg-base-100 shadow-sm text-center cursor-pointer hover:shadow-md
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

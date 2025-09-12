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
      selectedFrameType = v.frameType || 5;
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

  function finishSession() {
    alert("✅ Frame selesai!");
    photosStore.set([]);
    goto("/");
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

  <div class="flex gap-6 p-6 flex-wrap">
    {#if frame}
      <div
        class="flex justify-center md:items-center overflow-hidden w-[400px] h-[600px] flex-shrink-0"
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

    <div class="flex-1 flex flex-col gap-3 overflow-hidden">
      <div class="py-3 px-2 shadow-md rounded-md bg-base-200">
        <h5 class="font-bold mb-2">Filter</h5>
        <div class="flex overflow-x-auto gap-2 py-2 max-h-[500px]">
          {#each Object.entries(filterPresets) as [filterName, filterValue]}
            <div
              class="card w-40 h-40 flex-shrink-0
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
      </div>
      <div class="flex-1 py-3 px-2 shadow-md rounded-md bg-base-200">
        <h5 class="font-bold mb-2">Filter</h5>
        <div class="flex overflow-x-auto gap-2 py-2 h-11/12 w-full">
          {#each Object.entries(filterPresets) as [filterName, filterValue]}
            <div
              class="card p-2 flex-shrink-0 w-40
            {selectedFilter === filterName ? 'border-2 border-primary' : ''}"
              on:click={() => (selectedFilter = filterName)}
            >
              <img
                src="/frame/Styling 1.png"
                alt="/frame/Styling 1.png"
                class="object-cover w-full"
                style={`filter:${filterValue}`}
              />
              <div class="card-body p-2">
                <h2 class="card-title text-sm">{filterName}</h2>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

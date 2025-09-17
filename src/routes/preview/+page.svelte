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

  let photos = [];
  let frame;
  let frameOption;
  let selectedMenu = "filter";
  let autoContinueTimer = 0;
  let autoContinueCountdown;
  let selectedFilter = "normal";
  let selectedFrameFilter = "normal";
  let finishStatus = false;
  const filterPresets = {
    normal: "",
    grayscale: "grayscale(100%)",
    bright: "brightness(150%)",
    vintage: "sepia(0.5) contrast(1.2) brightness(1.1)",
    noir: "grayscale(100%) contrast(2) brightness(0.8)",
    pastel: "saturate(1.2) brightness(1.2) contrast(0.9)",
  };

  let selectedFrameType = 1;
  let unsubscribe;

  onMount(() => {
    unsubscribe = photosStore.subscribe((v) => {
      selectedFrameType = v.frameType || 3;
      photos = v.photos || [];
    });
    photoFrame.subscribe((v) => {
      frame = v.find(frame => frame.id == selectedFrameType);
       console.log(frame,selectedFrameType)
    });

    photoOptions.subscribe((v) => {
      frameOption = v[selectedFrameType];
    });

    startAutoContinueTimer();
  });

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

    const frame = document.querySelector("img.frame");
    const canvasFrame = document.createElement("canvas");
    const ctx = canvasFrame.getContext("2d");
    const imageObj = new Image();
    imageObj.src = frame.src;
    imageObj.onload = () => {
      const filter = frame.style.filter || "";
      if (!filter) return resolve();
      console.log(imageObj.offsetHeight, frame.offsetWidth);
      const displayWidth = frame.offsetWidth;
      const displayHeight = frame.offsetHeight;

      canvasFrame.width = displayWidth;
      canvasFrame.height = displayHeight;

      // Apply filter
      ctx.filter = filter;

      // === Object-fit: cover emulation ===
      const iw = imageObj.width;
      const ih = imageObj.height;
      const cw = canvasFrame.width;
      const ch = canvasFrame.height;

      const scale = Math.max(cw / iw, ch / ih);
      const sw = iw * scale;
      const sh = ih * scale;

      const dx = (cw - sw) / 2;
      const dy = (ch - sh) / 2;

      ctx.filter = filter;
      ctx.drawImage(imageObj, dx, dy, sw, sh);
      canvasFrame.className = "absolute z-10 h-full frame";
      // Replace image with canvas in DOM
      if (!frame.parentNode) {
        console.warn("Image has no parent node:", frame);
        return resolve();
      }

      frame.parentNode.replaceChild(canvasFrame, frame);
    };

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

            resolve();
          };
        });
      })
    );
    // finishStatus = true;

    const node = document.querySelector(".frame");

    html2canvas(node, {
      useCORS: true,
      allowTaint: false,
      imageTimeout: 3000,
      scale: 2,
    }).then((canvas) => {
      photosStore.update((state) => {
        return { ...state, imageResult: canvas };
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

<div class="content h-[80vh] w-full">
  <!-- FRAME -->
  <div class="flex justify-between ms-auto gap-2 w-full">
    <button
      on:click={finishSessionFilter}
      class="btn btn-primary"
      class:hidden={finishStatus}
    >
      Finish
    </button>
<!-- 
    <button
      on:click={downloadImage}
      class="btn btn-primary"
      class:hidden={!finishStatus}
    >
      ⬇️ Download Frame
    </button> -->
    
    <span class="font-bold">
      Waktu tersisa {autoContinueCountdown} detik lagi
    </span>
  </div>

  <div class="flex gap-6 p-6 flex-wrap max-h-full">
    {#if frame}
      <div
        class="flex justify-center md:items-center overflow-hidden flex-shrink-0 w-1/3 rounded-4xl my-auto"
      >
        <div class="p-10 bg-emerald-400 rounded-2xl">
          <div
            id="frame"
            class="frame relative shadow-lg overflow-hidden object-contain"
            style="height:{frame.height}px;width:400px;"
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
          </div>
        </div>
      </div>
    {/if}

    <div class="h-[75vh] flex-1 flex flex-col overflow-hidden gap-2 w-full">
      <div class="py-3 px-2 shadow-md rounded-md bg-base-200 h-3/8">
        <h5 class="font-bold mb-2 h-1/8">Filter</h5>
        <div class="flex gap-2 overflow-x-auto h-7/8">
          {#each Object.entries(filterPresets) as [filterName, filterValue]}
            <div
              class={`card w-[180px] h-[180px] flex-shrink-0 cursor-pointer ${
                selectedFilter === filterName ? "border-2 border-primary" : ""
              }`}
              on:click={() => (selectedFilter = filterName)}
            >
              <figure class="w-full h-full overflow-hidden">
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

      <!-- <div class="flex-1 py-3 px-2 shadow-md rounded-md bg-base-200 h-3/8">
        <h5 class="font-bold mb-2 h-1/10">Frame Background</h5>
        <div class="flex overflow-x-auto gap-2 py-2 w-full h-9/10">
          {#each Object.entries(filterPresets) as [filterName, filterValue]}
            <div
              class="card p-2 flex-shrink-0 h-full
            {selectedFrameFilter === filterName
                ? 'border-2 border-primary'
                : ''}"
              on:click={() => (selectedFrameFilter = filterName)}
            >
              <img
                src="/frame/Styling 1.png"
                alt="/frame/Styling 1.png"
                class="object-cover w-full h-11/12"
                style={`filter:${filterValue}`}
              />
              <div class="card-body p-2">
                <h2 class="card-title text-sm">{filterName}</h2>
              </div>
            </div>
          {/each}
        </div>
      </div> -->
    </div>
  </div>
</div>

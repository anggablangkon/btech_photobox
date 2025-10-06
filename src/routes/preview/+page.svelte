<script>
  import { photosStore, photoOptions } from "../../stores/photos.js";
  import { afterNavigate, goto } from "$app/navigation";
  import { onMount, onDestroy, tick } from "svelte";
  import html2canvas from "html2canvas-pro";
  import { filterPresets } from "$lib/filterPresets.js";
  import {
    base64ToBlob,
    getAssetUrl,
    loadImageWithCORS,
  } from "$lib/helpers/image.js";
  import { createOrder } from "$lib/api/order.js";
  import { appSettings } from "../../stores/appSetting.js";
  let photos = [],
    frame,
    frameOptions,
    isSaving,
    selectedMenu = "filter",
    autoContinueTimer = 0,
    autoContinueCountdown,
    selectedFilter = "normal",
    processSaving = false,
    finishStatus = false,
    isLoading = true,
    imageResult = null,
    selectedFrameType = 1;

  afterNavigate(() => {
    appSettings.update((state) => {
      return {
        ...state,
        backgroundPage: "/background/BACKGROUND 9.jpg",
        title: "Select Filter",
      };
    });
  });

  $: photoData = $photosStore;
  $: photos = photoData.photos || [];
  $: selectedFrameType = photoData.frameType.id;
  $: frame = photoData.frameType;
  $: frameOptions = frame ? $photoOptions?.[frame.frame_id] : null;

  onMount(async () => {
    await tick();
    isLoading = false;
    console.log(photos, photoOptions);
    startAutoContinueTimer();
  });

  onDestroy(() => {
    clearInterval(autoContinueTimer);
  });

  async function finishSessionFilter() {
    clearInterval(autoContinueTimer);
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
          imageObj.crossOrigin = "anonymous"; // Add this for CORS
          imageObj.src = img.src;
          imageObj.onload = () => {
            // Use the actual image dimensions, not display dimensions
            const actualWidth = imageObj.naturalWidth || imageObj.width;
            const actualHeight = imageObj.naturalHeight || imageObj.height;

            // Get the display size for aspect ratio calculation
            const displayWidth = img.offsetWidth;
            const displayHeight = img.offsetHeight;

            // Calculate scale factor to maintain quality
            const pixelRatio = window.devicePixelRatio || 1;
            const scaleFactor = Math.max(2, pixelRatio); // Use at least 2x for quality

            // Set canvas size to maintain quality
            canvas.width = displayWidth * scaleFactor;
            canvas.height = displayHeight * scaleFactor;

            // Scale the context to match
            ctx.scale(scaleFactor, scaleFactor);

            // Apply filter
            ctx.filter = filter;

            // === Object-fit: cover emulation with high quality ===
            const iw = actualWidth;
            const ih = actualHeight;
            const cw = displayWidth; // Use display width for calculations
            const ch = displayHeight; // Use display height for calculations

            const scale = Math.max(cw / iw, ch / ih);
            const sw = iw * scale;
            const sh = ih * scale;

            const dx = (cw - sw) / 2;
            const dy = ch - sh;

            // Draw with high quality settings
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            // Apply filter again (sometimes gets reset)
            ctx.filter = filter;

            // Draw the image
            ctx.drawImage(imageObj, dx, dy, sw, sh);

            // Set canvas display size to match original image
            canvas.style.width = displayWidth + "px";
            canvas.style.height = displayHeight + "px";
            canvas.style.objectFit = "cover";
            canvas.style.objectPosition = "bottom";

            // Copy any relevant attributes from the original image
            canvas.className = img.className;
            canvas.dataset.index = img.dataset.index;

            // Replace image with canvas in DOM
            if (!img.parentNode) {
              console.warn("Image has no parent node:", img);
              return resolve();
            }
            img.parentNode.replaceChild(canvas, img);
            resolve();
          };

          imageObj.onerror = () => {
            console.error("Failed to load image:", img.src);
            resolve(); // Continue even if one image fails
          };
        });
      })
    );

    await generateFrameImage(node);

    await tick();

    if (!node) {
      alert("Frame element not found!");
      isLoading = false;
      return;
    }
    html2canvas(node, {
      useCORS: false,
      allowTaint: false,
      scale: 3, // Use device pixel ratio for sharp capture
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 0,
      removeContainer: true,
      foreignObjectRendering: false, // Sometimes helps with quality
    }).then(async (a) => {
      // Create a new canvas at desired output size
      const outputCanvas = document.createElement("canvas");
      const outputCtx = outputCanvas.getContext("2d");

      // Set output size (you can adjust these for final quality)
      const outputWidth = 1000; // 2x the original 400px
      const outputHeight = 1500; // 2x the original 600px

      outputCanvas.width = outputWidth;
      outputCanvas.height = outputHeight;

      // Enable high-quality scaling
      outputCtx.imageSmoothingEnabled = true;
      outputCtx.imageSmoothingQuality = "high";

      // Draw the high-resolution capture onto the output canvas
      outputCtx.drawImage(a, 0, 0, outputWidth, outputHeight);

      // Convert to PNG with maximum quality
      const dataUrl = outputCanvas.toDataURL("image/png", 1.0);
      imageResult = dataUrl;

      photosStore.update((state) => {
        return { ...state, imageResult: dataUrl };
      });
      processSaving = false;
      const resp = await saveToOrder();
      goto("/result");
    });
  }

  async function generateFrameImage(node) {
    const frameImg = new Image();
    frameImg.crossOrigin = "anonymous";
    frameImg.src = frame.image;

    const frameCanvasReady = new Promise((resolve) => {
      frameImg.onload = () => {
        const frameCanvas = document.createElement("canvas");
        const ctx = frameCanvas.getContext("2d");

        // Match canvas to container (.frame-wallpaper)
        const frameEl = document.querySelector(".frame-wallpaper");
        const cw = node.offsetWidth;
        const ch = node.offsetHeight;
        frameCanvas.width = cw;
        frameCanvas.height = ch;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high ";

        const iw = frameEl?.clientWidth;
        const ih = frameEl?.clientHeight;

        // Center the image without resizing
        const dx = (cw - iw) / 2;
        const dy = (ch - ih) / 2;

        // Draw image at its original size
        ctx.drawImage(frameImg, dx, dy, iw, ih);

        // Style and position
        frameCanvas.style.position = "absolute";
        frameCanvas.style.top = frameEl.offsetTop + "px";
        frameCanvas.style.left = frameEl.offsetLeft + "px";
        frameCanvas.style.width = `${cw}px`;
        frameCanvas.style.height = `${ch}px`;
        frameCanvas.style.zIndex = "1";

        node.insertBefore(frameCanvas, node.firstChild);
        frameEl?.remove();
        resolve();
      };

      frameImg.onerror = () => {
        console.error("Failed to load frame.image s");
        resolve(); // Continue without blocking
      };
    });
  }

  async function saveToOrder() {
    if (isSaving) {
      console.log("[SONG] Already saving, skipping...");
      return;
    }

    isSaving = true;
    try {
      const form = new FormData();

      // Basic order information
      form.append("order_id", photoData.order_id || "");
      if (photoData.background) {
        form.append("image_id", photoData.background.id || "");
      }
      form.append("type", photoData.photoType?.title || "");
      form.append("ip_id", photoData.photoIp?.id || "");
      form.append("frame_id", photoData.frameType?.id || "");
      form.append("price", photoData.photoType?.price || "");

      // Song selection
      const songId = photoData.selectedSong ? photoData.selectedSong.id : null;
      form.append("song_id", songId || "");

      console.log("[SONG] Basic form data added");

      // Main processed image
      if (imageResult) {
        const imageBlob = base64ToBlob(imageResult, "image/jpeg");
        if (imageBlob) {
          form.append("image_result", imageBlob, "processed_image.jpg");
          console.log("[SONG] Main image added to form");
        } else {
          console.error("[SONG] Failed to convert main image");
        }
      }

      // Individual photos
      if (photoData.photos && Array.isArray(photoData.photos)) {
        const formPhoto = [];
        photoData.photos.forEach((photo, index) => {
          if (photo && typeof photo === "string") {
            const photoBlob = base64ToBlob(photo, "image/jpeg");
            if (photoBlob) {
              form.append(`photos[${index}]`, photoBlob, `photo_${index}.jpg`);
              console.log(`[SONG] Photo ${index} added to form`);
            }
          }
        });
      } else {
        console.warn("[SONG] No photos array found or invalid format");
      }

      // Debug: Log form contents
      console.log("[SONG] Form data contents:");
      for (let pair of form.entries()) {
        console.log(
          `${pair[0]}:`,
          pair[1] instanceof Blob ? `Blob (${pair[1].size} bytes)` : pair[1]
        );
      }

      // Send to API with retry logic
      let retryCount = 0;
      const maxRetries = 1;

      async function attemptCreateOrder() {
        try {
          console.log(
            `[SONG] Attempting to create order (attempt ${retryCount + 1}/${maxRetries + 1})`
          );
          const response = await createOrder(form);
          console.log("[SONG] Order saved successfully:", response);
          console.log(response);

          photosStore.update((state) => {
            return {
              ...state,
              order_id: response.order_id || state.order_id,
              share_url: response.data,
            };
          });

          // Navigate to result page on success
          // goto("/result");
        } catch (error) {
          console.error(
            `[SONG] Error saving order (attempt ${retryCount + 1}):`,
            error
          );

          // if (retryCount < maxRetries) {
          //   retryCount++;
          //   console.log(`[SONG] Retrying... (${retryCount}/${maxRetries})`);
          //   await new Promise((resolve) =>
          //     setTimeout(resolve, 1000 * retryCount)
          //   ); // Exponential backoff
          //   await attemptCreateOrder();
          // } else {
          //   console.error("[SONG] Max retries reached. Order creation failed.");
          //   alert("Failed to save order. Please try again.");
          //   throw error;
          // }
        }
      }
      await attemptCreateOrder();
    } catch (error) {
      console.error("[SONG] Final error in saveToOrder:", error);
    } finally {
      isSaving = false;
      processSaving = false;
    }
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

      <span
        class="font-bold p-2 bg-base-100 border border-3 border-b-6 border-base-200 rounded-full"
      >
        Waktu tersisa {autoContinueCountdown} detik lagi
      </span>
    </div>

    {#if isSaving}
      <div
        class="fixed inset-0 bg-black/90 bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="bg-white rounded-lg p-6 text-center">
          <span class="loading loading-spinner loading-lg mb-4"></span>
          <p class="text-lg font-semibold">Saving your order...</p>
          <p class="text-sm text-gray-600">
            Please wait, this may take a moment
          </p>
        </div>
      </div>
    {/if}

    <div class="flex gap-6 p-6 flex-wrap h-full">
      {#if frame}
        <div
          class="flex justify-center overflow-hidden flex-shrink-0 w-1/3 rounded-4xl"
        >
          <div class="p-2 bg-base-200 rounded-md h-full shadow-xl">
            <div
              id="frame"
              class="frame relative bg-white overflow-hidden object-contain h-full aspect-[2/3]"
            >
              <img
                src={getAssetUrl(frame.image)}
                class="absolute z-10 size-full frame-wallpaper"
                crossorigin="anonymous"
                alt={frame.name}
              />
              {#each frameOptions || [] as t, i}
                {#if photos[t.image - 1]}
                  <div
                    class="absolute overflow-hidden shadow flex items-center justify-center {t.image}"
                    style="left:{t.x}%; top:{t.y}%; width:{t.w}%; height:{t.h}%;"
                  >
                    <img
                      src={photos[t.image - 1] || ""}
                      alt={`Foto ${i}`}
                      class="h-full w-full object-cover object-bottom"
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
                      class="h-full w-full object-cover object-bottom"
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
      <div
        class="bg-yellow-100 h-full flex-1 rounded-xl overflow-hidden gap-2 w-full"
      >
        <div class="flex flex-wrap gap-5 justify-between overflow-y-auto">
          {#each Object.entries(filterPresets) as [filterName, filterValue]}
            <button
              type="button"
              class={`w-[200px] aspect-square cursor-pointer text-center p-3`}
              disabled={processSaving}
              on:click={() => (selectedFilter = filterName)}
            >
              <figure
                class={`aspect-square w-full overflow-hidden mx-auto rounded-xl shadow border border-base-100 ${
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

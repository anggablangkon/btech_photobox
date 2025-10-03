<script>
  import { afterNavigate, goto } from "$app/navigation";
  import { onDestroy, onMount, tick } from "svelte";
  import { photosStore } from "../../stores/photos";
  import { appSettings } from "../../stores/appSetting";
  import { getBackgroundById, getBackgroundsByIpId } from "$lib/api/background";
  import Konva from "konva";
  import { getAssetUrl } from "$lib/helpers/image";

  let autoContinueTimer;
  let autoCountdownTimer;
  let selectedIp;
  let stickerLists = [];
  let isLoading = true;
  let video;
  let stage;
  let layer;
  let stream;
  let tr;
  let selectedSticker = null;
  let canvasContainer;
  let draggedSticker = null;
  let dragPreview = null;

  afterNavigate(() => {
    appSettings.update((state) => {
      return {
        ...state,
        backgroundPage: "/background/BACKGROUND 6.jpg",
        title: "Select Background",
      };
    });
  });

  $: selectedIp = $photosStore.photoIp;

  onMount(async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1024 },
          height: { ideal: 768 },
          facingMode: "user",
        },
        audio: false,
      });

      stickerLists = await getBackgroundsByIpId(selectedIp.id);
      console.log("[BACKGROUND] Stickers loaded:", stickerLists);

      isLoading = false;
      await tick();

      // Get canvas container reference
      canvasContainer = document.getElementById("custom-canvas");

      // Initialize Konva stage
      stage = new Konva.Stage({
        container: "custom-canvas",
        width: canvasContainer.offsetWidth,
        height: canvasContainer.offsetHeight,
      });

      layer = new Konva.Layer();
      stage.add(layer);

      // Create transformer
      tr = new Konva.Transformer({
        rotateAnchorOffset: 60,
        enabledAnchors: [
          "top-left",
          "top-center",
          "top-right",
          "middle-right",
          "middle-left",
          "bottom-left",
          "bottom-center",
          "bottom-right",
        ],
      });
      layer.add(tr);

      // Set up video
      video.srcObject = stream;

      video.addEventListener("loadedmetadata", () => {
        console.log(
          "[BACKGROUND] Video dimensions:",
          video.videoWidth,
          video.videoHeight
        );

        // Resize stage to match container
        const containerWidth = canvasContainer.offsetWidth;
        const containerHeight = canvasContainer.offsetHeight;
        stage.width(containerWidth);
        stage.height(containerHeight);
        layer.draw();
      });

      // Handle clicks on empty areas (deselect stickers)
      stage.on("click tap", (e) => {
        if (e.target === stage) {
          deselectSticker();
          return;
        }
      });

      video.play();

      // Add global mouse/touch event listeners for drag and drop
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
      document.addEventListener("touchmove", handleGlobalTouchMove);
      document.addEventListener("touchend", handleGlobalTouchEnd);
    } catch (error) {
      console.error("[BACKGROUND] Error initializing:", error);
      alert("Error accessing camera: " + error.message);
      isLoading = false;
    }
  });

  // Start drag from sticker button
  function startStickerDrag(event, stickerImage) {
    event.preventDefault();

    if (!stickerImage) return;

    console.log("[STICKER] Starting drag for:", stickerImage);

    draggedSticker = stickerImage;

    // Create drag preview element
    createDragPreview(event, stickerImage);
  }

  function createDragPreview(event, imageSrc) {
    // Remove existing preview
    if (dragPreview) {
      document.body.removeChild(dragPreview);
    }

    // Create preview element
    dragPreview = document.createElement("div");
    dragPreview.style.position = "fixed";
    dragPreview.style.pointerEvents = "none";
    dragPreview.style.zIndex = "9999";
    dragPreview.style.width = "60px";
    dragPreview.style.height = "60px";
    dragPreview.style.opacity = "0.8";
    dragPreview.style.transform = "translate(-50%, -50%)";

    const img = document.createElement("img");
    img.src = imageSrc;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    img.style.borderRadius = "8px";
    img.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";

    dragPreview.appendChild(img);
    document.body.appendChild(dragPreview);

    // Position preview at cursor/touch
    const clientX =
      event.clientX || (event.touches && event.touches[0].clientX);
    const clientY =
      event.clientY || (event.touches && event.touches[0].clientY);

    dragPreview.style.left = clientX + "px";
    dragPreview.style.top = clientY + "px";
  }

  function handleGlobalMouseMove(event) {
    if (!draggedSticker || !dragPreview) return;

    // Update preview position
    dragPreview.style.left = event.clientX + "px";
    dragPreview.style.top = event.clientY + "px";
  }

  function handleGlobalTouchMove(event) {
    if (!draggedSticker || !dragPreview) return;

    const touch = event.touches[0];
    if (touch) {
      dragPreview.style.left = touch.clientX + "px";
      dragPreview.style.top = touch.clientY + "px";
    }
  }

  function handleGlobalMouseUp(event) {
    if (!draggedSticker) return;

    handleDrop(event.clientX, event.clientY);
  }

  function handleGlobalTouchEnd(event) {
    if (!draggedSticker) return;

    const touch = event.changedTouches[0];
    if (touch) {
      handleDrop(touch.clientX, touch.clientY);
    }
  }

  function handleDrop(clientX, clientY) {
    if (!draggedSticker || !canvasContainer) {
      cleanupDrag();
      return;
    }

    // Check if drop is over canvas
    const canvasRect = canvasContainer.getBoundingClientRect();
    const isOverCanvas =
      clientX >= canvasRect.left &&
      clientX <= canvasRect.right &&
      clientY >= canvasRect.top &&
      clientY <= canvasRect.bottom;

    if (isOverCanvas) {
      // Calculate position relative to canvas
      const canvasX = clientX - canvasRect.left;
      const canvasY = clientY - canvasRect.top;

      // Create sticker at drop position
      createStickerAtPosition(draggedSticker, canvasX, canvasY);
    }

    cleanupDrag();
  }

  function cleanupDrag() {
    // Remove preview element
    if (dragPreview) {
      document.body.removeChild(dragPreview);
      dragPreview = null;
    }

    draggedSticker = null;
  }

  function createStickerAtPosition(imageSrc, x, y) {
    console.log("[STICKER] Creating sticker at position:", x, y);

    const imageObj = new Image();
    imageObj.crossOrigin = "anonymous";

    imageObj.onload = function () {
      // Calculate appropriate size
      const maxSize = Math.min(stage.width(), stage.height()) * 0.2;
      const scale = Math.min(
        maxSize / imageObj.width,
        maxSize / imageObj.height
      );

      const stickerWidth = imageObj.width * scale;
      const stickerHeight = imageObj.height * scale;

      const konvaImage = new Konva.Image({
        image: imageObj,
        x: x - stickerWidth / 2, // Center on drop position
        y: y - stickerHeight / 2,
        width: stickerWidth,
        height: stickerHeight,
        draggable: true,
        name: "sticker",
      });

      // Add event listeners
      konvaImage.on("click tap", (e) => {
        e.cancelBubble = true;
        selectSticker(konvaImage);
      });

      konvaImage.on("dblclick dbltap", (e) => {
        e.cancelBubble = true;
        removeSticker(konvaImage);
      });

      layer.add(konvaImage);
      layer.draw();

      // Auto-select the newly created sticker
      selectSticker(konvaImage);
    };

    imageObj.onerror = function () {
      console.error("[STICKER] Failed to load sticker image:", imageSrc);
      alert("Failed to load sticker image");
    };

    imageObj.src = imageSrc;
  }

  function selectSticker(sticker) {
    console.log("[STICKER] Selecting sticker:", sticker);

    deselectSticker();
    selectedSticker = sticker;
    tr.nodes([sticker]);
    tr.moveToTop();
    layer.draw();
  }

  function deselectSticker() {
    selectedSticker = null;
    tr.nodes([]);
    layer.draw();
  }

  function removeSticker(sticker) {
    console.log("[STICKER] Removing sticker:", sticker);

    if (selectedSticker === sticker) {
      deselectSticker();
    }

    sticker.destroy();
    layer.draw();
  }

  function clearAllStickers() {
    const stickers = layer.find(".sticker");
    stickers.forEach((sticker) => sticker.destroy());
    deselectSticker();
  }

  function finishSession() {
    deselectSticker();
    const dataURL = stage.toDataURL({ pixelRatio: 3 });

    photosStore.update((state) => {
      return { ...state, photoSticker: dataURL };
    });

    goto("/photobooth");
  }

  onDestroy(() => {
    console.log("[BACKGROUND] Cleaning up...");

    // Remove global event listeners
    document.removeEventListener("mousemove", handleGlobalMouseMove);
    document.removeEventListener("mouseup", handleGlobalMouseUp);
    document.removeEventListener("touchmove", handleGlobalTouchMove);
    document.removeEventListener("touchend", handleGlobalTouchEnd);

    // Clean up drag preview
    cleanupDrag();

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
      video.srcObject = null;
    }

    if (stage) {
      stage.destroy();
    }

    clearInterval(autoContinueTimer);
  });
</script>

{#if !isLoading}
  <div class="grid grid-cols-2 h-full gap-5 my-10">
    <!-- Video and Canvas Container -->
    <div class="w-full h-full flex flex-col items-center">
      <div
        class="border-4 h-2/4 my-auto border-white shadow-lg overflow-hidden rounded-xl relative max-w-4xl bg-gray-100 aspect-[4/3]"
      >
        <video
          bind:this={video}
          class="h-full w-full object-cover"
          autoplay
          muted
          playsinline
        ></video>
        <div
          class="absolute inset-0 z-10 pointer-events-auto"
          id="custom-canvas"
        ></div>
      </div>

      <!-- Controls -->
      <div class="flex gap-2 flex-wrap">
        {#if selectedSticker}
          <button
            class="btn btn-sm btn-error"
            on:click={() => removeSticker(selectedSticker)}
          >
            Remove Selected
          </button>
        {/if}

        <button class="btn btn-sm btn-warning" on:click={clearAllStickers}>
          Clear All
        </button>

        <button class="btn btn-sm btn-outline" on:click={deselectSticker}>
          Deselect
        </button>
      </div>

      <!-- Instructions -->
      <div
        class="mt-auto bg-amber-100 w-full p-4 text-gray-500 my-2 space-y-1 rounded-xl"
      >
        <ol class="list-decimal mx-2">
          <li>Drag stickers from here to the canvas above</li>
          <li>Click sticker on canvas to select and transform</li>
          <li>Double-click sticker on canvas to remove</li>
          <li>Click empty area to deselect</li>
        </ol>
      </div>
    </div>

    <!-- Sticker Selection -->
    <div class="size-full flex flex-col flex-1 bg-white rounded-xl p-4">
      <h3 class="text-lg font-semibold mb-3">Drag Stickers to Camera</h3>
      <div
        class="flex flex-wrap items-center overflow-x-auto gap-3 pb-2 overflow-y-auto"
      >
        {#if stickerLists && stickerLists.length > 0}
          {#each stickerLists as sticker, i}
            <button
              class="h-40 aspect-square flex-shrink-0 border-3 border-gray-300 rounded-xl overflow-hidden hover:border-blue-500 transition-colors cursor-grab active:cursor-grabbing"
              on:mousedown={(e) => startStickerDrag(e, getAssetUrl(sticker.image))}
              on:touchstart={(e) => startStickerDrag(e, getAssetUrl(sticker.image))}
            >
              {#if sticker.image}
                <img
                  src={getAssetUrl(sticker.image)}
                  alt="Sticker {i + 1}"
                  class="w-full h-full object-cover pointer-events-none"
                  draggable="false"
                />
              {:else}
                <div
                  class="w-full h-full flex items-center justify-center bg-gray-100"
                >
                  <span class="text-xs">No Image</span>
                </div>
              {/if}
            </button>
          {/each}
        {:else}
          <div class="text-gray-500 text-center py-4">
            No stickers available
          </div>
        {/if}
      </div>

      <div class="mt-auto text-end">
        <button
          class="btn btn-lg bg-base-100 border-3 border-b-6 border-base-200 rounded-full"
          on:click={finishSession}
        >
          Selanjutnya
        </button>
      </div>
    </div>
  </div>
{:else}
  <!-- Loading State -->
  <div class="size-full flex items-center justify-center">
    <div class="text-center">
      <span class="loading loading-spinner loading-lg mb-4"></span>
      <p class="text-lg font-semibold">Loading camera and stickers...</p>
      <p class="text-sm text-gray-600 mt-2">
        Please allow camera access when prompted
      </p>
    </div>
  </div>
{/if}

<style>
  video {
    transform: scaleX(-1); /* Mirror the video for a more natural selfie view */
  }

  /* Custom cursor for draggable items */
  .cursor-grab {
    cursor: grab;
  }

  .cursor-grabbing {
    cursor: grabbing;
  }
</style>

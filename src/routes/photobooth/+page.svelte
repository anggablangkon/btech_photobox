<script>
  import { afterNavigate, goto } from "$app/navigation";
  import { onDestroy, onMount, tick } from "svelte";
  import { photoOptions, photosStore } from "../../stores/photos";
  import { appSettings } from "../../stores/appSetting";
  import { getBackgroundsByIpId } from "$lib/api/background";
  import { loadImageWithCORS } from "$lib/helpers/image.js";
  import Konva from "konva";

  let autoContinueTimer,
    captureCountdown,
    isTakingPhoto = false,
    selectedIp,
    isRetake = false,
    photos,
    canvas,
    retakeLimit = 2,
    previewResult,
    retakePhotos = [],
    photoPreview = null,
    stickerLists = [],
    isLoading = true,
    video,
    stage,
    layer,
    stream,
    tr,
    selectedSticker = null,
    canvasContainer,
    draggedSticker = null,
    nextFrameCountdown = 0,
    currentFrame = 0,
    dragPreview = null;

  afterNavigate(() => {
    appSettings.update((state) => {
      return {
        ...state,
        backgroundPage: "/background/BACKGROUND 6.jpg",
        title: "Photo Session",
      };
    });
  });

  $: selectedIp = $photosStore.photoIp;
  $: frameLayout = $photosStore.frameType;
  $: frameOptions = frameLayout ? $photoOptions?.[frameLayout.frame_id] : null;
  $: framesCount = $photosStore.frameType?.count || 4;

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
      photos = Array(framesCount).fill(null);
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

      canvas.width = video.videoWidth || 1024;
      canvas.height = video.videoHeight || 768;

      // Add global mouse/touch event listeners for drag and drop
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
      document.addEventListener("touchmove", handleGlobalTouchMove);
      document.addEventListener("touchend", handleGlobalTouchEnd);
      takeFrame(currentFrame);
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
    goto("/preview");
  }

  async function takeFrame(index, loop = true) {
    isTakingPhoto = true;
    captureCountdown = 10;
    while (captureCountdown > 0) {
      await new Promise((r) => setTimeout(r, 1000));
      captureCountdown -= 1;
    }

    deselectSticker();

    if (!canvas) {
      console.error("Wait for canvas ready");
      return;
    }

    const ctx = canvas.getContext("2d");
    ctx.filter = ""; // no filter
    const videoRatio = video.videoWidth / video.videoHeight; // ratio kamera
    const targetWidth = 1024;
    const targetHeight = 768;
    const targetRatio = targetWidth / targetHeight; // rasio target
    insertVideoCapture({
      ctx,
      videoRatio,
      targetRatio,
      targetWidth,
      targetHeight,
    });

    const background = stage.toDataURL({ pixelRatio: 3 });

    if (background) {
      try {
        const bgImage = await loadImageWithCORS(background);
        insertImageCapture({
          ctx,
          videoRatio,
          targetRatio,
          targetWidth,
          targetHeight,
          bgImage,
        });

        const dataUrl = canvas.toDataURL("image/png");
        processPhotoCapture(dataUrl, index);
        clearAllStickers();
      } catch (error) {
        console.error("[PHOTOBOOTH] Background image error:", error);
        // Continue without background
        const dataUrl = canvas.toDataURL("image/png");
        processPhotoCapture(dataUrl, index);
      }
    } else {
      const dataUrl = canvas.toDataURL("image/png");
      processPhotoCapture(dataUrl, index);
    }
  }

  function processPhotoCapture(dataUrl, index) {
    photoPreview = dataUrl;
    photos[index] = photoPreview;
    photosStore.update((state) => {
      const updatedPhotos = state.photos ? [...state.photos] : [];
      updatedPhotos[index] = dataUrl;
      return { ...state, photos: updatedPhotos };
    });
    isTakingPhoto = false;

    startNextFrameCountdown();
  }

  function startNextFrameCountdown() {
    nextFrameCountdown = 5;
    if (autoContinueTimer) {
      clearInterval(autoContinueTimer);
    }
    autoContinueTimer = setInterval(() => {
      nextFrameCountdown -= 1;
      if (nextFrameCountdown <= 0) {
        clearInterval(autoContinueTimer);
        autoContinueTimer = null;
        if (!isRetake) {
          goNextFrame();
        } else {
          goNextFrameRetake();
        }
      }
    }, 1000);
  }

  function acceptPhoto() {
    if (retakePhotos.length > 0) {
      goNextFrameRetake();
    } else {
      goNextFrame();
    }
  }

  function insertVideoCapture(options) {
    const { ctx, videoRatio, targetRatio, targetWidth, targetHeight } = options;
    let sx, sy, sWidth, sHeight; // area source dari video

    if (videoRatio > targetRatio) {
      // kamera lebih lebar → crop horizontal
      sHeight = video.videoHeight;
      sWidth = sHeight * targetRatio;
      sx = (video.videoWidth - sWidth) / 2;
      sy = 0;
    } else {
      // kamera lebih tinggi → crop vertical
      sWidth = video.videoWidth;
      sHeight = sWidth / targetRatio;
      sx = 0;
      sy = (video.videoHeight - sHeight) / 2;
    }
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(
      video,
      sx,
      sy,
      sWidth,
      sHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );
  }

  function insertImageCapture(options) {
    const { ctx, videoRatio, targetRatio, targetWidth, targetHeight, bgImage } =
      options;
    const imgEl = document.querySelector("img.background");
    const scaledHeight =
      (targetWidth / bgImage.naturalWidth) * bgImage.naturalHeight;
    const y = targetHeight - scaledHeight;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(bgImage, 0, y, targetWidth, scaledHeight);
  }

  function goNextFrame() {
    if (currentFrame + 1 < framesCount) {
      currentFrame += 1;
      photos[currentFrame] = null;
      photoPreview = null;
      takeFrame(currentFrame);
    } else {
      previewResult = true;
      // goto("/preview"); // All frames done
    }
  }

  function addRetakePhoto(index) {
    // find index of this index in the array
    const existingIndex = retakePhotos.indexOf(index);

    if (existingIndex !== -1) {
      // already exists → remove it
      retakePhotos = retakePhotos.filter((i) => i !== index);
    } else {
      // doesn’t exist → add it (if under 2)
      if (retakePhotos.length < retakeLimit) {
        retakePhotos = [...retakePhotos, index]; // reassign for reactivity
        retakePhotos = retakePhotos.slice(0, 2);
      }
    }

    retakePhotos.sort((a, b) => a - b);
  }

  function retakePhoto() {
    if (retakePhotos.length === 0) return;

    currentFrame = retakePhotos[0];
    photos[currentFrame] = null;
    isRetake = true;
    photoPreview = null;
    previewResult = false;
    takeFrame(currentFrame);
  }

  function goNextFrameRetake() {
    retakePhotos.shift();
    retakeLimit -= 1;

    if (retakePhotos.length > 0) {
      currentFrame = retakePhotos[0];
      takeFrame(currentFrame);
      isTakingPhoto = true;
    } else {
      previewResult = true;
      isTakingPhoto = false;
    }
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

<canvas bind:this={canvas} style="display:none;"></canvas>
{#if !isLoading}
  <div class="size-full grid grid-cols-2 overflow-auto py-3 gap-4">
    <!-- Video and Canvas Container -->
    <div class="grid my-auto" class:hidden={previewResult}>
      {#if captureCountdown > 0}
        <div
          class="bg-base-100 px-4 py-2 text-white font-bold rounded-full flex items-center justify-center mt-5 border-base-200 border-3 border-b-6 mx-auto"
        >
          Picture will be taken in {captureCountdown}
        </div>
      {/if}

      <div
        class="border-4 w-3/4 my-2 border-white shadow-lg rounded-3xl relative max-w-4xl bg-gray-100 aspect-[4/3] mx-auto"
        class:hidden={!isTakingPhoto}
      >
        <img
          src="/TEKS CHEERS PHOTOBOOTH-.png"
          alt=""
          width="200px"
          class="absolute top-[-30px] left-[-30px] z-50"
        />
        <video
          bind:this={video}
          class="h-full w-full object-cover rounded-3xl"
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
      <div class="gap-4 mx-auto" class:hidden={!isTakingPhoto}>
        {#if selectedSticker}
          <button
            class="btn btn-sm btn-error"
            on:click={() => removeSticker(selectedSticker)}
          >
            Remove Selected
          </button>
        {/if}

        <button class="btn btn-sm btn-warning" on:click={clearAllStickers}>
          Clear All Sticker
        </button>

        <button class="btn btn-sm btn-outline" on:click={deselectSticker}>
          Deselect Sticker
        </button>
      </div>

      <div
        class="bg-base-100 px-4 py-2 text-white font-bold rounded-full flex items-center justify-center mt-5 border-base-200 border-3 border-b-6 mx-auto"
      class:hidden={!isTakingPhoto}>
        <h1 class="text-2xl">
          Please make sure your position is at the center of the frame
        </h1>
      </div>

      <div
        class="grid w-3/4 aspect-[4/3] my-auto mx-auto"
        class:hidden={isTakingPhoto}
      >
        <div
          class="bg-base-100 px-4 py-2 text-white font-bold rounded-full flex items-center justify-center mt-5 border-base-200 border-3 border-b-6 mx-auto"
        >
          Next Picture will be taken in {nextFrameCountdown}
        </div>
        <div
          class="w-full relative border-double border-5 border-white rounded-3xl my-2"
        >
          <img
            src="/TEKS CHEERS PHOTOBOOTH-.png"
            alt=""
            width="200px"
            class="absolute top-[-30px] left-[-30px] z-50"
          />
          <img src={photoPreview} alt="PHOTO PREVIEW" class="rounded-2xl" />
        </div>
        <!-- <button
          class="btn btn-lg bg-base-100 border-3 border-b-6 border-base-200 rounded-full mt-4 mx-auto"
          class:hidden={isTakingPhoto || previewResult}
          on:click={() => (isRetake ? goNextFrameRetake() : goNextFrame())}
          >Selanjutnya</button
        > -->
      </div>
    </div>

    <div
      class="h-full p-2 bg-pink-300 rounded-lg my-auto mx-auto"
      class:hidden={!previewResult}
    >
      <div
        id="frame"
        class="frame relative shadow-lg overflow-hidden object-contain h-full aspect-2/3"
      >
        <img src={frameLayout.image} class="absolute z-10 h-full" />
        {#each frameOptions || [] as t, i}
          <div
            class="absolute overflow-hidden shadow flex items-center justify-center {t.image}"
            style="left:{t.x}%; top:{t.y}%; width:{t.w}%; height:{t.h}%;"
          >
            <img
              src={photos[t.image - 1] ||
                "photo-1606107557195-0e29a4b5b4aa.webp"}
              alt={`Foto ${i}`}
              class="h-full w-full object-cover object-bottom"
              crossorigin="anonymous"
            />
          </div>
        {/each}
      </div>
    </div>

    <div
      class="bg-pink-200 flex flex-col rounded-xl p-5 shadow border-base-100 border-4"
    >
      {#if !previewResult && isTakingPhoto}
        <h3 class="text-lg text-base-200 font-bold mb-4">
          Drag Stickers to Camera
        </h3>
        <div class="flex flex-wrap items-center gap-3 pb-2 overflow-auto">
          {#if stickerLists && stickerLists.length > 0}
            {#each stickerLists as sticker, i}
              <button
                class="h-40 aspect-square flex-shrink-0 border-3 border-base-200 rounded-xl overflow-hidden hover:border-blue-500 transition-colors cursor-grab active:cursor-grabbing"
                on:mousedown={(e) => startStickerDrag(e, sticker.image)}
                on:touchstart={(e) => startStickerDrag(e, sticker.image)}
              >
                {#if sticker.image}
                  <img
                    src={sticker.image}
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
        <div class="mt-auto bg-amber-100 relative p-4">
          <ol class="list-decimal p-4">
            <li>Drag stickers onto the photo</li>
            <li>Resize and position the stickers as desired</li>
            <li>Tap 2 times on the sticker to delete it</li>
            <li>Tap "Next" to proceed</li>
          </ol>
        </div>
      {:else}
        <h3 class="text-lg text-white font-semibold mb-4 text-base-200">
          Photo Preview
        </h3>
        <div class="flex flex-wrap gap-2 w-full">
          {#each photos as photo, i}
            <button
              class="w-[200px] aspect-[4/3] rounded-xl cursor-pointer p-2 relative {retakePhotos.includes(
                i
              )
                ? 'bg-amber-200'
                : 'bg-amber-50'}"
              aria-roledescription="select frame"
              on:click={() => {
                addRetakePhoto(i);
              }}
            >
              {#if retakePhotos.includes(i)}
                <span
                  class="rounded-full bg-white text-base-300 absolute top-[-5px] end-[-5px] size-7 flex items-center justify-center border-3"
                >
                  {retakePhotos.indexOf(i) + 1}
                </span>
              {/if}

              {#if photo == null}
                <div
                  class="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg"
                >
                  <span class="text-sm">Photo {i + 1}</span>
                </div>
              {:else}
                <img
                  class="h-full w-full object-cover object-bottom"
                  src={photo}
                  alt="Foto 0"
                />
              {/if}
            </button>
          {/each}
        </div>
      {/if}

      {#if previewResult}
        <div class="mt-auto mx-auto inline-flex text-end gap-5">
          {#if retakeLimit > 0}
            <button
              class="btn btn-lg bg-base-100 border-3 border-b-6 border-base-200 rounded-full"
              on:click={retakePhoto}
            >
              Retake Selected
            </button>
          {/if}
          <button
            class="btn btn-lg bg-base-100 border-3 border-b-6 border-base-200 rounded-full"
            on:click={finishSession}
          >
            Selanjutnya
          </button>
        </div>
      {/if}
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

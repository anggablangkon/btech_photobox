<script>
  import { onMount, onDestroy, tick } from "svelte";
  import {
    photosStore,
    photoFrame as photoFrames,
    photoOptions,
  } from "../../stores/photos.js";
  import { afterNavigate, goto } from "$app/navigation";
  import { appSettings } from "../../stores/appSetting.js";
  let videos = [];
  let canvas;

  // Session state
  let photos = [];
  let video;
  let framesCount = 1;
  let currentFrame = 0;
  let selectedFrame = null;
  let retakeLimit = 2;
  let sessionStarted = false;

  // Countdown timers
  let retakePhotos = [];
  let captureCountdown = 0;
  let showBackground = false;
  let autoContinueCountdown = 0;
  let previewResult = false;
  let isTakingPhoto = false;
  let frameLayout = null;
  let frameOptions = null;
  let autoContinueTimer;
  let isCameraOn = false;
  let photoPreview = null;
  let stream;
  let isRetake = false;
  let background;
  let isLoading = true;

  afterNavigate(() => {
    appSettings.update((state) => {
      return {
        ...state,
        backgroundPage: "/background/BACKGROUND 8.jpg",
        title: null,
      };
    });
  });

  onMount(async () => {
    photosStore.subscribe((v) => {
      selectedFrame = v.frameType || 5;
      background = v?.background.url || null;
      console.log(background);
    });

    photoFrames.subscribe((v) => {
      frameLayout = v.find((frame) => frame.id === selectedFrame);
    });

    photoOptions.subscribe((v) => {
      frameOptions = v[frameLayout.frame_id];
    });

    startSession();
  });

  onDestroy(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    clearInterval(autoContinueTimer);
  });

  // --- SESSION FUNCTIONS ---
  async function startSession() {
    sessionStarted = true;
    isLoading = false;
    currentFrame = 0;
    photos = Array(framesCount).fill(null);
    framesCount = frameLayout.count || 4;
    stream = await navigator.mediaDevices.getUserMedia({ video: true });

    if (video) {
      video.srcObject = stream;
      video.play();

      canvas.width = video.videoWidth || 1024;
      canvas.height = video.videoHeight || 768;
    }
    isCameraOn = true;

    takeFrame(currentFrame);
  }

  async function takeFrame(index, loop = true) {
    isTakingPhoto = true;
    captureCountdown = 3;

    while (captureCountdown > 0) {
      await new Promise((r) => setTimeout(r, 1000));
      captureCountdown -= 1;
    }
    showBackground = true;

    if (!canvas) {
      console.error("Wait for canvas ready");
      return;
    }

    const ctx = canvas.getContext("2d");
    isCameraOn = false;

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

    const bgImage = new Image();

    if (background) {
      bgImage.src = background;
      bgImage.onload = () => {
        insertImageCapture({
          ctx,
          videoRatio,
          targetRatio,
          targetWidth,
          targetHeight,
          bgImage,
        });
        const dataUrl = canvas.toDataURL("image/png");

        photoPreview = dataUrl;
        photos[index] = photoPreview;
        photosStore.update((state) => {
          const updatedPhotos = state.photos ? [...state.photos] : [];
          updatedPhotos[index] = dataUrl;
          return { ...state, photos: updatedPhotos };
        });
        isTakingPhoto = false;

        startAutoContinueTimer();
      };
    } else {
      const dataUrl = canvas.toDataURL("image/png");

      photoPreview = dataUrl;
      photos[index] = photoPreview;
      photosStore.update((state) => {
        const updatedPhotos = state.photos ? [...state.photos] : [];
        updatedPhotos[index] = dataUrl;
        return { ...state, photos: updatedPhotos };
      });
      isTakingPhoto = false;

      startAutoContinueTimer();
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

    ctx.drawImage(bgImage, 0, y, targetWidth, scaledHeight);
  }

  function startAutoContinueTimer() {
    clearInterval(autoContinueTimer);
    autoContinueCountdown = 2;

    autoContinueTimer = setInterval(() => {
      autoContinueCountdown -= 1;
      if (autoContinueCountdown <= 0) {
        clearInterval(autoContinueTimer);
        acceptPhoto();
        photoPreview = null;
      }
    }, 1000);
  }

  function acceptPhoto() {
    clearInterval(autoContinueTimer);
    if (isRetake) {
      goNextFrameRetake();
    } else {
      goNextFrame();
    }
  }

  async function retakePhoto(frameIndex) {
    if (retakeLimit == 0) {
      alert("❌ Retake limit reached for this photo!");
      return;
    }

    const retakeUsed = retakePhotos.length;
    retakeLimit -= retakeUsed;

    photos = photos.map((v, i) => {
      return retakePhotos.includes(i) ? null : v;
    });
    isRetake = true;
    currentFrame = retakePhotos[0];
    previewResult = false;
    photos[currentFrame] = null;

    await tick();

    stream = await navigator.mediaDevices.getUserMedia({ video: true });

    if (video) {
      video.srcObject = stream;
      video.play();

      canvas.width = video.videoWidth || 1024;
      canvas.height = video.videoHeight || 768;
    }
    isCameraOn = true;

    takeFrame(currentFrame);
  }

  function goNextFrameRetake() {
    retakePhotos.shift();
    if (retakePhotos.length > 0) {
      currentFrame = retakePhotos[0];
      takeFrame(currentFrame);
      isCameraOn = true;
    } else {
      appSettings.update((state) => {
        return { ...state, title: "Preview Foto" };
      });
      previewResult = true;
      isRetake = false;
    }
  }

  function goNextFrame() {
    if (currentFrame + 1 < framesCount) {
      currentFrame += 1;
      photos[currentFrame] = null;
      isCameraOn = true;
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
  }
</script>

<!-- VIDEO / CAPTURE -->

<canvas bind:this={canvas} style="display:none;"></canvas>
{#if !isLoading}
  {#if previewResult && frameLayout}
    <!-- SESSION SETUP -->
    <div class="flex flex-wrap w-full my-auto">
      <div
        class="flex justify-center md:items-center overflow-hidden flex-shrink-0 w-2/4 rounded-4xl my-auto"
      >
        <div class="p-10 bg-emerald-400 rounded-2xl">
          <div
            id="frame"
            class="frame relative shadow-lg overflow-hidden object-contain"
            style="height:{frameLayout.height}px;width:{frameLayout.width}px"
            px
          >
            <img src={frameLayout.src} class="absolute z-10 h-full" />
            {#each frameOptions || [] as t, i}
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
                />
              </div>
            {/each}
          </div>
        </div>
      </div>
      <div
        class="flex justify-center md:items-center overflow-hidden flex-shrink-0 w-2/4 my-auto"
      >
        <div
          class="bg-emerald-200 rounded-2xl w-full flex flex-col p-10"
          style="height:600px"
        >
          <div class="flex flex-wrap gap-2 w-full">
            {#each photos as photo, i}
              <div
                class="p-5 w-[200px] h-[150px] cursor-pointer p-2
              {retakePhotos.includes(i) ? 'bg-amber-200' : 'bg-amber-50'}"
                aria-roledescription="select frame"
                on:click={() => {
                  addRetakePhoto(i);
                }}
              >
                <img
                  class="h-full w-full object-cover"
                  src={photo}
                  alt="Foto 0"
                />
              </div>
            {/each}
          </div>
          <div class="mt-auto ml-auto">
            {#if retakePhotos.length > 0 && retakeLimit >= retakePhotos.length}
              <button
                type="button"
                class="btn bg-base-100 border border-base-200 shadow rounded-full border-3 border-b-6 relative"
                on:click={retakePhoto}>Retake Photo</button
              >
            {/if}
            <button
              type="button"
              class="btn bg-base-100 border border-base-200 shadow rounded-full border-3 border-b-6 relative"
              on:click={() => goto("/preview")}>Selanjutnya</button
            >
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div
      class="mx-auto my-auto aspect-video relative w-[1024px] h-[768px]"
      class:hidden={!isCameraOn}
    >
      <img
        src="/TEKS CHEERS PHOTOBOOTH-.png"
        alt=""
        width="200px"
        class="absolute top-[-30px] left-[-30px] z-50"
      />
      <video
        bind:this={video}
        autoplay
        playsinline
        muted
        class="w-full h-full border-white rounded-3xl"
      ></video>
      {#if video && background}
        <img
          src={background}
          alt="Background Frame"
          on:load={() => (isCameraOn = true)}
          class="absolute bottom-0 start-0 background"
        />
      {/if}
      {#if isTakingPhoto && captureCountdown > 0}
        <div
          class="absolute inset-0 flex items-center justify-center border-4 rounded-3xl border-white p-4 bg-black/50 text-white text-6xl font-bold z-10"
        >
          {captureCountdown}
        </div>
      {/if}
    </div>
    <span
      class="loading my-auto text-center mx-auto"
      class:hidden={isCameraOn || photoPreview}
    ></span>
  {/if}

  <!-- PHOTO PREVIEW AFTER CAPTURE -->
  {#if photoPreview && !previewResult}
    <div class="my-auto text-center">
      <span
        class="mb-6 text-center p-2 bg-base-100 rounded-full border border-3 border-b-6 text-gray-600"
      >
        Foto {currentFrame + 1} dari {framesCount}
      </span>
      <div class="w-[1024px] h-[768px] mx-auto text-center relative mt-5">
        <img
          src="/TEKS CHEERS PHOTOBOOTH-.png"
          alt=""
          width="200px"
          class="absolute top-[-30px] left-[-30px] z-50"
        />
        {#if showBackground}
          <img
            src={photoPreview}
            alt={`Foto ${currentFrame + 1}`}
            class="mx-auto rounded shadow-md object-cover w-full border-4 border-white rounded-2xl"
          />
        {/if}
      </div>
    </div>
  {/if}
{:else}
  <div class="my-auto items-center text-center">
    <span class="loading"></span>
  </div>
{/if}

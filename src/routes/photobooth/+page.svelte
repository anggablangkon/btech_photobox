<script>
  import { onMount, onDestroy } from "svelte";
  import {
    photosStore,
    photoFrame as photoFrames,
    photoOptions,
  } from "../../stores/photos.js";
  import { goto } from "$app/navigation";

  let videos = [];
  let canvas;

  // Session state
  let photos = [];
  let video;
  let framesCount = 1;
  let currentFrame = 0;
  let selectedFrame = null;
  let retakeLimit = 2;
  let retakeCounts = [];
  let sessionStarted = false;

  // Countdown timers
  let captureCountdown = 0;
  let autoContinueCountdown = 0;
  let previewResult = false;
  let isTakingPhoto = false;
  let frameLayout = null;
  let frameOptions = null;
  let autoContinueTimer;
  let selectedFrameIndex = null;
  let frames = [];
  let stream;

  onMount(async () => {
    photosStore.subscribe((v) => {
      selectedFrame = v.frameType;
    });

    photoFrames.subscribe((v) => {
      frameLayout = v[selectedFrame];
    });

    photoOptions.subscribe((v) => {
      frameOptions = v[selectedFrame];
    });

    console.log(frameLayout, frameOptions);
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
    currentFrame = 0;
    photos = Array(framesCount).fill(null);
    retakeCounts = Array(framesCount).fill(0);
    framesCount = 4;

    stream = await navigator.mediaDevices.getUserMedia({ video: true });

    if (video) {
      video.srcObject = stream;
      video.play();

      console.log(video.videoWidth, video.videoHeight);
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }
    takeFrame(currentFrame);
  }

  async function takeFrame(index, loop = true) {
    isTakingPhoto = true;
    captureCountdown = 3;

    while (captureCountdown > 0) {
      await new Promise((r) => setTimeout(r, 1000));
      captureCountdown -= 1;
    }

    const ctx = canvas.getContext("2d");
    ctx.filter = ""; // no filter
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");

    photos[index] = dataUrl;

    photosStore.update((state) => {
      const updatedPhotos = state.photos ? [...state.photos] : [];
      updatedPhotos[index] = dataUrl;
      return { ...state, photos: updatedPhotos };
    });

    isTakingPhoto = false;
    if (loop) {
      startAutoContinueTimer();
    } else {
      previewResult = true;
      sessionStarted = false;
    }
  }

  function startAutoContinueTimer() {
    clearInterval(autoContinueTimer);
    autoContinueCountdown = 2;

    autoContinueTimer = setInterval(() => {
      autoContinueCountdown -= 1;
      if (autoContinueCountdown <= 0) {
        clearInterval(autoContinueTimer);
        acceptPhoto();
      }
    }, 1000);
  }

  function acceptPhoto() {
    clearInterval(autoContinueTimer);
    goNextFrame();
  }

  async function retakePhoto(frameIndex) {
    if (retakeLimit == 0) {
      alert("❌ Retake limit reached for this photo!");
      return;
    }

    // alert('test')
    sessionStarted = true;
    previewResult = false;
    clearInterval(autoContinueTimer);
    retakeLimit -= 1;
    currentFrame = frameIndex;
    photos[currentFrame] = null;

    stream = await navigator.mediaDevices.getUserMedia({ video: true });

    if (video) {
      video.srcObject = stream;
      video.play();

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }

    takeFrame(frameIndex, false);
  }

  function goNextFrame() {
    if (currentFrame + 1 < framesCount) {
      currentFrame += 1;
      photos[currentFrame] = null;
      takeFrame(currentFrame);
    } else {
      previewResult = true;
      // goto("/preview"); // All frames done
    }
  }
</script>

<!-- VIDEO / CAPTURE -->

{#if previewResult && frameLayout}
  <!-- SESSION SETUP -->
  <div class="flex flex-wrap w-full">
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
              class="p-5 w-[200px] h-[150px] border cursor-pointer"
              class:border-yellow-400={i === selectedFrameIndex}
              aria-roledescription="select frame"
              on:click={() => {
                selectedFrameIndex = i;
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
          {#if selectedFrameIndex != null && retakeLimit > 0}
            <button
              class="btn btn-primary"
              on:click={retakePhoto(selectedFrameIndex)}>Retake Photo</button
            >
          {/if}
          <button class="btn btn-neutral" on:click={() => goto("/preview")}
            >Selanjutnya</button
          >
        </div>
      </div>
    </div>
  </div>
{:else}
  <div
    class="relative mx-auto aspect-video rounded-lg overflow-hidden relative w-[1080px] h-[720px]"
    class:hidden={sessionStarted && photos[currentFrame]}
  >
    <video
      bind:this={video}
      autoplay
      playsinline
      muted
      class="w-full h-full object-cover"
    ></video>

    {#if isTakingPhoto && captureCountdown > 0}
      <div
        class="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-6xl font-bold"
      >
        {captureCountdown}
      </div>
    {/if}
  </div>

  <canvas bind:this={canvas} style="display:none;"></canvas>
{/if}

<!-- PHOTO PREVIEW AFTER CAPTURE -->
{#if photos[currentFrame] && !previewResult}
  <div class="mt-6 w-[720px] h-[480px] mx-auto text-center">
    {#if autoContinueCountdown > 0}
      <p class="text-red-600 font-bold mb-2">
        ⏳ Auto lanjut dalam {autoContinueCountdown}s...
      </p>
    {/if}

    <img
      src={photos[currentFrame]}
      alt={`Foto ${currentFrame + 1}`}
      class="mx-auto my-3 rounded shadow-md object-cover w-full"
    />

    <p class="mb-2 text-sm text-gray-600">
      Foto {currentFrame + 1} dari {framesCount}
    </p>
  </div>
{/if}

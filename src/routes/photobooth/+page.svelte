<script>
  import { onMount, onDestroy, tick } from "svelte";
  import {
    photosStore,
    photoFrame as photoFrames,
    photoOptions,
  } from "../../stores/photos.js";
  import { goto } from "$app/navigation";
  import { Context } from "konva/lib/Context";

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

  onMount(async () => {
    photosStore.subscribe((v) => {
      selectedFrame = v.frameType || 1;
    });

    photoFrames.subscribe((v) => {
      frameLayout = v.find((frame) => frame.id === selectedFrame);
    });

    photoOptions.subscribe((v) => {
      frameOptions = v[selectedFrame];
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
    isCameraOn = true;
    currentFrame = 0;
    photos = Array(framesCount).fill(null);
    framesCount = frameLayout.count || 4;

    stream = await navigator.mediaDevices.getUserMedia({ video: true });

    if (video) {
      video.srcObject = stream;
      video.play();

      console.log(video.videoWidth, video.videoHeight);
      canvas.width = video.videoWidth || 1024;
      canvas.height = video.videoHeight || 720;
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

    isCameraOn = false;
    const ctx = canvas.getContext("2d");

    const bgImage = new Image();
    bgImage.src = "/ip/test.png";
    bgImage.onload = () => {
      ctx.filter = ""; // no filter
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
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
    isCameraOn = true;

    await tick();

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

  function goNextFrameRetake() {
    console.log(retakePhotos);
    retakePhotos.shift();
    if (retakePhotos.length > 0) {
      currentFrame = retakePhotos[0];
      takeFrame(currentFrame);
      isCameraOn = true;
    } else {
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
            <button class="btn btn-primary" on:click={retakePhoto}
              >Retake Photo</button
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
    class="relative mx-auto aspect-video rounded-lg overflow-hidden relative w-[1024px] h-[720px]"
    class:hidden={!isCameraOn}
  >
    <video
      bind:this={video}
      autoplay
      playsinline
      muted
      class="w-full h-full object-cover"
    ></video>
    {#if video}
      <img src="/ip/test.png" alt="" class="w-full h-full absolute top-0" />
    {/if}
    {#if isTakingPhoto && captureCountdown > 0}
      <div
        class="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-6xl font-bold z-10"
      >
        {captureCountdown}
      </div>
    {/if}
  </div>

  <canvas bind:this={canvas} style="display:none;"></canvas>
{/if}

<!-- PHOTO PREVIEW AFTER CAPTURE -->
{#if photoPreview && !previewResult}
  <div class="mt-6 w-[1024px] h-[720px] mx-auto text-center">
    {#if autoContinueCountdown > 0}
      <p class="text-red-600 font-bold mb-2">
        ⏳ Auto lanjut dalam {autoContinueCountdown}s...
      </p>
    {/if}

    <img
      src={photoPreview}
      alt={`Foto ${currentFrame + 1}`}
      class="mx-auto my-3 rounded shadow-md object-cover w-full"
    />

    <p class="mb-2 text-sm text-gray-600">
      Foto {currentFrame + 1} dari {framesCount}
    </p>
  </div>
{/if}

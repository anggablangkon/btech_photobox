<script>
  import { onMount, onDestroy } from "svelte";
  import {
    photosStore,
    photoFrame as photoFrames,
    photoOptions,
  } from "../../stores/photos.js";
  import { goto } from "$app/navigation";
  import select from "daisyui/components/select/index.js";

  let videos = [];
  let canvas;

  // Session state
  let photos = [];
  let video;
  let frameLayout;
  let framesCount = 1;
  let currentFrame = 0;
  let selectedFrame = null;
  let retakeLimit = 2;
  let retakeCounts = [];
  let sessionStarted = false;

  // Countdown timers
  let captureCountdown = 0;
  let autoContinueCountdown = 0;
  let isTakingPhoto = false;
  let autoContinueTimer;
  let frames = [];
  let stream;

  onMount(async () => {
    photoFrames.subscribe((v) => {
      frames = v;
    });

    photoOptions.subscribe((v) => {
      frameLayout = v;
    });
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
    const frame = frames[selectedFrame];
    sessionStarted = true;
    currentFrame = 0;
    photos = Array(framesCount).fill(null);
    retakeCounts = Array(framesCount).fill(0);
    framesCount = frame.count;
    photosStore.update((state) => ({ ...state, frameType: selectedFrame }));

    stream = await navigator.mediaDevices.getUserMedia({ video: true });

    if (video) {
      video.srcObject = stream;
      video.play();

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }
    takeFrame(currentFrame);
  }

  async function takeFrame(index) {
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
    startAutoContinueTimer();
  }

  function startAutoContinueTimer() {
    clearInterval(autoContinueTimer);
    autoContinueCountdown = 15;

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

  function retakePhoto() {
    if (retakeLimit == 0) {
      alert("❌ Retake limit reached for this photo!");
      return;
    }
    clearInterval(autoContinueTimer);
    retakeLimit -= 1;
    photos[currentFrame] = null;
    takeFrame(currentFrame);
  }

  function goNextFrame() {
    console.log(currentFrame, framesCount, selectedFrame);
    if (currentFrame + 1 < framesCount) {
      currentFrame += 1;
      photos[currentFrame] = null;
      takeFrame(currentFrame);
    } else {
      goto("/preview"); // All frames done
    }
  }
</script>

<!-- VIDEO / CAPTURE -->

<!-- SESSION SETUP -->
{#if !sessionStarted}
  <div class="mt-6 space-y-4 w-3/4 mx-auto flex flex-col">
    <div
      class="card shadow py-2 flex flex-row overflow-x-auto gap-2 px-2 h-full bg-gray-100 shadow"
    >
      {#each Object.entries(frames) as [i, frame]}
        <div
          class="card flex-shrink-0 xl:flex-shrink-1 w-40 h-40 bg-base-100 shadow-sm text-center cursor-pointer hover:shadow-md p-2
          {selectedFrame === i ? 'border-2 border-primary' : ''}"
          on:click={() => {
            selectedFrame = i;
          }}
        >
          <figure class="h-full overflow-hidden">
            <img
              src={frame.src}
              alt={frame.src}
              class="object-contain w-full h-full"
            />
          </figure>
        </div>
      {/each}
    </div>

    <button
      on:click={startSession}
      class="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition mt-auto"
    >
      ▶️ Mulai Sesi
    </button>
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
{#if photos[currentFrame]}
  <div class="mt-6 w-[720px] h-[480px] mx-auto text-center">
    {#if autoContinueCountdown > 0}
      <p class="text-red-600 font-bold mb-2">
        ⏳ Auto lanjut dalam {autoContinueCountdown}s...
      </p>
    {/if}

    <div class="flex gap-4 justify-center mb-3">
      <button
        on:click={acceptPhoto}
        class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        ✅ Terima
      </button>
      <button
        on:click={retakePhoto}
        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        🔄 Retake ({retakeLimit} sisa)
      </button>
    </div>

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

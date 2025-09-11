<script>
  import { onMount, onDestroy } from "svelte";
  import { photosStore } from "../../stores/photos.js";
  import { goto } from "$app/navigation";

  let video;
  let canvas;

  // Session state
  let photos = [];
  let framesCount = 1;
  let currentFrame = 0;
  let retakeLimit = 2;
  let retakeCounts = [];
  let sessionStarted = false;

  // Countdown timers
  let captureCountdown = 0;
  let autoContinueCountdown = 0;
  let isTakingPhoto = false;
  let autoContinueTimer;

  let stream;

  onMount(async () => {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    await new Promise((resolve) =>
      video.addEventListener("loadedmetadata", resolve)
    );

    await video.play();

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
  });

  onDestroy(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    clearInterval(autoContinueTimer);
  });

  // --- SESSION FUNCTIONS ---
  function startSession() {
    sessionStarted = true;
    currentFrame = 0;
    photos = Array(framesCount).fill(null);
    retakeCounts = Array(framesCount).fill(0);

    photosStore.update((state) => ({ ...state, frameType: framesCount }));
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
    retakeLimit -= 1
    photos[currentFrame] = null;
    takeFrame(currentFrame);
  }

  function goNextFrame() {
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
<div
  class="relative w-3/4 mx-auto aspect-video bg-black rounded-lg overflow-hidden shadow-md"
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

<!-- SESSION SETUP -->
{#if !sessionStarted}
  <div class="mt-6 space-y-4 w-3/4 mx-auto">
    <div>
      <label class="block font-medium mb-1">📑 Jumlah Bingkai:</label>
      <select bind:value={framesCount} class="w-full p-2 border rounded-lg">
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      </select>
    </div>

    <button
      on:click={startSession}
      class="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
    >
      ▶️ Mulai Sesi
    </button>
  </div>
{/if}

<!-- PHOTO PREVIEW AFTER CAPTURE -->
{#if photos[currentFrame]}
  <div class="mt-6 w-3/4 mx-auto text-center">
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
      class="w-2/4 mx-auto my-3 rounded shadow-md"
    />

    <p class="mb-2 text-sm text-gray-600">
      Foto {currentFrame + 1} dari {framesCount}
    </p>
  </div>
{/if}

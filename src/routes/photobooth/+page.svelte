<script>
  import { onMount } from "svelte";
  import { photosStore } from "../../stores/photos.js";
  import { goto } from "$app/navigation";

  let video;
  let canvas;
  let photos = [];
  let framesCount = 1;
  let selectedFilter = "normal";
  let countdown = 0;
  let isTakingPhotos = false;

  const filterPresets = {
    normal: "",
    grayscale: "grayscale(100%)",
    blur: "blur(5px)",
    bright: "brightness(150%)",
    vintage: "sepia(0.5) contrast(1.2) brightness(1.1)",
    monochrome: "grayscale(100%) contrast(1.5)",
    cerbright: "contrast(1.4) brightness(1.2)",
  };

  onMount(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.play();
  });

  async function takePhotos() {
    isTakingPhotos = true;

    while (photos.length < framesCount) photos.push(null);
    if (photos.length > framesCount) photos = photos.slice(0, framesCount);

    for (let i = 0; i < framesCount; i++) {
      if (photos[i]) continue;

      countdown = 5;
      while (countdown > 0) {
        await new Promise((r) => setTimeout(r, 1000));
        countdown -= 1;
      }

      const ctx = canvas.getContext("2d");
      ctx.filter = filterPresets[selectedFilter] || "";
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");

      photos = photos.map((p, idx) => (idx === i ? dataUrl : p));
      photosStore.set(photos); // **update store tiap foto**
    }

    isTakingPhotos = false;
    countdown = 0;
  }

  function resetPhoto(index) {
    photos = photos.map((p, i) => (i === index ? null : p));
    photosStore.set(photos); // **update store**
  }

  function resetAllPhotos() {
    photos = [];
    photosStore.set(photos); // **update store**
  }

  function goToPreview() {
    if (photos.filter((p) => p).length === 0) {
      alert("Belum ada foto untuk dipreview!");
      return;
    }
    photosStore.set(photos);
    goto("/preview");
  }
</script>

<h2>🎥 Photobooth Aktif</h2>

<video bind:this={video} style="filter: {filterPresets[selectedFilter] || ''}"
></video>
<canvas bind:this={canvas} width="400" height="300" style="display: none;"
></canvas>

<label for="filter">🎨 Pilih Filter:</label>
<select id="filter" bind:value={selectedFilter} disabled={isTakingPhotos}>
  {#each Object.keys(filterPresets) as key}
    <option value={key}>{key}</option>
  {/each}
</select>

<label for="frames">Jumlah Bingkai:</label>
<select id="frames" bind:value={framesCount} disabled={isTakingPhotos}>
  <option value="1">1</option>
  <option value="2">2</option>
  <option value="3">3</option>
  <option value="4">4</option>
</select>

<button on:click={takePhotos} disabled={isTakingPhotos}>
  {#if isTakingPhotos}
    Mengambil Foto...
  {:else}
    📸 Ambil Foto
  {/if}
</button>

{#if countdown > 0}
  <div class="countdown">{countdown}</div>
{/if}

{#if photos.length > 0}
  <h3>🖼️ Hasil Foto ({photos.filter((p) => p).length} bingkai)</h3>
  <button on:click={resetAllPhotos} style="margin-bottom: 1rem;"
    >🗑️ Reset Semua Foto</button
  >
  <div style="display: flex; flex-wrap: wrap;">
    {#each photos as photo, idx (idx)}
      {#if photo}
        <div class="photo-container">
          <img class="photo-result" src={photo} alt={`Foto ${idx + 1}`} />
          <button class="reset-button" on:click={() => resetPhoto(idx)}
            >✖</button
          >
        </div>
      {/if}
    {/each}

    {#if isTakingPhotos && countdown > 0}
      <div class="photo-container">
        <div
          class="photo-result"
          style="background: #ddd; border: 2px dashed #666; display: flex; align-items: center; justify-content: center; color: #666; font-weight: bold;"
        >
          Foto berikutnya...
        </div>
      </div>
    {/if}
  </div>
{/if}

<!-- Tambahkan tombol ke preview -->
<button
  on:click={goToPreview}
  style="margin-top: 1rem; padding: 0.5rem 1rem; font-size: 1rem;"
>
  ➡️ Lihat Preview
</button>

<style>
  /* tetap sama */
</style>

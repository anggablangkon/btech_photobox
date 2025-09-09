<script>
  import { photosStore } from "../../stores/photos.js";
  import { onMount } from "svelte";

  let photos = [];

  // Subscribe ke photosStore dan transformasi data ke objek jika masih string
  const unsubscribe = photosStore.subscribe((value) => {
    photos = value.map((p) =>
      typeof p === "string" ? { src: p, overlays: [] } : p
    );
  });

  onMount(() => {
    return () => unsubscribe();
  });

  // Handle drag start
  function handleDragStart(event, overlay, photoIndex) {
    const offsetX = event.clientX - overlay.x;
    const offsetY = event.clientY - overlay.y;

    // Function untuk memindahkan posisi overlay
    function handleDragMove(e) {
      const newX = e.clientX - offsetX;
      const newY = e.clientY - offsetY;

      // Update posisi overlay di store
      const newPhotos = [...photos];
      newPhotos[photoIndex].overlays = newPhotos[photoIndex].overlays.map(
        (o) => (o === overlay ? { ...o, x: newX, y: newY } : o)
      );
      photosStore.set(newPhotos);
    }

    // Stop drag ketika mouse dilepas
    function handleDragEnd() {
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
    }

    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleDragEnd);
  }

  function addIcon(photoIndex) {
    const newPhotos = [...photos];
    if (!newPhotos[photoIndex].overlays) newPhotos[photoIndex].overlays = [];
    newPhotos[photoIndex].overlays.push({
      type: "icon",
      icon: "❤️",
      x: 50, // Posisi awal
      y: 50, // Posisi awal
    });
    photosStore.set(newPhotos);
  }

  function addText(photoIndex) {
    const newPhotos = [...photos];
    if (!newPhotos[photoIndex].overlays) newPhotos[photoIndex].overlays = [];
    newPhotos[photoIndex].overlays.push({
      type: "text",
      text: "Hello",
      x: 100, // Posisi awal
      y: 100, // Posisi awal
      color: "blue",
      size: 18,
    });
    photosStore.set(newPhotos);
  }
</script>

{#if photos.length > 0}
  <h2>Preview Foto</h2>
  <div style="display: flex; flex-wrap: wrap;">
    {#each photos as photo, idx}
      {#if photo}
        <div
          class="photo-wrapper"
          style="position: relative; width: 200px; margin: 0.5rem;"
        >
          <!-- Gambar frame -->
          <div
            class="frame"
            style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;"
          >
            <img
              src="frame_image_url.png"
              alt="Frame"
              style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px;"
            />
          </div>

          <img
            id="photo-{idx}"
            src={photo.src}
            alt={`Foto ${idx + 1}`}
            style="width: 100%; border-radius: 8px; position: relative; z-index: 1;"
          />

          {#if photo.overlays}
            {#each photo.overlays as overlay}
              {#if overlay.type === "icon"}
                <div
                  class="overlay icon"
                  style="left: {overlay.x}px; top: {overlay.y}px;"
                  on:mousedown={(event) => handleDragStart(event, overlay, idx)}
                >
                  {overlay.icon}
                </div>
              {:else if overlay.type === "text"}
                <div
                  class="overlay text"
                  style="left: {overlay.x}px; top: {overlay.y}px; color: {overlay.color}; font-size: {overlay.size}px;"
                  on:mousedown={(event) => handleDragStart(event, overlay, idx)}
                >
                  {overlay.text}
                </div>
              {/if}
            {/each}
          {/if}

          <button on:click={() => addIcon(idx)}>Tambah Icon ❤️</button>
          <button on:click={() => addText(idx)}>Tambah Text</button>
        </div>
      {/if}
    {/each}
  </div>
{:else}
  <p>Belum ada foto untuk preview.</p>
{/if}

<style>
  .photo-wrapper {
    position: relative;
    display: inline-block;
    margin: 0.5rem;
  }

  .photo-wrapper img {
    display: block;
    max-width: 200px;
    border-radius: 8px;
  }

  .frame {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0; /* Frame berada di bawah gambar */
  }

  .overlay {
    position: absolute;
    user-select: none;
    pointer-events: all; /* Pastikan overlay dapat menerima event */
    cursor: grab; /* Menunjukkan bahwa elemen ini bisa digeser */
  }

  .overlay.icon {
    font-size: 2rem;
  }

  .overlay.text {
    font-weight: bold;
    text-shadow: 1px 1px 2px #000;
  }

  /* Feedback ketika sedang dragging */
  .overlay:active {
    cursor: grabbing;
  }
</style>

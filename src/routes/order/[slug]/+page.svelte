<script>
  import { getOrder } from "$lib/api/order";
  import Loading from "$lib/components/Loading.svelte";
  import { onDestroy, onMount } from "svelte";
  import { afterNavigate } from "$app/navigation";
  import { appSettings } from "../../../stores/appSetting";
  import {
    DownloadIcon,
    ImageIcon,
    CalendarIcon,
    ClockIcon,
    CheckCircleIcon,
  } from "svelte-feather-icons";

  // Import Swiper Elements
  import { register } from "swiper/element/bundle";

  let order;
  let isLoading = true;
  let isDownloading = false;
  let downloadProgress = 0;
  let activePhotoIndex = 0;
  let swiperEl;

  export let data;

  // Register Swiper custom elements
  register();

  afterNavigate(() => {
    appSettings.update((state) => {
      return {
        ...state,
        backgroundPage: "/background/BACKGROUND 1.jpg",
        title: "Order Details",
      };
    });
  });

  onMount(async () => {
    console.log("Loading order:", data.order_id);
    try {
      order = await getOrder(data.order_id);
      console.log("Order loaded:", order);
    } catch (error) {
      console.error("Failed to load order:", error);
    } finally {
      isLoading = false;
    }
  });

  async function downloadImage(imageUrl, filename) {
    isDownloading = true;
    downloadProgress = 0;

    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentLength = response.headers.get("content-length");
      const total = parseInt(contentLength, 10);
      let loaded = 0;

      const reader = response.body.getReader();
      const stream = new ReadableStream({
        start(controller) {
          function pump() {
            return reader.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }

              loaded += value.byteLength;
              if (total) {
                downloadProgress = Math.round((loaded / total) * 100);
              }

              controller.enqueue(value);
              return pump();
            });
          }
          return pump();
        },
      });

      const newResponse = new Response(stream);
      const blob = await newResponse.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed. Please try again.");
    } finally {
      isDownloading = false;
      downloadProgress = 0;
    }
  }

  function downloadMainImage() {
    if (order?.result?.image_path) {
      const filename = `photobox_${order.order_id}_result.jpg`;
      downloadImage("/" + order.result.image_path, filename);
    }
  }

  function downloadPhoto(photoPath, index) {
    const filename = `photobox_${order.order_id}_photo_${index + 1}.jpg`;
    downloadImage("/" + photoPath, filename);
  }

  function downloadAllPhotos() {
    if (order?.images && order.images.length > 0) {
      order.images.forEach((photo, index) => {
        setTimeout(() => {
          downloadPhoto(photo.image_path, index);
        }, index * 500); // Stagger downloads by 500ms
      });
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function handleSlideChange(event) {
    activePhotoIndex = event.detail[0].activeIndex || 0;
  }

  function goToSlide(index) {
    if (swiperEl && swiperEl.swiper) {
      swiperEl.swiper.slideTo(index);
    }
  }
</script>

{#if !isLoading && order}
  <div class="min-h-screen p-4">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="bg-white rounded-2xl shadow-xl p-6 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-800 mb-2">Order Details</h1>
            <p class="text-gray-600">
              Order ID: <span class="font-mono bg-gray-100 px-2 py-1 rounded"
                >{order.order_id}</span
              >
            </p>
          </div>
          <div class="flex items-center space-x-4">
            <div class="flex items-center text-green-600">
              <CheckCircleIcon size="20" class="mr-2" />
              <span class="font-semibold">Completed</span>
            </div>
          </div>
        </div>

        <!-- Order Info -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div class="flex items-center text-gray-600">
            <CalendarIcon size="18" class="mr-2" />
            <span>{formatDate(order.created_at)}</span>
          </div>
          <div class="flex items-center text-gray-600">
            <ImageIcon size="18" class="mr-2" />
            <span>{order.type || "Photo Session"}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Main Result Image -->
        <div class="bg-white rounded-2xl shadow-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-gray-800">Final Result</h2>
            <button
              on:click={downloadMainImage}
              disabled={isDownloading}
              class="btn btn-primary rounded-full px-6 hover:shadow-lg transition-all duration-300"
            >
              {#if isDownloading}
                <span class="loading loading-spinner loading-sm mr-2"></span>
                {downloadProgress}%
              {:else}
                <DownloadIcon size="18" class="mr-2" />
                Download
              {/if}
            </button>
          </div>

          <div
            class="aspect-[2/3] w-full max-w-md mx-auto rounded-xl overflow-hidden shadow-lg"
          >
            <img
              src={order.result.image_path}
              alt="Final result"
              class="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>

        <!-- Individual Photos Swiper -->
        <div class="bg-white rounded-2xl shadow-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-gray-800">Individual Photos</h2>
            <div class="flex space-x-2">
              <button
                on:click={downloadAllPhotos}
                class="btn btn-outline btn-sm rounded-full px-4"
              >
                <DownloadIcon size="16" class="mr-1" />
                All
              </button>
              <span class="text-sm text-gray-500 self-center">
                {activePhotoIndex + 1} of {order.images?.length || 0}
              </span>
            </div>
          </div>

          {#if order.images && order.images.length > 0}
            <!-- Swiper Element -->
            <div class="mb-4">
              <swiper-container
                bind:this={swiperEl}
                slides-per-view="1"
                space-between="10"
                navigation="true"
                pagination="true"
                pagination-clickable="true"
                on:swiperslidechange={handleSlideChange}
                class="aspect-[3/4] rounded-xl overflow-hidden shadow-lg swiper-photos"
              >
                {#each order.images as photo, index}
                  <swiper-slide>
                    <div class="relative group">
                      <img
                        src={"/" + photo.image_path}
                        alt="Photo {index + 1}"
                        class="w-full h-full object-cover"
                      />
                      <!-- Download button overlay -->
                      <div
                        class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center"
                      >
                        <button
                          on:click={() =>
                            downloadPhoto(photo.image_path, index)}
                          class="btn btn-circle btn-primary opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300"
                        >
                          <DownloadIcon size="20" />
                        </button>
                      </div>
                    </div>
                  </swiper-slide>
                {/each}
              </swiper-container>
            </div>

            <!-- Thumbnail Navigation -->
            <div class="flex flex-wrap space-x-2 overflow-x-auto pb-2">
              {#each order.images as photo, index}
                <button
                  on:click={() => goToSlide(index)}
                  class="flex-shrink-0 w-36 rounded-lg overflow-hidden border-2 transition-all duration-300 {activePhotoIndex ===
                  index
                    ? 'border-blue-500 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'}"
                >
                  <img
                    src={"/" + photo.image_path}
                    alt="Thumbnail {index + 1}"
                    class="w-full h-full object-cover"
                  />
                </button>
              {/each}
            </div>
          {:else}
            <div class="text-center py-12 text-gray-500">
              <ImageIcon size="48" class="mx-auto mb-4 opacity-50" />
              <p>No individual photos available</p>
            </div>
          {/if}
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="bg-white rounded-2xl shadow-xl p-6 mt-6">
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            on:click={downloadMainImage}
            disabled={isDownloading}
            class="btn btn-primary btn-lg rounded-full px-8 hover:shadow-xl transition-all duration-300"
          >
            {#if isDownloading}
              <span class="loading loading-spinner loading-sm mr-2"></span>
              Downloading... {downloadProgress}%
            {:else}
              <DownloadIcon size="20" class="mr-2" />
              Download Final Result
            {/if}
          </button>

          {#if order.images && order.images.length > 0}
            <button
              on:click={downloadAllPhotos}
              class="btn btn-outline btn-lg rounded-full px-8 hover:shadow-xl transition-all duration-300"
            >
              <DownloadIcon size="20" class="mr-2" />
              Download All Photos ({order.images.length})
            </button>
          {/if}
        </div>
      </div>

      <!-- Additional Info -->
      {#if order.song}
        <div class="bg-white rounded-2xl shadow-xl p-6 mt-6">
          <h3 class="text-xl font-bold text-gray-800 mb-4">Session Details</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-gray-600 mb-2"><strong>Selected Song:</strong></p>
              <p class="font-semibold">{order.song.title}</p>
              <p class="text-gray-500">{order.song.artist}</p>
            </div>
            <div>
              <p class="text-gray-600 mb-2"><strong>Frame Type:</strong></p>
              <p class="font-semibold">
                {order.frame?.name || "Default Frame"}
              </p>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{:else if isLoading}
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100"
  >
    <div class="bg-white rounded-2xl shadow-xl p-8 text-center">
      <Loading text="Loading your order..." />
    </div>
  </div>
{:else}
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100"
  >
    <div class="bg-white rounded-2xl shadow-xl p-8 text-center">
      <div class="text-red-500 text-6xl mb-4">❌</div>
      <h2 class="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h2>
      <p class="text-gray-600">
        The order you're looking for doesn't exist or has been removed.
      </p>
      <button
        on:click={() => window.history.back()}
        class="btn btn-primary mt-4 rounded-full px-6"
      >
        Go Back
      </button>
    </div>
  </div>
{/if}

<style>
  /* Swiper Element Styles */
  :global(.swiper-photos) {
    --swiper-navigation-color: #3b82f6;
    --swiper-pagination-color: #3b82f6;
    --swiper-navigation-size: 20px;
  }

  :global(.swiper-photos .swiper-button-next),
  :global(.swiper-photos .swiper-button-prev) {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    margin-top: -20px;
  }

  :global(.swiper-photos .swiper-pagination-bullet) {
    opacity: 0.5;
  }

  :global(.swiper-photos .swiper-pagination-bullet-active) {
    opacity: 1;
    transform: scale(1.2);
  }
</style>

<script>
  import { afterNavigate, goto } from "$app/navigation";
  import { onDestroy, onMount, tick } from "svelte";
  import { generateQris, getPaymentStatus } from "$lib/api/payment";
  import { photosStore, resetPhotoStore } from "../../stores/photos.js";
  import { appSettings } from "../../stores/appSetting.js";

  let photoType;
  let qrisImage = "";
  let timeLeft;
  let orderId = "";
  let isLoading = true;
  let expiryTime;
  let countdownInterval;
  let paymentCheckInterval;
  let isCheckingPayment = false;

  afterNavigate(() => {
    appSettings.update((state) => {
      return {
        ...state,
        backgroundPage: "/background/BACKGROUND 2.jpg",
        title: "Ringkasan Pembayaran",
      };
    });
  });

  // Reactive photoType from store
  $: photoType = $photosStore?.photoType || {
    id: 1,
    title: "Standard",
    img: "/Standard.png",
    description: "Cetakan 4 kali foto",
    price: "30000",
  };

  // Redirect if no photoType
  $: if (!isLoading && !$photosStore?.photoType) {
    goto("/");
  }

  onMount(async () => {
    const qris = await createQris();
    isLoading = false;
  });

  onDestroy(() => {
    clearAllIntervals();
  });

  function clearAllIntervals() {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    if (paymentCheckInterval) {
      clearInterval(paymentCheckInterval);
      paymentCheckInterval = null;
    }
  }

  async function createQris() {
    try {
      const data = await generateQris({
        gross_amount: photoType.price,
      });
      orderId = data.order_id;
      qrisImage = data.image;
      expiryTime = new Date(data.expiry_time.replace(" ", "T")).getTime();
      startCountdown(expiryTime);
      startPaymentStatusCheck();
    } catch (error) {
      console.error("Error creating QRIS:", error);
      alert("Gagal membuat kode pembayaran. Silakan coba lagi.");
    }
  }

  function startCountdown(expiryTime) {
    // Clear existing interval
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    countdownInterval = setInterval(() => {
      const now = Date.now();
      const distance = expiryTime - now;

      if (distance <= 0) {
        clearInterval(countdownInterval);
        qrisImage = null;
        timeLeft = null;
        createQris();
      } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        const paddedSeconds = String(seconds).padStart(2, "0");
        timeLeft = `${minutes}:${paddedSeconds}`;
      }
    }, 1000);
  }

  function startPaymentStatusCheck() {
    // Generate random interval between 4-7 seconds (4000-7000ms)
    const randomInterval = Math.floor(Math.random() * 3000) + 4000;

    paymentCheckInterval = setInterval(async () => {
      if (orderId && !isCheckingPayment) {
        await checkStatusPaymentAuto();
      }
    }, randomInterval);
  }

  async function checkStatusPaymentAuto() {
    if (isCheckingPayment) return;

    isCheckingPayment = true;

    try {
      const data = await getPaymentStatus(orderId);
      if (data.status === "success") {
        clearAllIntervals();
        photosStore.update((state) => {
          return { ...state, order_id: data.order_id };
        });
        goto("/ip");
      }
    } catch (error) {
      console.error("Error auto-checking payment status:", error);
    } finally {
      isCheckingPayment = false;
    }
  }

  function backToHomePage() {
    clearAllIntervals();
    resetPhotoStore();
    goto("/");
  }
</script>

<div class="mx-auto min-w-3/4">
  {#if !isLoading}
    <div class="size-full flex justify-center relative mx-auto gap-10">
      <div class="p-2 w-1/2">
        <div
          class="w-10/12 p-2 bg-white rounded-xl shadow-md mx-auto text-center my-3 shadow-xl"
        >
          <h1 class="mb-3 text-3xl mt-3">{photoType.title}</h1>
          <div class="w-5/6 h-5/6 bg-base-300 items-center mx-auto rounded-xl">
            <img
              src={photoType.img}
              alt={photoType.title}
              class="h-full mx-auto"
            />
          </div>
          <p class="mt-3 text-gray-500 w-5/6 text-center mx-auto">
            {photoType.description}
          </p>
          <h1
            class="mb-3 inline-flex font-bold bg-red-600 text-white p-2 rounded-xl mt-2"
          >
            Rp{parseInt(photoType.price).toLocaleString("id-ID")}
          </h1>
        </div>
        <p class="text-center mt-4">
          Pastikan Anda sudah siap setelah membayar
        </p>
      </div>

      <div class="p-2 w-1/2 flex items-center">
        <div class="text-center mx-auto p-3">
          {#if qrisImage && timeLeft}
            <div
              class="h-min border-double border-4 border-white mx-auto w-[400px] bg-base-100 rounded-xl shadow flex flex-col items-center justify-center overflow-hidden"
            >
              <img
                src={qrisImage}
                alt="QRIS Payment Code"
                class="object-cover w-full"
              />
            </div>
          {:else}
            <div
              class="min-h-[350px] border-double border-4 border-white mx-auto w-[400px] bg-base-100 rounded-xl shadow flex flex-col items-center justify-center overflow-hidden"
            >
              <span class="loading loading-spinner loading-lg"></span>
            </div>
          {/if}

          {#if timeLeft}
            <p class="mx-auto my-5 font-bold">
              Waktu pembayaran {timeLeft}
            </p>
          {/if}

          <!-- Payment status indicator -->
          {#if isCheckingPayment}
            <p
              class="text-sm text-blue-600 mb-2 flex items-center justify-center gap-2"
            >
              <span class="loading loading-spinner loading-sm"></span>
              Memeriksa status pembayaran...
            </p>
          {/if}

          <div class="gap-3 mt-5 mx-auto">
            <button
              class="btn bg-base-100 border border-base-200 shadow-xl rounded-full border-3 border-b-6 relative w-full"
              on:click={backToHomePage}
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="w-full flex justify-center items-center h-full">
      <span class="loading loading-dots loading-xl"></span>
    </div>
  {/if}
</div>

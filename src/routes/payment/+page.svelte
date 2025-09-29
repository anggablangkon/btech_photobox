<script>
  import { afterNavigate, goto } from "$app/navigation";
  import Loading from "$lib/components/Loading.svelte";
  import { onDestroy, onMount, tick } from "svelte";
  import { generateQris, getPaymentStatus } from "$lib/api/payment";
  import { photosStore, resetPhotoStore } from "../../stores/photos.js";
  import { appSettings } from "../../stores/appSetting.js";
  import Qris from "$lib/components/QRis.svelte";


  let photoType;
  let isLoading = true;
  let dataQris = {};

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
    // clearAllIntervals();
  });

  // function clearAllIntervals() {
  //   if (countdownInterval) {
  //     clearInterval(countdownInterval);
  //     countdownInterval = null;
  //   }
  //   if (paymentCheckInterval) {
  //     clearInterval(paymentCheckInterval);
  //     paymentCheckInterval = null;
  //   }
  // }

  async function createQris() {
    try {
      isLoading = true;
      const data = await generateQris({
        gross_amount: photoType.price,
      });

      dataQris.orderId = data.order_id;
      dataQris.qrisImage = data.image;
      dataQris.expiryTime = new Date(
        data.expiry_time.replace(" ", "T")
      ).getTime();
    } catch (error) {
      console.error("Error creating QRIS:", error);
      alert("Gagal membuat kode pembayaran. Silakan coba lagi.");
    }
  }

  async function reloadQris() {
    isLoading = true;
    await createQris();
    isLoading = false;
  }

  // function startCountdown(expiryTime) {
  //   // Clear existing interval
  //   if (countdownInterval) {
  //     clearInterval(countdownInterval);
  //   }

  //   countdownInterval = setInterval(() => {
  //     const now = Date.now();
  //     const distance = expiryTime - now;

  //     if (distance <= 0) {
  //       clearInterval(countdownInterval);
  //       qrisImage = null;
  //       timeLeft = null;
  //       createQris();
  //     } else {
  //       const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  //       const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  //       const paddedSeconds = String(seconds).padStart(2, "0");
  //       timeLeft = `${minutes}:${paddedSeconds}`;
  //     }
  //   }, 1000);
  // }

  // function startPaymentStatusCheck() {
  //   // Generate random interval between 4-7 seconds (4000-7000ms)
  //   const randomInterval = Math.floor(Math.random() * 3000) + 4000;

  //   paymentCheckInterval = setInterval(async () => {
  //     if (orderId && !isCheckingPayment) {
  //       await checkStatusPaymentAuto();
  //     }
  //   }, randomInterval);
  // }

  // async function checkStatusPaymentAuto() {
  //   if (isCheckingPayment) return;

  //   isCheckingPayment = true;

  //   try {
  //     const data = await getPaymentStatus(orderId);
  //     if (data.status === "success") {
  //       clearAllIntervals();
  //       photosStore.update((state) => {
  //         return { ...state, order_id: data.order_id };
  //       });
  //       goto("/ip");
  //     }
  //   } catch (error) {
  //     console.error("Error auto-checking payment status:", error);
  //   } finally {
  //     isCheckingPayment = false;
  //   }
  // }

  function handleExpiredTime(data) {
    console.log("Payment expired:", data);
    createQris();
    alert("Payment time expired!");
  }

  function handlePaymentSuccess(data) {
    if (data.status === "success") {
      photosStore.update((state) => {
        return { ...state, order_id: data.order_id };
      });
      goto("/ip");
    }
  }

  function generateManualId() {
    return Date.now().toString(16) + Math.random().toString(16).substring(2);
  }
</script>

<div class="mx-auto min-w-3/4 h-full">
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

      <Qris
        {dataQris}
        onExpiredTime={handleExpiredTime}
        onPaymentSuccess={handlePaymentSuccess}
        onCreateNewQris="{reloadQris}"
      />

      <button
        class="btn next"
        on:click={() =>
          handlePaymentSuccess({
            order_id: generateManualId(),
            status: "success",
          })}>Selanjutnya</button
      >
    </div>
  {:else}
    <Loading text="Waiting for QRIS generated..."></Loading>
  {/if}
</div>

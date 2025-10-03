<script>
  import { afterNavigate, goto } from "$app/navigation";
  import Loading from "$lib/components/Loading.svelte";
  import { onDestroy, onMount, tick } from "svelte";
  import { generateQris, getPaymentStatus } from "$lib/api/payment";
  import {
    photoOptions,
    photosStore,
    resetPhotoStore,
  } from "../../stores/photos.js";
  import { appSettings } from "../../stores/appSetting.js";
  import Qris from "$lib/components/QRis.svelte";
  import CardProduct from "$lib/components/CardProduct.svelte";

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
    alert("Pilih paket foto terlebih dahulu");
    goto("/");
  }

  onMount(async () => {
    await tick();

    await createQris();
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

      isLoading = false;
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
</script>

{#if !isLoading}
  <div
    class="size-full grid grid-cols-2 justify-center relative mx-auto overflow-auto my-auto p-10"
  >
    <CardProduct {photoType}></CardProduct>
    <!-- <div class="p-2 min-w-[500px]">
      <div
        class="aspect-[4/6] h-full max-h-[800px] p-2 bg-white rounded-xl text-center shadow-xl"
      >
        <h1 class="text-3xl mb-2">{photoType.title}</h1>
        <div class="overflow-hidden">
          <img
            src={photoType.img}
            alt={photoType.title}
            class="w-10/12 mx-auto object-contain bg-base-200 p-2 rounded-xl"
          />
        </div>
        <p class="mt-3 text-gray-500">
          {photoType.description}
        </p>
        <span
          class="mb-3 inline-flex font-bold bg-red-600 text-white rounded-xl py-1 px-2 mt-2"
        >
          Rp{parseInt(photoType.price).toLocaleString("id-ID")}
        </span>
      </div>
    </div> -->

    <div class="overflow-auto p-2">
      <Qris
        {dataQris}
        onExpiredTime={handleExpiredTime}
        onPaymentSuccess={handlePaymentSuccess}
        onCreateNewQris={reloadQris}
      />
    </div>
  </div>
{:else}
  <Loading text="Waiting for QRIS generated..."></Loading>
{/if}

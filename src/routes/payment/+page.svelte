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

  function next() {
    goto("/ip");
  }

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
      isLoading = false;
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

    <div class="overflow-auto p-2 text-center">
      <Qris
        {dataQris}
        onExpiredTime={handleExpiredTime}
        onPaymentSuccess={handlePaymentSuccess}
        onCreateNewQris={reloadQris}
      />

      <button class="mx-auto my-4 btn btn-primary" on:click={next}
        >Lanjut mas
      </button>
    </div>
  </div>
{:else}
  <Loading text="Waiting for QRIS generated..."></Loading>
{/if}

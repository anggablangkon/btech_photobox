<script>
  import { goto } from "$app/navigation";
  import { onMount, tick } from "svelte";
  import { photosStore, resetPhotoStore } from "../../stores/photos.js";
  import { appSettings } from "../../stores/appSetting.js";
  import timeline from "daisyui/components/timeline/index.js";

  let photoType;
  let qrisImage = "";
  let timeLeft;
  let orderId = "";
  let isLoading = true;
  let expiryTime;
  onMount(async () => {
    photosStore.subscribe((v) => {
      photoType = v.photoType || {
        id: 1,
        title: "Standard",
        img: "/Standard.png",
        description: "Cetakan 4 kali foto ",
        price: "30000",
      };
    });

    if (Object.keys(photoType).length < 1) {
      goto("/");
    }

    appSettings.update((state) => {
      return {
        ...state,
        backgroundPage: "/background/BACKGROUND 2.jpg",
        title: "Ringkasan Pembayaran",
      };
    });

    orderId =
      "order_" +
      new Date().toISOString().slice(0, 10) +
      "_" +
      Math.random().toString(36).substring(2, 15);

    createQris();
    isLoading = false;
  });

  async function createQris() {
    const res = await fetch(
      "http://localhost:8000/api/payment/photobox/generateQris",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          gross_amount: photoType.price,
        }),
      }
    );
    const data = await res.json();
    orderId = data.order_id;
    qrisImage = data.image;
    expiryTime = new Date(data.expiry_time.replace(" ", "T")).getTime();
    startCountdown(expiryTime);
  }

  function startCountdown(expiryTime) {
    const interval = setInterval(() => {
      const now = Date.now();
      const distance = expiryTime - now;

      if (distance <= 0) {
        clearInterval(interval);
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

  async function checkStatusPayment() {
    const res = await fetch(
      "http://localhost:8000/api/payment/photobox/getStatus",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          order_id: orderId,
        }),
      }
    );
    const data = await res.json();

    if (data.status == "success") {
      photosStore.update((state) => {
        return { ...state, order_id: data.order_id };
      });
      goto("/ip");
    } else {
      alert("pembayaran belum dilakukan");
    }
  }

  function backToHomePage() {
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
            <img src={photoType.img} alt="" class="h-full mx-auto" />
          </div>
          <p class="mt-3 text-white-500 w-5/6 text-center mx-auto">
            {photoType.description}
          </p>
          <h1
            class="mb-3 inline-flex font-bold bg-red-600 text-white p-2 rounded-xl ,mt-2"
          >
            Rp{parseInt(photoType.price).toLocaleString("id-id")}
          </h1>
        </div>
        <p class="text-center mt-4">
          Pastikan Anda sudah siap setelah membayar
        </p>
      </div>
      <div class="p-2 w-1/2 flex items-center">
        <div class=" text-center mx-auto p-3">
          <div
            class="min-h-[450px] border-double border-4 mx-auto w-[400px] bg-white rounded-xl py-1 px-0.5 shadow flex flex-col items-center justify-center"
          >
            {#if qrisImage}
              <img
                src={qrisImage}
                alt="object-cover w-full Qris Image"
                srcset={qrisImage}
              />
            {:else}
              <span class="loading"> </span>
            {/if}
          </div>
          {#if timeLeft}
            <p class="mx-auto my-5 font-bold">
              Waktu pembayaran {timeLeft}
            </p>
          {/if}
          <div class="grid grid-cols-2 gap-3 mt-5 mx-auto">
            <button
              class="btn bg-base-100 border border-base-200 shadow-xl rounded-full border-3 border-b-6 relative w-full"
              on:click={backToHomePage}>Kembali</button
            >
            <button
              class="btn bg-base-100 border border-base-200 shadow-xl rounded-full border-3 border-b-6 relative w-full"
              on:click={() => checkStatusPayment()}>Saya Sudah Membayar</button
            >
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="w-full flex justify-center items-center h-full w-full">
      <span class="loading loading-dots loading-xl"></span>
    </div>
  {/if}
</div>

<script>
  import { getContext, onDestroy, onMount, tick } from "svelte";
  import { photosStore, resetPhotoStore } from "../../stores/photos";
  import ModalExtraPrint from "$lib/components/modal/ModalExtraPrint.svelte";
  import { Volume2Icon, VolumeXIcon } from "svelte-feather-icons";
  import QRCode from "qrcode";
  import { appSettings } from "../../stores/appSetting";
  import { afterNavigate, goto } from "$app/navigation";
  import { postExtraPrint } from "$lib/api/order";
  import Loading from "$lib/components/Loading.svelte";

  let resultPhoto;
  let selectedFrame;
  let swiperEl;
  let selectedSong;
  let images = [];
  let autoContinueTimer = 0;
  let isOpen = false;
  let autoContinueCountdown;
  let dataQris = {};
  let QrImage;
  let isLoading = true;
  let isPrint = false;

  let { muteAudio, isMuted, destroyAudio } = getContext("layoutFunctions");

  afterNavigate(() => {
    appSettings.update((state) => {
      return {
        ...state,
        backgroundPage: "/background/BACKGROUND 10.jpg",
        title: "Result",
      };
    });
  });
  $: sharingUrl = $photosStore.share_url || "";
  $: selectedSong = $photosStore?.selectedSong || null;
  $: selectedFrame = $photosStore?.frameType || null;
  $: resultPhoto = $photosStore?.imageResult || null;
  $: selectedSong = $photosStore?.selectedSong || null;
  $: images = $photosStore?.photos || [];

  onMount(async () => {
    QRCode.toDataURL(sharingUrl, {
      errorCorrectionLevel: "L",
      margin: "2",
      width: "256",
    })
      .then((url) => (QrImage = url))
      .catch((err) => {
        console.error(err);
      });

    isLoading = false;

    await tick();

    swiperEl?.initialize();
    // await swiperEl?.update();
    // startAutoContinueTimer();
  });

  onDestroy(() => {
    clearInterval(autoContinueTimer);

    destroyAudio();
    resetPhotoStore();
  });

  async function handlePaymentSuccess(data) {
    // Close modal
    isOpen = false;

    // Clear dataQris to force new generation next time
    dataQris = {};
    console.log("dataQris cleared:", dataQris);

    console.log(data);
    // await createExtraPrint(data);

    // Trigger print
    print();
  }

  async function createExtraPrint(data) {
    const formData = new FormData();
    formData.append("order_id", $photosStore.order_id);
    formData.append("invoice_number", data.invoice_number);
    formData.append("total_prints", data.qty);
    formData.append("total_price", data.totalPrice);

    const response = await postExtraPrint(formData);
  }

  function print() {
    isPrint = true;
    const element = document.getElementById("print-area");
    if (element) {
      const printWindow = window.open("", "_blank", "");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print</title>
              <style>
                @page {
                  size: A4; /* 4R size */
                  margin: 0;      /* no margins */
                }
                body {
                  margin: 0;
                  padding: 0;
                  width: 4in;
                  height: 6in;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                #print-area {
                  width:100%;
                  height:100%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  overflow: hidden;
                }
                img {
                  width: 100%;
                  height: 100%;

                }
              </style>
            </head>
            <body>
              ${element.outerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.onload = function () {
          printWindow.print();
          printWindow.close();
        };
      } else {
        alert("Popup blocked! Please allow popups for this website to print.");
      }
    }
  }

  function finishSession() {
    resetPhotoStore();
    goto("/");
  }

  function startAutoContinueTimer() {
    clearInterval(autoContinueTimer);
    autoContinueCountdown = 60;

    autoContinueTimer = setInterval(() => {
      autoContinueCountdown -= 1;
      if (autoContinueCountdown <= 0) {
        clearInterval(autoContinueTimer);
        finishSession();
      }
    }, 1000);
  }
</script>

{#if !isLoading}
  <div class="h-full overflow-hidden">
    <div class="flex justify-between">
      <!-- <span class="inline-flex font-bold p-2 bg-base-100 border-3 rounded-full">
        Waktu tersisa {autoContinueCountdown} detik lagi
      </span> -->
      <div class="inline-flex font-bold p-2 bg-base-100 border-3 rounded-full">
        <span>Song : {selectedSong ? selectedSong.title : "None"}</span>
        <label class="swap ms-2">
          <input type="checkbox" bind:checked={isMuted} on:change={muteAudio} />
          <Volume2Icon class="swap-off"></Volume2Icon>
          <VolumeXIcon class="swap-on"></VolumeXIcon>
        </label>
      </div>
    </div>

    <div class="grid grid-cols-3 size-full gap-10">
      <div class="aspect-[4/3] border my-auto flex items-center justify-center">
        <swiper-container
          init="false"
          bind:this={swiperEl}
          loop="true"
          effect="fade"
          autoplay-delay="2000"
          class="w-full aspect-[4/3]"
        >
          {#if images.length > 0}
            {#each images as v, i}
              <swiper-slide>
                <img
                  src={v}
                  alt="Result Photo {i}"
                  class="h-full object-cover mx-auto"
                />
              </swiper-slide>
            {/each}
          {:else}
            {#each Array(3) as _, i}
              <swiper-slide>
                <img
                  src="/photo-1606107557195-0e29a4b5b4aa.webp"
                  class="w-full h-full object-cover"
                  alt="Result Photo {i}"
                />
              </swiper-slide>
            {/each}
          {/if}
        </swiper-container>
      </div>
      <div
        class="overflow-hidden flex flex-col items-center justify-center gap-2 relative mx-auto"
      >
        <p>Scan QR untuk download file foto</p>
        <div class="border-1 w-full aspect-square rounded-xl overflow-hidden">
          <img src={QrImage} alt="Result Photo With Frame" />
        </div>
        <div class="inline-flex gap-2">
          {#if !isPrint}
            <button
              type="button"
              class="btn bg-base-100 border-base-200 shadow rounded-full border-3 border-b-6 relative"
              on:click={print}>Print</button
            >
          {:else}
            <button
              type="button"
              class="btn bg-base-100 border-base-200 shadow rounded-full border-3 border-b-6 relative"
              on:click={() => (isOpen = true)}
            >
              Extra Print
            </button>
          {/if}

          <button
            type="button"
            class="btn bg-base-100 border-base-200 shadow rounded-full border-3 border-b-6 relative"
            on:click={finishSession}
          >
            Selesai
          </button>
        </div>
      </div>
      <div
        class="aspect-[2/3] h-8/12 my-auto flex overflow-hidden border-2 border-white rounded-xl mx-auto"
        id="print-area"
      >
        <img src={resultPhoto} alt="Print" style="width:100%;height:100%" />
      </div>
    </div>
  </div>
{:else}
  <Loading text="Loading..." />
{/if}

<ModalExtraPrint
  bind:isOpen
  onClose={() => {
    isOpen = false;
  }}
  onUpdateDataQris={(e) => {
    dataQris = e;
  }}
  onPaymentSuccess={(data) => {
    handlePaymentSuccess(data);
  }}
  {dataQris}
/>

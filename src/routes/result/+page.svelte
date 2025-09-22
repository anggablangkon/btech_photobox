<script>
  import { onDestroy, onMount } from "svelte";
  import { photosStore, resetPhotoStore } from "../../stores/photos";
  import QRCode from "qrcode";
  import { appSettings } from "../../stores/appSetting";
  import { goto } from "$app/navigation";

  let resultPhoto;
  let selectedFrame;
  let audio;
  let swiperEl;
  let selectedSong;
  let images;
  let autoContinueTimer = 0;
  let autoContinueCountdown;
  let QrImage;

  onMount(async () => {
    photosStore.subscribe((v) => {
      resultPhoto = v.imageResult;
      selectedFrame = v.frameType;
      selectedSong = v.selectedSong;
      images = v.photos;
    });
    QRCode.toDataURL("test", {
      errorCorrectionLevel: "L",
      margin: "2",
      width: "256",
    })
      .then((url) => (QrImage = url))
      .catch((err) => {
        console.error(err);
      });

    appSettings.update((state) => {
      return {
        ...state,
        backgroundPage: "/background/BACKGROUND 10.jpg",
        title: "Result",
      };
    });

    startAutoContinueTimer();
  });

  onDestroy(() => {
    clearInterval(autoContinueTimer);
    if (selectedSong) {
      audio.pause();
    }
  });

  function timeUpdated(audio) {
    if (audio.currentTime > 15) {
      audio.pause();
      audio.currentTime = 0;
      audio.play();
    }
  }

  function print() {
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
                size: 4in 6in; /* 4R size */
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
    goto("/", { replaceState: true });
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

<div class="grid grid-cols-2 size-full">
  <div class="flex flex-col items-center justify-center h-full relative">
    <span
      class="inline-flex font-bold p-2 bg-base-100 border-3 rounded-full absolute top-0 left-0"
    >
      Waktu tersisa {autoContinueCountdown} detik lagi
    </span>
    <div class="w-2/3 h-[75%] bg-base-300 flex items-center justify-center">
      <swiper-container
        bind:this={swiperEl}
        class="w-full"
        effect="fade"
        autoplay="true"
        slides-per-view="1"
      >
        {#each images as v, i}
          <swiper-slide>
            <img src={v} alt="w-full" />
          </swiper-slide>
        {/each}
      </swiper-container>
    </div>
  </div>
  <div class="flex items-center justify-center gap-10 h-full overflow-hidden">
    <div
      class="aspect-[2/3] w-3/6 flex overflow-hidden border-2 border-white rounded-xl"
      id="print-area"
    >
      {#if [1, 3].includes(selectedFrame)}
        <img
          src={resultPhoto}
          alt="Print"
          style="width:50%;height:100%;object-fit:cover;"
        />
        <img
          src={resultPhoto}
          alt="Print"
          style="width:50%;height:100%;object-fit:cover;"
        />
      {:else}
        <img src={resultPhoto} alt="Print" style="width:100%;height:100%" />
      {/if}
    </div>
    <div
      class="h-full overflow-hidden flex flex-col items-center justify-center gap-2"
    >
      <p>Scan QR untuk download file foto</p>
      <div class=" border border-1 h-[200px] w-[200px]">
        <img src={QrImage} alt="" />
      </div>
      <div class="inline-flex gap-2">
        <button
          type="button"
          class="btn bg-base-100 border border-base-200 shadow rounded-full border-3 border-b-6 relative"
          on:click={print}>Print</button
        >
        <button
          type="button"
          class="btn bg-base-100 border border-base-200 shadow rounded-full border-3 border-b-6 relative"
        >
          Share
        </button>
        <button
          type="button"
          class="btn bg-base-100 border border-base-200 shadow rounded-full border-3 border-b-6 relative"
          on:click={finishSession}
        >
          Selesai
        </button>
      </div>
    </div>
  </div>
</div>
{#if selectedSong}
  <audio
    bind:this={audio}
    src={selectedSong.url}
    autoplay
    volume="1"
    on:timeupdate={() => timeUpdated(audio)}
  ></audio>
{/if}

<script>
  import { onDestroy, onMount } from "svelte";
  import { photosStore } from "../../stores/photos";
  import QRCode from "qrcode";

  let resultPhoto;
  let selectedFrame;
  let audio;
  let selectedSong;
  let QrImage;

  onMount(async () => {
    photosStore.subscribe((v) => {
      resultPhoto = v.imageResult;
      selectedFrame = v.frameType;
      selectedSong = v.selectedSong;
    });
    QRCode.toDataURL('test', {
      errorCorrectionLevel: "L",
      margin: "2",
      width: "256",
    })
      .then((url) => (QrImage = url))
      .catch((err) => {
        console.error(err);
      });
  });

  onDestroy(() => {
    audio.pause();
  });

  function timeUpdated(audio) {
    if (audio.currentTime > 15) {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0.15;
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
</script>

<div class="grid grid-cols-2 w-full">
  <div class="flex items-center justify-center border-2 border-emerald">
    <div class="w-2/3 h-[75%] bg-base-300 flex items-center justify-center">
      <p>Slide Show</p>
    </div>
  </div>
  <div class="flex items-center justify-center border-2 border-emerald gap-10">
    <div class="w-2/4 flex" id="print-area">
      {#if [1, 2, 3].includes(selectedFrame)}
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
        <img src={resultPhoto} alt="Print" style="width:100%" />
      {/if}
    </div>
    <div
      class="h-[75%] overflow-hidden flex flex-col items-center justify-center gap-2"
    >
      <p>Scan QR untuk download file foto</p>
      <div class=" border border-1 h-[200px] w-[200px]">
        <img src={QrImage} alt="" />
      </div>
      <div class="inline-flex gap-2">
        <button
          type="button"
          class="btn btn-primary border shadow"
          on:click={print}>Print</button
        >
        <button class="btn btn-secondary border shadow">Share</button>
      </div>
    </div>
  </div>
</div>
{#if selectedSong}
  <audio
    bind:this={audio}
    src={selectedSong.url}
    autoplay
    on:timeupdate={() => timeUpdated(audio)}
  ></audio>
{/if}

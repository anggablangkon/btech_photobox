<script>
  import { form } from "$app/server";
  import { onDestroy } from "svelte";

  export let isOpen = false;
  export let photoType = {
    id: 1,
    title: "Standard",
    img: "/Standard.png",
    description: "Cetakan 4 kali foto",
    price: "30000",
  };

  // Modern event handlers
  export let onClose = () => {};
  export let onPaymentSuccess = () => {};
  export let onUpdateDataQris = (e) => {};

  export let dataQris = {};
  let qrisImage = "";
  let timeLeft = null;
  let orderId = "";
  let qty = 0;
  let price = 5000;
  let isLoading = false;
  let expiryTime;
  let countdownInterval;
  let paymentCheckInterval;
  let isCheckingPayment = false;
  let qrisExpired = false;

  $: {
    if (isOpen) {
      console.log("Modal opened, checking QRIS status...");
      console.log("dataQris:", dataQris);

      if (Object.keys(dataQris).length !== 0) {
        // Check if existing QRIS is still valid
        const now = Date.now();
        const existingExpiryTime = new Date(
          dataQris.expiryTime.replace(" ", "T")
        ).getTime();

        if (now < existingExpiryTime) {
          // QRIS still valid, use existing data
          console.log("Using existing valid QRIS");
          qrisImage = dataQris.qrisImage;
          orderId = dataQris.orderId;
          expiryTime = existingExpiryTime;
          qrisExpired = false;
          startCountdown();
        }
      }
      isLoading = false;
      startPaymentStatusCheck();
    } else {
      // Modal closed, just clear intervals but keep QRIS data
      clearAllIntervals();
    }
  }

  function onSubmit() {
    // Placeholder for form submission if needed
    const price = parseInt(form.price);
    const qty = parseInt(form.qty);
    const total = price * qty;
    console.log({ price, qty, total });
  }

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

  function cancelIntervals() {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    if (paymentCheckInterval) {
      clearInterval(paymentCheckInterval);
      paymentCheckInterval = null;
    }

    onUpdateDataQris({});
  }

  async function createExtraPrintQris() {
    if (!isOpen || isLoading) return;

    isLoading = true;
    qrisExpired = false;

    try {
      const response = await fetch(
        "http://localhost:8000/api/payment/photobox/generateQrisForExtraPrint",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            gross_amount: qty * price,
            type: "extra_print",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // NEW (triggers reactivity):
      const newDataQris = {
        orderId: data.order_id,
        qrisImage: data.image,
        expiryTime: data.expiry_time,
      };

      // Update local variables
      orderId = data.order_id;
      qrisImage = data.image;
      expiryTime = new Date(data.expiry_time.replace(" ", "T")).getTime();

      console.log("New QRIS generated:", newDataQris);
      startCountdown();

      // Notify parent component about data update
      onUpdateDataQris(newDataQris);
    } catch (error) {
      console.error("Error creating extra print QRIS:", error);
      alert("Gagal membuat kode pembayaran. Silakan coba lagi.");
    } finally {
      isLoading = false;
    }
  }

  function startCountdown() {
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    countdownInterval = setInterval(() => {
      const now = Date.now();
      const distance = expiryTime - now;

      if (distance <= 0) {
        clearInterval(countdownInterval);
        qrisExpired = true;
        timeLeft = "00:00";

        // Stop payment checking when expired
        if (paymentCheckInterval) {
          clearInterval(paymentCheckInterval);
          paymentCheckInterval = null;
        }
        onUpdateDataQris({});
        console.log("QRIS expired");
      } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        timeLeft = `${minutes}:${String(seconds).padStart(2, "0")}`;
      }
    }, 1000);
  }

  function startPaymentStatusCheck() {
    // Clear existing interval first
    if (paymentCheckInterval) {
      clearInterval(paymentCheckInterval);
    }

    const randomInterval = Math.floor(Math.random() * 3000) + 4000;

    paymentCheckInterval = setInterval(async () => {
      if (orderId && !isCheckingPayment && isOpen && !qrisExpired) {
        await checkPaymentStatusAuto();
      }
    }, randomInterval);
  }

  async function checkPaymentStatusAuto() {
    if (isCheckingPayment || qrisExpired) return;

    isCheckingPayment = true;

    try {
      const response = await fetch(
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
      const data = await response.json();

      if (data.status === "success") {
        clearAllIntervals();
        onPaymentSuccess({
          orderId: data.order_id,
          type: "extra_print",
        });
        closeModal();
      }
    } catch (error) {
      console.error("Error auto-checking payment status:", error);
    } finally {
      isCheckingPayment = false;
    }
  }

  async function checkPaymentStatus() {
    if (isCheckingPayment) return;

    isCheckingPayment = true;

    try {
      // For testing - remove when API is ready
      clearAllIntervals();
      onPaymentSuccess({
        orderId: orderId,
        type: "extra_print",
      });
      closeModal();
    } catch (error) {
      console.error("Error checking payment status:", error);
      alert("Terjadi kesalahan saat memeriksa status pembayaran");
    } finally {
      isCheckingPayment = false;
    }
  }

  function refreshQris() {
    console.log("Manual QRIS refresh triggered");
    createExtraPrintQris();
    startPaymentStatusCheck();
  }

  function closeModal() {
    clearAllIntervals();
    // Don't clear qrisImage, timeLeft, orderId here - keep the data for reuse
    onClose();
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  }
</script>

{#if isOpen}
  <!-- Modal backdrop -->
  <div
    class="fixed inset-0 bg-base-200/70 flex items-center justify-center z-50 p-4"
    on:click={handleBackdropClick}
    on:keydown={(e) => e.key === "Escape" && closeModal()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="0"
  >
    <!-- Modal content -->
    <div
      class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
    >
      <!-- Modal header -->
      <div
        class="flex justify-between items-center p-6 border-b border-gray-200"
      >
        <h2 id="modal-title" class="text-2xl font-bold text-gray-800">
          Cetak Tambahan
        </h2>
        <button
          on:click={closeModal}
          class="text-gray-400 hover:text-gray-600 text-3xl font-bold leading-none"
          aria-label="Close modal"
        >
          ×
        </button>
      </div>

      <!-- Modal body -->
      <div class="p-6">
        {#if !isLoading && Object.keys(dataQris).length !== 0}
          <div class="gap-8 items-center">
            <!-- QR Code section -->
            <div class="flex-1">
              <div class="text-center">
                {#if qrisImage && timeLeft}
                  <div
                    class="border-4 border-gray-200 rounded-xl p-4 bg-white shadow-lg relative"
                  >
                    <img
                      src={qrisImage}
                      alt="QRIS Payment Code"
                      class="w-full max-w-[300px] mx-auto {qrisExpired
                        ? 'opacity-50'
                        : ''}"
                    />
                    {#if qrisExpired}
                      <div
                        class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-xl"
                      >
                        <div
                          class="bg-red-600 text-white px-4 py-2 rounded-lg font-bold"
                        >
                          QR Code Expired
                        </div>
                      </div>
                    {/if}
                  </div>
                {:else}
                  <div
                    class="border-4 border-gray-200 rounded-xl p-4 bg-white shadow-lg min-h-[300px] flex items-center justify-center"
                  >
                    <span class="loading loading-spinner loading-lg"></span>
                  </div>
                {/if}

                {#if timeLeft}
                  <p
                    class="mt-4 font-bold text-lg {qrisExpired
                      ? 'text-red-600'
                      : ''}"
                  >
                    {#if qrisExpired}
                      QR Code telah kedaluwarsa
                    {:else}
                      Waktu pembayaran {timeLeft}
                    {/if}
                  </p>
                {/if}

                <!-- Payment status indicator -->
                {#if qrisExpired}
                  <p class="text-sm text-red-600 mt-2">
                    ❌ QR Code sudah tidak berlaku
                  </p>
                  <button
                    class="btn bg-blue-600 text-white border border-blue-600 rounded-full px-6 py-2 mt-4 font-semibold hover:bg-blue-700 transition-colors"
                    on:click={refreshQris}
                    disabled={isLoading}
                  >
                    {#if isLoading}
                      <span class="loading loading-spinner loading-sm mr-2"
                      ></span>
                    {/if}
                    🔄 Buat QR Code Baru
                  </button>
                {:else if isCheckingPayment}
                  <p
                    class="text-sm text-blue-600 mt-2 flex items-center justify-center gap-2"
                  >
                    <span class="loading loading-spinner loading-sm"></span>
                    Memeriksa status pembayaran...
                  </p>
                {:else}
                  <p class="text-sm text-gray-500 mt-2">
                    ✅ Pembayaran dicek otomatis setiap 4-7 detik
                  </p>
                {/if}
              </div>
            </div>
          </div>
        {:else if !isLoading}
          <form on:submit|preventDefault={createExtraPrintQris}>
            <p class="m-0">
              Untuk harga per print dikenakan charge sebesar Rp.{price}
            </p>
            <div class="flex items-center gap-4">
              <label for="qty" class="font-bold">Jumlah:</label>
              <div class="join">
                <button
                  type="button"
                  class="btn join-item"
                  on:click={() => {
                    if (qty > 0) qty = qty - 1;
                  }}
                  disabled={isLoading}
                >
                  -
                </button>
                <input
                  type="number"
                  name="qty"
                  bind:value={qty}
                  class="input input-bordered join-item bg-gray-50 w-24 text-center"
                  readonly
                />
                <button
                  type="button"
                  class="btn join-item"
                  on:click={() => {
                    qty = qty + 1;
                  }}
                  disabled={isLoading}
                >
                  +
                </button>
              </div>
            </div>
            <div class="mt-4">
              <label for="price" class="font-bold">Total Harga:</label>
              <div class="join">
                <input
                  type="text"
                  name="price"
                  value={qty * parseInt(price)}
                  class="input input-bordered bg-gray-50 w-full max-w-xs"
                  readonly
                />
              </div>
            </div>
            <button
              type="submit"
              class="btn bg-blue-600 text-white border border-blue-600 rounded-full px-6 py-2 mt-4 font-semibold hover:bg-blue-700 transition-colors"
              disabled={isLoading || qty === 0}
            >
              {#if isLoading}
                <span class="loading loading-spinner loading-sm mr-2"></span>
              {/if}
              Buat QR Code
            </button>
          </form>
        {:else}
          <div class="flex flex-col items-center">
            <span class="loading loading-spinner loading-xl"></span>
            <p class="mt-4 text-gray-600">Membuat kode pembayaran...</p>
          </div>
        {/if}
      </div>

      {#if qrisImage && !qrisExpired}
        <!-- Modal footer -->
        <div class="flex justify-center gap-4 p-6 border-t border-gray-200">
          <button
            class="btn bg-gray-100 border border-gray-300 rounded-full px-8 py-2 font-semibold hover:bg-gray-200 transition-colors"
            on:click={closeModal}
          >
            Batal
          </button>
          <button
            class="btn bg-base-300 text-white border-3 border-b-6 border-base-200 rounded-full px-8 py-2 font-semibold hover:bg-base-200 transition-colors disabled:bg-base-300"
            on:click={cancelIntervals}
          >
            Cancel
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* Prevent body scroll when modal is open */
  :global(body.modal-open) {
    overflow: hidden;
  }
</style>

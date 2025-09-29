<script>
  import { onDestroy } from "svelte";
  import {
    generateExtraPrintQris,
    getPaymentStatus,
  } from "$lib/api/payment.js";
  import Qris from "../Qris.svelte";

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
  export let onPaymentSuccess = (data) => {};
  export let onUpdateDataQris = (e) => {};

  export let dataQris = {};

  let qty = 0;
  let price = 5000;
  let isLoading = false;
  let showQris = false;
  let qrisData = {};

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
          qrisData = {
            qrisImage: dataQris.qrisImage,
            orderId: dataQris.orderId,
            expiryTime: dataQris.expiryTime,
          };
          showQris = true;
        } else {
          // QRIS expired, reset to form view
          showQris = false;
          onUpdateDataQris({});
        }
      } else {
        showQris = false;
      }
      isLoading = false;
    }
  }

  onDestroy(() => {
    // Component cleanup handled by Qris component
  });

  async function createExtraPrintQris() {
    if (!isOpen || isLoading || qty <= 0) return;

    isLoading = true;
    const totalPrice = qty * parseInt(price);

    // try {
    //   const paymentData = {
    //     gross_amount: totalPrice,
    //     type: "extra_print",
    //     quantity: qty,
    //   };

    //   const data = await generateExtraPrintQris(paymentData);

    //   // Create new dataQris object
    //   const newDataQris = {
    //     orderId: data.order_id,
    //     qrisImage: data.image,
    //     expiryTime: data.expiry_time,
    //     qty: qty,
    //     totalPrice: totalPrice,
    //   };

    //   // Update qrisData for Qris component
    //   qrisData = {
    //     qrisImage: data.image,
    //     orderId: data.order_id,
    //     expiryTime: data.expiry_time,
    //   };

    //   console.log("New QRIS generated:", newDataQris);

    //   // Show QRIS component
    //   showQris = true;

    //   // Notify parent component about data update
    //   onUpdateDataQris(newDataQris);
    // } catch (error) {
    //   console.error("Error creating extra print QRIS:", error);
    //   alert("Gagal membuat kode pembayaran. Silakan coba lagi.");
    // } finally {
    //   isLoading = false;
    // }

    onPaymentSuccess({
      invoice_number: "TEST-INVOICE-123",
      type: "extra_print",
      qty: qty,
      totalPrice: totalPrice,
    });
  }

  function handleQrisExpired(data) {
    console.log("QRIS expired:", data);
    showQris = false;
    onUpdateDataQris({});
  }

  function handlePaymentSuccess() {
    onPaymentSuccess({
      invoice_number: dataQris.orderId,
      type: "extra_print",
      qty: dataQris.qty || qty,
      totalPrice: dataQris.totalPrice || qty * parseInt(price),
    });
    closeModal();
  }

  function refreshQris() {
    console.log("Manual QRIS refresh triggered");
    showQris = false;
    createExtraPrintQris();
  }

  function closeModal() {
    showQris = false;
    onClose();
  }

  function cancelPayment() {
    showQris = false;
    onUpdateDataQris({});
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
        {#if showQris && qrisData.qrisImage}
          <!-- QRIS Payment Section -->
          <div class="text-center mb-6">
            <h3 class="text-xl font-semibold mb-4">
              Pembayaran Cetak Tambahan
            </h3>

            <!-- Order Summary -->
            <div class="bg-gray-50 rounded-lg p-4 mb-4 max-w-md mx-auto">
              <div class="flex justify-between items-center mb-2">
                <span class="text-gray-600">Jumlah Print:</span>
                <span class="font-bold">{dataQris?.qty || qty} lembar</span>
              </div>
              <div class="flex justify-between items-center mb-2">
                <span class="text-gray-600">Harga per Print:</span>
                <span>Rp {price.toLocaleString("id-ID")}</span>
              </div>
              <div class="flex justify-between items-center border-t pt-2">
                <span class="text-gray-600 font-semibold">Tot al:</span>
                <span class="font-bold text-lg">
                  Rp {(dataQris?.totalPrice || qty * price).toLocaleString(
                    "id-ID"
                  )}
                </span>
              </div>
            </div>
          </div>

          <!-- Integrated Qris Component -->
          <div class="flex justify-center">
            <Qris
              dataQris={qrisData}
              onExpiredTime={handleQrisExpired}
              onPaymentSuccess={handlePaymentSuccess}
            />
          </div>

          <!-- Action buttons for QRIS view -->
          <div class="flex justify-center gap-4 mt-6">
            <button
              class="btn bg-gray-100 border border-gray-300 rounded-full px-8 py-2 font-semibold hover:bg-gray-200 transition-colors"
              on:click={closeModal}
            >
              Tutup
            </button>
          </div>
        {:else if !isLoading}
          <!-- Order Form Section -->
          <form on:submit|preventDefault={createExtraPrintQris}>
            <div class="space-y-6">
              <!-- Price Information -->
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p class="font-semibold mb-2">Informasi Harga</p>
                <p>
                  Untuk setiap cetak tambahan dikenakan biaya sebesar
                  <span class="font-bold"
                    >Rp {price.toLocaleString("id-ID")}</span
                  > per lembar
                </p>
              </div>

              <!-- Quantity Selector -->
              <div class="flex items-center justify-between">
                <label for="qty" class="font-bold text-lg">Jumlah Print:</label>
                <div class="join">
                  <button
                    type="button"
                    class="btn join-item btn-base-100 text-white"
                    on:click={() => {
                      if (qty > 0) qty = qty - 1;
                    }}
                    disabled={isLoading || qty <= 0}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    name="qty"
                    bind:value={qty}
                    class="input input-bordered join-item bg-gray-50 w-24 text-center font-bold text-lg"
                    min="0"
                    max="10"
                  />
                  <button
                    type="button"
                    class="btn join-item btn-base-100 text-white"
                    on:click={() => {
                      if (qty < 10) qty = qty + 1;
                    }}
                    disabled={isLoading || qty >= 10}
                  >
                    +
                  </button>
                </div>
              </div>

              <!-- Total Price Display -->
              <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-lg"
                    >Total yang harus dibayar:</span
                  >
                  <span class="text-2xl font-bold">
                    Rp {(qty * parseInt(price)).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <!-- Submit Button -->
              <div class="text-center">
                <button
                  type="submit"
                  class="btn bg-base-100 text-white border rounded-full px-8 py-3 text-lg font-semibold hover:bg-base-200 transition-colors"
                  disabled={isLoading || qty === 0}
                >
                  {#if isLoading}
                    <span class="loading loading-spinner loading-sm mr-2"
                    ></span>
                    Membuat QR Code...
                  {:else}
                    Buat QR Code Pembayaran
                  {/if}
                </button>
              </div>
          </form>
        {:else}
          <!-- Loading State -->
          <div class="flex flex-col items-center py-12">
            <span class="loading loading-spinner loading-xl"></span>
            <p class="mt-4 text-gray-600 text-lg">Membuat kode pembayaran...</p>
          </div>
        {/if}
      </div>

    </div>
  </div>
{/if}

<style>
  /* Prevent body scroll when modal is open */
  :global(body.modal-open) {
    overflow: hidden;
  }
</style>

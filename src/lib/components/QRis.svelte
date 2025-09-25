<script>
  import { getPaymentStatus } from "$lib/api/payment.js";

  export let dataQris = {
    qrisImage: "",
    orderId: "",
    expiryTime: null,
  };

  export let onExpiredTime = (data) => {};
  export let onPaymentSuccess = (data) => {};

  let isCheckingPayment = false;
  let timeLeft = 0; // in seconds
  let paymentCheckInterval;
  let countdownInterval;
  let orderId;
  let qrisImage;
  let initialTimeSet = false;
  let totalInitialTime = 0;

  $: {
    qrisImage = dataQris?.qrisImage;
    orderId = dataQris?.orderId;
  }

  $: if (dataQris && dataQris.expiryTime) {
    console.log("[QRIS] Setting up with expiry time:", dataQris.expiryTime);

    const now = new Date();
    const expiry = new Date(dataQris.expiryTime);
    const newTimeLeft = Math.max(0, Math.floor((expiry - now) / 1000));

    console.log("[QRIS] Time calculation:", {
      now: now.toISOString(),
      expiry: expiry.toISOString(),
      newTimeLeft,
    });

    // Only update if this is a new QRIS or time has significantly changed
    if (!initialTimeSet || Math.abs(timeLeft - newTimeLeft) > 5) {
      timeLeft = newTimeLeft;

      if (!initialTimeSet) {
        totalInitialTime = timeLeft;
        initialTimeSet = true;
      }

      if (timeLeft <= 0) {
        console.log("[QRIS] Time already expired");
        clearAllInterval();
        onExpiredTime(dataQris);
      } else {
        console.log("[QRIS] Starting countdown and payment checking");
        startCountdown();
        startPaymentChecking();
      }
    }
  }

  // Format time as MM:SS
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  function startCountdown() {
    // Clear existing interval
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }

    console.log("[QRIS] Starting countdown with timeLeft:", timeLeft);

    countdownInterval = setInterval(() => {
      timeLeft = Math.max(0, timeLeft - 1);
      console.log("[QRIS] Countdown tick:", timeLeft);

      if (timeLeft <= 0) {
        console.log("[QRIS] Countdown reached zero");
        clearAllInterval();
        onExpiredTime(dataQris);
      }
    }, 1000);
  }

  function startPaymentChecking() {
    // Clear existing interval
    if (paymentCheckInterval) {
      clearInterval(paymentCheckInterval);
      paymentCheckInterval = null;
    }

    if (!orderId) {
      console.warn("[QRIS] No orderId provided, skipping payment checking");
      return;
    }

    console.log("[QRIS] Starting payment checking for orderId:", orderId);

    // Initial check
    setTimeout(() => {
      checkPaymentStatus();
    }, 2000); // Wait 2 seconds before first check

    // Set up recurring checks
    paymentCheckInterval = setInterval(() => {
      if (timeLeft > 0 && orderId) {
        checkPaymentStatus();
      } else {
        console.log(
          "[QRIS] Stopping payment checks - timeLeft:",
          timeLeft,
          "orderId:",
          orderId
        );
        clearInterval(paymentCheckInterval);
        paymentCheckInterval = null;
      }
    }, 5000); // Check every 5 seconds
  }

  async function checkPaymentStatus() {
    if (!orderId || isCheckingPayment || timeLeft <= 0) {
      console.log("[QRIS] Skipping payment check:", {
        orderId,
        isCheckingPayment,
        timeLeft,
      });
      return;
    }

    console.log("[QRIS] Checking payment status for orderId:", orderId);

    try {
      isCheckingPayment = true;
      const data = await getPaymentStatus(orderId);

      console.log("[QRIS] Payment status response:", data);

      if (
        data.status === "success" ||
        data.status === "paid" ||
        data.status === "settlement"
      ) {
        console.log("[QRIS] Payment successful!");
        clearAllInterval();
        onPaymentSuccess(data);
      } else if (
        data.status === "failed" ||
        data.status === "cancelled" ||
        data.status === "expired"
      ) {
        console.log("[QRIS] Payment failed or cancelled:", data.status);
        clearAllInterval();
        onExpiredTime({
          ...dataQris,
          reason: data.status,
          message: data.message,
        });
      } else {
        console.log("[QRIS] Payment still pending:", data.status);
      }
    } catch (error) {
      console.error("[QRIS] Error checking payment status:", error);
    } finally {
      isCheckingPayment = false;
    }
  }

  function clearAllInterval() {
    console.log("[QRIS] Clearing all intervals");

    if (paymentCheckInterval) {
      clearInterval(paymentCheckInterval);
      paymentCheckInterval = null;
    }
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }

  // Clean up intervals when component is destroyed
  import { onDestroy } from "svelte";
  onDestroy(() => {
    console.log("[QRIS] Component destroyed, cleaning up intervals");
    clearAllInterval();
  });

  // Reset when dataQris changes completely (new payment)
  $: if (dataQris?.orderId !== orderId && dataQris?.orderId) {
    console.log("[QRIS] New orderId detected, resetting component");
    initialTimeSet = false;
    clearAllInterval();
  }

  // Reactive statement to get time color based on remaining time
  $: timeColor =
    timeLeft <= 60
      ? "text-red-500"
      : timeLeft <= 300
        ? "text-orange-500"
        : "text-green-600";

  // Progress percentage for visual indicator
  $: progressPercentage =
    totalInitialTime > 0
      ? ((totalInitialTime - timeLeft) / totalInitialTime) * 100
      : 0;

  // Export function for manual refresh
  export function refreshPaymentCheck() {
    console.log("[QRIS] Manual payment check triggered");
    if (orderId && timeLeft > 0) {
      checkPaymentStatus();
    }
  }
</script>

<div class="p-2 w-1/2 flex items-center">
  <div class="text-center mx-auto p-3">
    {#if qrisImage && timeLeft > 0}
      <div
        class="h-min border-double border-4 border-white mx-auto w-[400px] bg-base-100 rounded-xl shadow flex flex-col items-center justify-center overflow-hidden"
      >
        <img
          src={qrisImage}
          alt="QRIS Payment Code"
          class="object-cover w-full"
        />
      </div>
    {:else if timeLeft === 0}
      <div
        class="min-h-[350px] border-double border-4 border-red-200 mx-auto w-[400px] bg-red-50 rounded-xl shadow flex flex-col items-center justify-center overflow-hidden"
      >
        <div class="text-red-500 text-6xl mb-4">⏰</div>
        <p class="text-red-600 font-bold text-lg">Waktu Pembayaran Habis</p>
        <p class="text-red-500 text-sm">Silakan buat pembayaran baru</p>
      </div>
    {:else}
      <div
        class="min-h-[350px] border-double border-4 border-white mx-auto w-[400px] bg-base-100 rounded-xl shadow flex flex-col items-center justify-center overflow-hidden"
      >
        <span class="loading loading-spinner loading-lg"></span>
        <p class="mt-4 text-gray-500">Memuat QR Code...</p>
      </div>
    {/if}

    <!-- Timer Display -->
    {#if timeLeft > 0}
      <div class="mx-auto my-5">
        <p class="font-bold text-lg {timeColor} mb-2">
          Waktu pembayaran: {formatTime(timeLeft)}
        </p>

        <!-- Progress Bar -->
        <div class="w-full bg-gray-200 rounded-full h-2 max-w-[400px] mx-auto">
          <div
            class="h-2 rounded-full transition-all duration-1000 {timeLeft <= 60
              ? 'bg-red-500'
              : timeLeft <= 300
                ? 'bg-orange-500'
                : 'bg-green-500'}"
            style="width: {progressPercentage}%"
          ></div>
        </div>

        <!-- Warning messages -->
        {#if timeLeft <= 60}
          <p class="text-red-500 text-sm mt-2 animate-pulse">
            ⚠️ Segera lakukan pembayaran!
          </p>
        {:else if timeLeft <= 300}
          <p class="text-orange-500 text-sm mt-2">
            ⏳ Waktu pembayaran tinggal sedikit
          </p>
        {/if}
      </div>
    {/if}

    <!-- Payment status indicator -->
    {#if isCheckingPayment}
      <div
        class="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-[400px] mx-auto mt-3"
      >
        <p class="text-sm text-blue-600 flex items-center justify-center gap-2">
          <span class="loading loading-spinner loading-sm"></span>
          Memeriksa status pembayaran...
        </p>
      </div>
    {:else if timeLeft > 0}
      <div
        class="bg-gray-50 border border-gray-200 rounded-lg p-3 max-w-[400px] mx-auto mt-3"
      >
        <p class="text-xs text-gray-600">
          🔄 Status pembayaran dicek otomatis setiap 5 detik
        </p>
        <!-- Debug info (remove in production) -->
        <p class="text-xs text-gray-400 mt-1">
          OrderID: {orderId || "Not set"} | Next check in: {paymentCheckInterval
            ? "~5s"
            : "Stopped"}
        </p>
      </div>
    {/if}

    <!-- Manual refresh button (for debugging) -->
    {#if timeLeft > 0 && orderId}
      <div class="mt-3">
        <button
          class="btn btn-sm btn-outline"
          on:click={() => checkPaymentStatus()}
          disabled={isCheckingPayment}
        >
          {#if isCheckingPayment}
            <span class="loading loading-spinner loading-xs"></span>
          {:else}
            🔄
          {/if}
          Check Now
        </button>
      </div>
    {/if}

    <!-- Instructions -->
    {#if timeLeft > 0}
      <div
        class="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-[400px] mx-auto mt-4"
      >
        <h4 class="font-semibold text-blue-800 mb-2 text-sm">
          Cara Pembayaran:
        </h4>
        <ol class="text-xs text-blue-700 space-y-1 text-left">
          <li>1. Buka aplikasi mobile banking/e-wallet</li>
          <li>2. Pilih fitur "Scan QR" atau "QRIS"</li>
          <li>3. Scan QR code di atas</li>
          <li>4. Konfirmasi jumlah pembayaran</li>
          <li>5. Selesaikan pembayaran</li>
        </ol>
      </div>
    {/if}
  </div>
</div>

<style>
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
</style>

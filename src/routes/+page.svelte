<script>
	import { goto } from '$app/navigation';

	function handleStart(mode) {
		// simpan pilihan
		localStorage.setItem('mode', mode);
		goto('/photobooth');
	}
</script>

<div class="flex items-center justify-center w-full">
	<div class="flex flex-col items-center text-center p-6">
		<h1 class="text-3xl font-bold mb-4">📸 Selamat Datang di Photobooth!</h1>
		<p class="text-lg mb-8">Pilih mode penggunaan:</p>

		<div class="flex gap-4">
			<button
				on:click={() => handleStart('gratis')}
				class="px-6 py-3 rounded-xl bg-green-500 text-white font-semibold shadow-md hover:bg-green-600 transition"
			>
				🆓 Gratis
			</button>

			<button
				on:click={() => handleStart('bayar')}
				class="px-6 py-3 rounded-xl bg-yellow-500 text-white font-semibold shadow-md hover:bg-yellow-600 transition"
			>
				💰 Bayar (QR)
			</button>
		</div>
	</div>
</div>

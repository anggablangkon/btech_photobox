<script>
	import { goto } from '$app/navigation';

	function handleStart(mode) {
		// Simpan pilihan di localStorage (atau store kalau perlu)
		localStorage.setItem('mode', mode);
		goto('/photobooth');
	}
</script>

<h1>📸 Selamat Datang di Photobooth!</h1>
<p>Pilih mode penggunaan:</p>

<button on:click={() => handleStart('gratis')}>🆓 Gratis</button>
<button on:click={() => handleStart('bayar')}>💰 Bayar (QR)</button>

<script>
	// Kamu bisa tambahkan global store, atau navigasi di sini juga
</script>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Segoe UI', sans-serif;
		background: #f5f5f5;
		color: #333;
	}

	main {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		background: white;
		box-shadow: 0 0 10px rgba(0,0,0,0.1);
	}

	header {
		width: 100%;
		padding: 1rem;
		text-align: center;
		background: #222;
		color: white;
		font-size: 1.5rem;
	}

	footer {
		margin-top: auto;
		padding: 1rem;
		font-size: 0.8rem;
		color: #888;
		text-align: center;
	}
</style>

<header>
	📸 Photobooth App
</header>

<main>
	<slot /> <!-- Konten halaman akan dirender di sini -->
</main>

<footer>
	&copy; {new Date().getFullYear()} - Dibuat dengan SvelteKit
</footer>

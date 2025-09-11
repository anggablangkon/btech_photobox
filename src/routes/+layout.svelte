<script>
  import "../app.css";
</script>

<div class="flex flex-col min-h-screen bg-gray-100 text-gray-800 font-sans">
  <!-- Fixed header -->
  <header
    class="fixed top-0 left-0 w-full h-16 flex items-center justify-center bg-gray-900 text-white text-xl font-bold shadow-md z-50"
  >
    📸 Photobooth App
  </header>

  <!-- Main (always fills screen below header) -->
  <main
    class="flex flex-col w-full max-w-12xl mx-auto p-6 bg-white shadow-lg mt-16 min-h-[calc(100vh-6rem)]"
  >
    <!-- Scrollable content -->
    <div class="flex-grow flex overflow-y-auto w-full h-full">
      <slot />
    </div>

    <!-- Footer always at bottom of main -->
    <footer class="w-full mt-4 p-4 text-center text-sm text-gray-500">
      &copy; {new Date().getFullYear()} - Dibuat dengan SvelteKit
    </footer>
  </main>
</div>

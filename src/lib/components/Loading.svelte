<script>
  export let text = "Loading...";
</script>

<div class="flex justify-center items-center h-full">
  <div class="card inline-flex bg-gray-50 border-4 shadow animate-bounce">
    <div class="card-body">
      <p class="loading loading-dots loading-xl mx-auto"></p>
      <p>{text}</p>
    </div>
  </div>
</div>

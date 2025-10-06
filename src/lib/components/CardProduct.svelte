<script>

  export let photoType;
  export let onSelect = null;

  let selected = false;

  function handleClick() {
    selected = !selected;
    if (onSelect) {
      onSelect({ photoType, selected });
    }
  }
</script>

{#if onSelect}
  <button
    class="h-full flex flex-col flex-grow shrink items-center border-4 bg-blue-50 shadow-md mx-auto text-center rounded-xl px-10 aspect-[2/3]
        {selected ? 'border-blue-400' : 'border-blue-100'}"
    on:click={handleClick}
  >
    <h1 class="mb-auto mb-3 font-bold text-xl mt-3">{photoType.title}</h1>
    <div class="bg-base-200 p-0 items-center rounded-xl overflow-hidden">
      <img src={photoType.img} alt="" class="h-full mx-auto object-cover" />
    </div>
    <div class="card-footer mt-auto">
      <p class="text-white-500 text-center mx-auto">
        {photoType.description}
      </p>
      <h1
        class="mb-3 inline-flex font-bold bg-red-600 text-white px-2 py-1 rounded-xl mt-2"
      >
        Rp{parseInt(photoType.price).toLocaleString("id-id")}
      </h1>
    </div>
  </button>
{:else}
  <div
    class="h-full flex flex-col flex-grow shrink items-center border-4 bg-blue-50 shadow-md mx-auto text-center rounded-xl px-10 aspect-[2/3]
        {selected ? 'border-blue-400' : 'border-blue-100'}"
  >
    <h1 class="mb-auto mb-3 font-bold text-xl mt-3">{photoType.title}</h1>
    <div class="bg-base-200 p-0 items-center rounded-xl overflow-hidden">
      <img src={photoType.img} alt="" class="h-full mx-auto object-cover" />
    </div>
    <div class="card-footer mt-auto">
      <p class="text-white-500 text-center mx-auto">
        {photoType.description}
      </p>
      <h1
        class="mb-3 inline-flex font-bold bg-red-600 text-white px-2 py-1 rounded-xl mt-2"
      >
        Rp{parseInt(photoType.price).toLocaleString("id-id")}
      </h1>
    </div>
  </div>
{/if}

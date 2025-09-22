<script>
  export let photoType;
  export let onSelect = null;

  let selected = false;

  function handleClick() {
    selected = !selected;
    alert("test");
    if (onSelect) {
      onSelect({ photoType, selected });
    }
  }
</script>

<div
  class="w-full h-full flex flex-col shrink items-center border-4 bg-blue-50 shadow-md mx-auto text-center rounded-xl
        {selected ? 'border-blue-400' : 'border-blue-100'}"
  on:click={handleClick}
>
  <h1 class="mb-3 font-bold text-xl mt-3">{photoType.title}</h1>
  <div class="w-5/6 h-10/12 bg-blue-200 items-center rounded-xl">
    <img src={photoType.img} alt="" class="h-full mx-auto" />
  </div>
  <p class="mt-3 text-white-500 w-5/6 text-center mx-auto">
    {photoType.description}
  </p>
  <h1
    class="mb-3 inline-flex font-bold bg-red-600 text-white p-2 rounded-xl ,mt-2"
  >
    Rp{parseInt(photoType.price).toLocaleString("id-id")}
  </h1>
</div>

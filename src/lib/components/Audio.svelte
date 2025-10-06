<script>
  import { getSongUrl } from "$lib/helpers/song";
  import { onMount, onDestroy } from "svelte";

  export let selectedSong = null;
  export let isPlayed = false;
  export let ontimeupdate = () => {};
  export let loop = false;
  let audio;

  // Play audio if isPlayed is true when mounted
  onMount(() => {
    if (audio) {
      audio.volume = 0.9;
      audio.loop = loop;
      if (isPlayed) {
        audio.play();
      }
    }
  });

  // Watch for changes in isPlayed or loop
  $: if (audio) {
    audio.loop = loop;
    if (isPlayed && audio.paused) {
      audio.play();
    } else if (!isPlayed && !audio.paused) {
      audio.pause();
    }
  }

  // Watch for changes in selectedSong
  $: if (audio && selectedSong) {
    audio.src = selectedSong.song_url;
    audio.currentTime = selectedSong.start_time || 0;
    if (isPlayed) {
      audio.play();
    }
  }

  function timeUpdated() {
    if (ontimeupdate) {
      if (
        audio &&
        selectedSong &&
        typeof selectedSong.start_time === "number" &&
        audio.currentTime >= selectedSong.start_time &&
        !isPlayed
      ) {
        audio.play();
        isPlayed = true;
      }
      ontimeupdate(audio);
    }
  }

  onDestroy(() => {
    if (audio) {
      audio.pause();
    }
  });
</script>

{#if selectedSong}
  <audio
    bind:this={audio}
    src={getSongUrl(selectedSong.song_url)}
    {loop}
    autoplay
    on:timeupdate={timeUpdated}
  ></audio>
{/if}

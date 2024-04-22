<script lang="ts">
  let start = false;
  let startedAt: Date;
  let display: string = "00:00:00";
  let timer: ReturnType<typeof setInterval> | undefined = undefined;

  $: if (start) {
    clearTimeout(timer);
    startedAt = new Date();
    timer = setInterval(() => (display = getTime(startedAt)), 1000);
  }

  $: if (!start && timer) clearInterval(timer);

  function getTime(date: Date): string {
    const now = new Date();
    const elapsed = now.getTime() - date.getTime(); // Difference in milliseconds

    // Convert milliseconds to hours, minutes, and seconds
    let seconds = Math.floor(elapsed / 1000);
    let minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    seconds = seconds % 60; // Remaining seconds
    minutes = minutes % 60; // Remaining minutes

    // Pad with zero if necessary to ensure two digits
    const hoursStr = hours.toString().padStart(2, "0");
    const minutesStr = minutes.toString().padStart(2, "0");
    const secondsStr = seconds.toString().padStart(2, "0");

    // Format the time as "hh:mm:ss"
    return `${hoursStr}:${minutesStr}:${secondsStr}`;
  }

  export { start };
</script>

<div class="flex items-center gap-2">
  <div class:badge-error={start} class="badge badge-sm aspect-square flex-none">
    <iconify-icon class="text-neutral" icon="mdi:stop"></iconify-icon>
  </div>
  {#if start}
    <time datetime={display} class="text-sm font-mono">{display}</time>
  {:else}
    <span class="flex-1 text-sm">Not recording</span>
  {/if}
</div>

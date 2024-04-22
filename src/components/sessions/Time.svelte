<script lang="ts">
  import { getTimeBetween } from "@/helpers/time";

  let start = false;
  let startedAt: Date;
  let display: string = "00:00:00";
  let timer: ReturnType<typeof setInterval> | undefined = undefined;

  $: if (start) {
    clearTimeout(timer);
    startedAt = new Date();
    timer = setInterval(
      () => (display = getTimeBetween(startedAt, new Date())),
      1000
    );
  }

  $: if (!start && timer) clearInterval(timer);

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

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { getTimeBetween } from "@/helpers/time";

  let enabled = true;
  let className: string = "";
  let momentNote: string = "";
  let start: Date | undefined = new Date();
  let current: Date | undefined = undefined;
  let moments: { time: Date; text: string; [key: string]: any }[] = [];

  const dispatch = createEventDispatcher();

  function makeMoment() {
    const moment = {
      text: momentNote,
      time: current ?? new Date(),
    };
    moments = [...moments, moment];
    momentNote = "";

    dispatch("update", moments);
  }

  export { className as class, moments, enabled, start, current };
</script>

<div
  class="rounded-lg bg-sus-surface-0 shadow-md flex flex-col gap-4 {className ??
    ''}"
>
  <h4
    class:tooltip={!enabled}
    data-tip="Key moments will be enabled when recording is started"
    class="text-left p-3 font-semibold border-b border-neutral-200 flex-none tooltip-secondary tooltip-bottom tooltip-open"
  >
    Key Moments
  </h4>
  <div class="px-3 overflow-auto flex-1">
    {#if enabled && start}
      <ul>
        {#each moments as moment}
          <li class="flex gap-8 items-center p-2">
            <time
              class="flex-none text-xs font-mono font-semibold"
              datetime={getTimeBetween(start, moment.time)}
              >{getTimeBetween(start, moment.time)}</time
            >
            <span class="flex-1">{moment.text}</span>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
  <footer class="p-3 flex-none">
    <form
      action="/"
      class="flex justify-center gap-4"
      on:submit|preventDefault={() => makeMoment()}
    >
      <input
        type="text"
        bind:value={momentNote}
        placeholder="Make a note.."
        class="input input-bordered flex-1"
      />
      <button type="submit" disabled={!start} class="btn btn-primary">
        <iconify-icon class="text-xl" icon="mdi:pin"></iconify-icon>
      </button>
    </form>
  </footer>
</div>

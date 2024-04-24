<script lang="ts">
  import { getTimeBetween } from "@/helpers/time";

  type Moment = {
    time: Date;
    note: string;
  };

  let moments: Moment[] = [];
  let momentNote: string = "";
  let start: Date | undefined = new Date();

  function makeMoment() {
    const moment = {
      time: new Date(),
      note: momentNote,
    };
    moments = [...moments, moment];
    momentNote = "";
  }

  export { start };
</script>

<div class="rounded-lg bg-sus-surface-0 shadow-md flex flex-col gap-4">
  <h4 class="p-3 font-semibold border-b border-neutral-200 flex-none">
    Key Moments
  </h4>
  <div class="px-3 h-48 overflow-auto">
    {#if start}
      <ul>
        {#each moments as moment}
          <li class="flex gap-8 items-center p-2">
            <time
              class="flex-none text-xs font-mono font-semibold"
              datetime={getTimeBetween(start, moment.time)}
              >{getTimeBetween(start, moment.time)}</time
            >
            <span class="flex-1">{moment.note}</span>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
  <footer class="p-3">
    <form
      action="/"
      class="flex justify-center gap-4"
      on:submit|preventDefault={makeMoment}
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

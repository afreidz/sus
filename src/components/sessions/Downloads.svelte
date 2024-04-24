<script lang="ts">
  import { downloadSessionVideos } from "@/helpers/media";
  import type { SessionRecording } from "@/stores/session";

  let working = false;
  let downloads: SessionRecording[] | undefined = [];

  async function download(d?: SessionRecording) {
    if (!downloads?.length) throw new Error("No recordings to download");
    working = true;
    await downloadSessionVideos(d ? [d] : downloads);
    working = false;
  }

  export { downloads };
</script>

<ul class:skeleton={working} class="w-full h-full">
  {#if downloads}
    {#each downloads as sessionDownload}
      <li class="border-b border-b-neutral-300 p-3 flex items-center gap-2">
        <span class="flex-1">{sessionDownload.video?.name}</span>
        <button
          on:click={() => download(sessionDownload)}
          class="btn btn-ghost"
        >
          <iconify-icon class="text-2xl" icon="mdi:download"></iconify-icon>
        </button>
      </li>
    {/each}
  {/if}
</ul>

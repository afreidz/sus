<script lang="ts">
  import { orderByDate } from "@/helpers/order";
  import { type Transcription } from "@/stores/session";

  let live = false;
  let enabled = true;
  let className = "";
  let bubbles: HTMLElement[] = [];
  let transcript: Transcription[] = [];
  let orderedTranscriptions: typeof transcript = [];

  $: if (transcript) {
    orderedTranscriptions = orderByDate(transcript);
  }

  $: if (bubbles.at(-1) && live) {
    bubbles.at(-1)?.scrollIntoView({ behavior: "smooth" });
  }

  export { transcript, enabled, className as class, live };
</script>

<div
  class="rounded-lg bg-sus-surface-0 shadow-md flex flex-col overflow-clip {className ??
    ''}"
>
  <h4
    class:tooltip={!enabled}
    data-tip="Transcriptions will be enabled when recording is started"
    class="text-left sticky top-0 z-[1] bg-neutral p-3 font-semibold border-b border-neutral-200 flex-none tooltip-secondary tooltip-bottom tooltip-open"
  >
    Transcription
  </h4>
  <div class="px-3 overflow-auto flex-1 bg-neutral-50">
    {#if orderedTranscriptions}
      {#each orderedTranscriptions as chat, i}
        <div
          class="chat"
          bind:this={bubbles[i]}
          class:chat-start={chat.speaker === "host"}
          class:chat-end={chat.speaker !== "host"}
        >
          <div class="chat-header opacity-30 text-xs">{chat.speaker}</div>
          <div
            class="chat-bubble shadow"
            class:chat-bubble-secondary={chat.speaker === "host"}
          >
            {chat.text}
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

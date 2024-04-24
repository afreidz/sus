<script lang="ts">
  import { orderByDate } from "@/helpers/order";
  import { type SessionRecording } from "@/stores/session";

  let bubbles: HTMLElement[] = [];
  let transcript: SessionRecording["transcript"] = [];
  let orderedTranscriptions: SessionRecording["transcript"];

  $: if (transcript) {
    orderedTranscriptions = orderByDate(transcript);
  }

  $: if (bubbles.at(-1)) {
    bubbles.at(-1)?.scrollIntoView({ behavior: "smooth" });
  }

  export { transcript };
</script>

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
        class="chat-bubble"
        class:chat-bubble-secondary={chat.speaker === "host"}
      >
        {chat.text}
      </div>
    </div>
  {/each}
{/if}

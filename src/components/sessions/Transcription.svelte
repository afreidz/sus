<script lang="ts">
  import { orderByDate } from "@/helpers/order";
  import { type SessionRecording } from "@/stores/session";

  let transcript: SessionRecording["transcript"] = [];
  let orderedTranscriptions: SessionRecording["transcript"];

  $: if (transcript) {
    orderedTranscriptions = orderByDate(transcript);
  }

  export { transcript };
</script>

<div class="size-full overflow-auto">
  {#if orderedTranscriptions}
    {#each orderedTranscriptions as chat}
      <div
        class="chat"
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
</div>

<script lang="ts">
  import { slide } from "svelte/transition";
  import messages, { MessageHandler, DismissMessage } from "@/stores/messages";
</script>

<svelte:window
  on:unhandledrejection={(e) => {
    console.log(e);
    MessageHandler({
      type: "error",
      message: e.reason.message || "Something went wrong",
      detail: e.reason.stack,
    });
  }}
/>

<slot />

<div class="toast toast-center w-full min-w-[320px] max-w-[50%] z-50">
  {#each $messages as message, i}
    <div
      in:slide
      out:slide
      class:alert-error={message.type === "error"}
      class:alert-success={message.type === "success"}
      class:alert-info={!["error", "success"].includes(message.type)}
      class="alert flex p-0"
    >
      <details class="flex-1 collapse group bg-transparent">
        <summary
          class="collapse-title text-xl font-medium min-h-0 w-full !pr-4 !flex items-center gap-1"
        >
          <button
            on:click={() => DismissMessage(i)}
            class="btn btn-sm btn-ghost flex-none"
          >
            <iconify-icon icon="mdi:close" class="text-xl"></iconify-icon>
          </button>
          <span class="flex-1">{message.message}</span>
          {#if message.detail}
            <iconify-icon class="group-open:rotate-180" icon="mdi:chevron-down"
            ></iconify-icon>
          {/if}
        </summary>
        {#if message.detail}
          <div class="collapse-content prose max-w-none w-full">
            <pre class="w-full bg-neutral-950/15"><code>{message.detail}</code
              ></pre>
          </div>
        {/if}
      </details>
    </div>
  {/each}
</div>

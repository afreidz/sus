<script lang="ts">
  import { slide } from "svelte/transition";
  import errors, { ErrorHandler, DismissError } from "@/stores/errors";
</script>

<svelte:window
  on:unhandledrejection={() => ErrorHandler(new Error("Something went wrong!"))}
/>

<slot />

<div class="toast toast-center w-full min-w-[320px] max-w-[50%]">
  {#each $errors as error, i}
    <div in:slide out:slide class="alert alert-error flex p-0">
      <details class="flex-1 collapse group bg-transparent">
        <summary
          class="collapse-title text-xl font-medium min-h-0 w-full !pr-4 !flex items-center gap-1"
        >
          <button
            on:click={() => DismissError(i)}
            class="btn btn-sm btn-ghost flex-none"
          >
            <iconify-icon icon="mdi:close" class="text-xl"></iconify-icon>
          </button>
          <span class="flex-1">Error: {error.message}</span>
          <iconify-icon class="group-open:rotate-180" icon="mdi:chevron-down"
          ></iconify-icon>
        </summary>
        <div class="collapse-content">
          <pre class="w-full">
            <code>
              {error.stack}
            </code>
          </pre>
        </div>
      </details>
    </div>
  {/each}
</div>

<script lang="ts">
  export let open: boolean = false;
  export let elm: HTMLDialogElement;
  export let title: string = "Are you sure?";
  export let confirmText: string | undefined = undefined;

  let confirmTextValue: string;

  $: if (open && elm) {
    elm.showModal();
  }
</script>

<dialog class="modal" bind:this={elm} on:close>
  <form
    method="dialog"
    class="modal-box bg-neutral"
    on:submit|preventDefault={() =>
      elm.close(
        confirmText
          ? confirmTextValue === confirmText
            ? confirmText
            : ""
          : confirmTextValue === "confirm"
            ? "confirm"
            : ""
      )}
  >
    <h3 class="font-bold text-lg">{title}</h3>
    <div class="prose">
      <p>
        <slot />
      </p>
      {#if confirmText}
        <p>
          <label>
            <input
              required
              type="text"
              id="confirm_delete_client"
              bind:value={confirmTextValue}
              class="input input-error w-full max-w-xs"
              placeholder={`Type "${confirmText}" to confirm`}
            />
          </label>
        </p>
      {/if}
    </div>
    <div class="modal-action">
      <button value="confirm" class="btn btn-ghost">Ok</button>
      <button
        value="cancel"
        formmethod="dialog"
        on:click|preventDefault={() => elm.close()}
        class="btn btn-secondary text-neutral">Close</button
      >
    </div>
  </form>
</dialog>

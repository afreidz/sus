<script context="module" lang="ts">
  const defaultConfirmValue = "confirm";

  export { defaultConfirmValue };
</script>

<script lang="ts">
  let error = true;
  let open: boolean = false;
  let className: string = "";
  let elm: HTMLDialogElement;
  let title: string = "Are you sure?";
  let placeholder: string | undefined = undefined;
  let confirmText: string | undefined = undefined;

  let confirmTextValue: string;

  $: if (open && elm) {
    elm.showModal();
  }

  export {
    open,
    elm,
    title,
    error,
    confirmText,
    placeholder,
    className as class,
  };
</script>

<dialog class="modal text-neutral-950" bind:this={elm} on:close>
  <form
    method="dialog"
    class="modal-box bg-neutral {className ?? ''}"
    on:submit|preventDefault={() =>
      elm.close(
        confirmText && confirmTextValue === confirmText
          ? confirmText
          : confirmText && confirmTextValue !== confirmText
            ? ""
            : defaultConfirmValue
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
              class:input-error={error}
              id="confirm_delete_client"
              bind:value={confirmTextValue}
              class="input input-error w-full max-w-xs"
              placeholder={placeholder !== undefined
                ? placeholder
                : `Type "${confirmText}" to confirm`}
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

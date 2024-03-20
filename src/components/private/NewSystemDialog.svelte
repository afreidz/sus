<script lang="ts">
  import type { APIResponses } from "@/helpers/api";

  type SingleClient = APIResponses["clientId"]["GET"];

  export let client: SingleClient;
  export let open: boolean = false;
  export let elm: HTMLDialogElement;

  let newSystemTitle: string = "";

  $: if (open && elm) {
    elm.showModal();
  }

  $: if (!open) {
    newSystemTitle = "";
  }
</script>

<dialog class="modal" bind:this={elm} on:close>
  <form
    method="dialog"
    class="modal-box bg-neutral"
    on:submit|preventDefault={(e) => {
      elm.close(
        e &&
          JSON.stringify({
            clientId: client.id,
            title: newSystemTitle,
          })
      );
    }}
  >
    <h3 class="font-bold text-lg">Create System for {client?.name}</h3>
    <div class="prose">
      <p>
        <label class="form-control">
          <div class="label">
            <span class="label-text">Title for System</span>
          </div>
          <input
            required
            type="text"
            class="input w-full max-w-xs"
            bind:value={newSystemTitle}
          />
        </label>
      </p>
    </div>
    <div class="modal-action">
      <button value="confirm" class="btn btn-secondary text-neutral"
        >Create</button
      >
      <button
        value="cancel"
        formmethod="dialog"
        on:click|preventDefault={() => {
          elm.close();
        }}
        class="btn btn-link">Cancel</button
      >
    </div>
  </form>
</dialog>

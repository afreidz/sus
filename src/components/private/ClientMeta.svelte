<script lang="ts">
  import api, { type APIResponses } from "@/helpers/api";
  import ConfirmDialog from "@/components/common/ConfirmDialog.svelte";
  import NewSystemDialog from "@/components/private/NewSystemDialog.svelte";

  type SingleClient = APIResponses["clientId"]["GET"];

  export let loading = false;
  export let client: SingleClient | undefined = undefined;

  let confirmDeleteClient = false;
  let showNewSystemDialog = false;
  let confirmElement: HTMLDialogElement;
  let newSystemDialog: HTMLDialogElement;
  let newSystemNameElement: HTMLInputElement;

  $: if (newSystemNameElement) newSystemNameElement.focus();

  async function deleteClient() {
    loading = true;
    confirmDeleteClient = false;
    if (client && confirmElement.returnValue === client.name) {
      await api({
        method: "DELETE",
        endpoint: "clientId",
        substitutions: { clientId: client.id },
      });
      window.location.href = "/clients";
    }
    loading = false;
  }

  async function createNewSystem() {
    loading = true;
    if (newSystemDialog.returnValue) {
      await api({
        method: "POST",
        endpoint: "systems",
        body: newSystemDialog.returnValue,
      });
      window.location.reload();
    }
    showNewSystemDialog = false;
    loading = false;
  }
</script>

<div
  class:card={!loading}
  class:skeleton={loading}
  class="w-80 bg-neutral shadow-sm"
>
  {#if client}
    <div class="card-body">
      <header class="prose">
        <h2
          class="border-b mb-2 pb-2 border-sus-surface-30 text-sus-primary-60"
        >
          {client.name}
        </h2>
      </header>
      <div class="flex flex-col gap-1">
        <p class="flex justify-between m-0">
          <strong class="flex-1">Created By:</strong>
          <span class="text-sm text-sus-surface-0-fg/50"
            >{client.createdBy.split("@")[0]}</span
          >
        </p>
        <p class="flex justify-between m-0">
          <strong class="flex-1">Created On:</strong>
          <span class="text-sm text-sus-surface-0-fg/50"
            >{new Date(client.createdAt).toLocaleDateString("en-US")}</span
          >
        </p>
        <p class="flex justify-between m-0 pb-4 !mb-4">
          <strong class="flex-1">Systems:</strong>
          <span class="text-sm text-sus-surface-0-fg/50"
            >{client.systems.length}</span
          >
        </p>
      </div>
      <button
        on:click={() => (showNewSystemDialog = true)}
        class="btn btn-secondary text-neutral">New System</button
      >
      <div class="divider">
        <span>Danger Zone</span>
      </div>
      <button
        on:click={() => (confirmDeleteClient = true)}
        class="btn btn-error btn-outline hover:!text-neutral"
        >Delete Client</button
      >
    </div>
    <ConfirmDialog
      on:close={deleteClient}
      confirmText={client.name}
      bind:elm={confirmElement}
      open={confirmDeleteClient}
    >
      Deleting the client will also delete the related
      systems/revisions/responses.
    </ConfirmDialog>
    <NewSystemDialog
      {client}
      bind:elm={newSystemDialog}
      open={showNewSystemDialog}
      on:close={createNewSystem}
    />
  {/if}
</div>

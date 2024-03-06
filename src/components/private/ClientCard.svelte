<script lang="ts">
  import me from "@/stores/me";
  import api from "@/helpers/api";
  import clients from "@/stores/clients";
  import type { Prisma, APIResponses } from "@/api/types";
  import ConfirmDialog from "@/components/common/ConfirmDialog.svelte";
  import NewSystemDialog from "@/components/private/NewSystemDialog.svelte";

  type SingleClient = APIResponses["clientId"]["GET"];

  export let loading = false;
  export let clientId: string | undefined = undefined;
  export let client: SingleClient | undefined = undefined;

  let confirmDeleteClient = false;
  let showNewSystemDialog = false;
  let confirmElement: HTMLDialogElement;
  let newSystemDialog: HTMLDialogElement;
  let newClientNameElement: HTMLInputElement;

  $: if (!client && clientId && $clients) {
    client = $clients.find((c) => c.id === clientId);
  }

  $: if (newClientNameElement) newClientNameElement.focus();

  async function createNewClient() {
    const newClient: Omit<Prisma.ClientCreateInput, "createdBy"> = {
      name: newClientNameElement.value,
    };

    await api({
      endpoint: "clientAll",
      method: "POST",
      body: JSON.stringify(newClient),
    });

    newClientNameElement.value = "";
    window.location.reload();
  }

  async function deleteClient() {
    confirmDeleteClient = false;
    if (client && confirmElement.returnValue === client.name) {
      await api({
        endpoint: "clientId",
        substitutions: { CLIENT_ID: client.id },
        method: "DELETE",
      });
      window.location.reload();
    }
  }

  async function createNewSystem() {
    if (newSystemDialog.returnValue) {
      await api({
        method: "POST",
        endpoint: "systemAll",
        body: newSystemDialog.returnValue,
      });
      if (client) window.location.href = `/clients/${client.id}`;
    }
    showNewSystemDialog = false;
  }
</script>

<div
  class:card={!loading}
  class:skeleton={loading}
  class="card w-72 aspect-square bg-neutral shadow-sm"
>
  {#if loading}
    <span class="sr-only">Loading clients...</span>
  {:else if !client}
    <form
      method="post"
      action="/api/clients"
      on:submit|preventDefault={createNewClient}
      class="contents"
    >
      <div class="card-body justify-center">
        <div class="flex-1">
          <h3 class="font-semibold m-0 text-lg">
            Hello {$me?.user?.name}!
          </h3>
          <label for="new_client_name" class="text-sus-surface-30 text-sm">
            Wecome to SUS. Would you like to create a new client?
          </label>
        </div>
        <input
          required
          type="text"
          id="new_client_name"
          placeholder="New client name"
          class="input w-full max-w-xs"
          bind:this={newClientNameElement}
        />

        <button class="btn btn-secondary text-neutral"> Create </button>
      </div>
    </form>
  {:else}
    <a
      class="card-body justify-center text-center"
      href={`/clients/${client.id}`}
    >
      <span class="link link-primary">{client.name}</span>
      {#if client.System?.length}
        <span class="text-sm">{client.System.length} System(s)</span>
      {/if}
    </a>
    <div class="card-actions justify-end">
      <div class="dropdown dropdown-end rounded-box">
        <div
          role="button"
          tabindex="0"
          class="btn btn-square btn-ghost btn-sm m-1"
        >
          <iconify-icon icon="iconamoon:menu-kebab-vertical-fill"
          ></iconify-icon>
        </div>
        <ul
          class="dropdown-content menu w-56 bg-neutral rounded-box absolute z-10 shadow text-left"
        >
          <li>
            <button on:click={() => (showNewSystemDialog = true)}>
              New System
            </button>
          </li>
          <li class="text-error">
            <button on:click={() => (confirmDeleteClient = true)}>
              Delete!
            </button>
          </li>
        </ul>
      </div>
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

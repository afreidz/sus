<script lang="ts">
  import api from "@/helpers/api";
  import type { APIResponses } from "@/api/types";
  import clients, { refreshClients } from "@/stores/clients";
  import ConfirmDialog from "@/components/common/ConfirmDialog.svelte";
  import NewSystemDialog from "@/components/private/NewSystemDialog.svelte";
  import NewRevisionDialog from "@/components/private/NewRevisionDialog.svelte";

  type SingleClient = APIResponses["clientId"]["GET"];
  type SingleSystem = APIResponses["systemId"]["GET"];
  type SingleRevision = SingleSystem["Revision"][number];

  export let clientId: string | undefined;

  let showNewSystemDialog = false;
  let client: SingleClient | undefined;
  let systems: Promise<SingleSystem>[];
  let newSystemDialog: HTMLDialogElement;
  let newRevisionDialog: HTMLDialogElement;
  let deleteRevisionDialog: HTMLDialogElement;
  let showNewRevisionDialogSystem: SingleSystem | null = null;
  let revisionToDelete: SingleRevision | undefined = undefined;

  $: if (clientId && $clients) {
    client = $clients.find((c) => c.id === clientId);
    if (!client)
      refreshClients().then(() => {
        client = $clients?.find((c) => c.id === clientId);
      });
  }

  $: if (client?.System.length) {
    systems = client.System.map(async (system) => {
      return await api({
        method: "GET",
        endpoint: "systemId",
        substitutions: { SYSTEM_ID: system.id },
      });
    });
  }

  async function createNewRevision() {
    showNewRevisionDialogSystem = null;
    if (!newRevisionDialog.returnValue) return;

    await api({
      method: "POST",
      endpoint: "revisionAll",
      body: newRevisionDialog.returnValue,
    });
    newRevisionDialog.returnValue = "";
    await refreshClients();
  }

  function showNewRevisionDialog(s: unknown) {
    showNewRevisionDialogSystem = s as SingleSystem;
  }

  async function deleteRevision() {
    if (deleteRevisionDialog.returnValue !== revisionToDelete?.title) {
      revisionToDelete = undefined;
      return;
    }

    await api({
      endpoint: "revisionId",
      method: "DELETE",
      substitutions: { REVISION_ID: revisionToDelete.id },
    });

    revisionToDelete = undefined;
    await refreshClients();
  }

  async function createNewSystem() {
    if (newSystemDialog.returnValue) {
      await api({
        method: "POST",
        endpoint: "systemAll",
        body: newSystemDialog.returnValue,
      });
      await refreshClients();
    }
    showNewSystemDialog = false;
  }
</script>

{#if client}
  <div
    class:items-center={!client.System.length}
    class="flex-1 flex flex-col gap-4"
  >
    {#if client.System?.length === 0}
      <strong class="w-full py-10 text-center uppercase opacity-50"
        >No client systems</strong
      >
      <button
        on:click={() => (showNewSystemDialog = true)}
        class="btn btn-outline">New System</button
      >
    {:else}
      {#each client.System as system, x}
        <div class="collapse bg-neutral">
          <input
            type="radio"
            checked={x === 0}
            name={`client_systems_${client.id}`}
          />

          <div class="collapse-title flex justify-between">
            <strong class="text-xl font-medium">{system.title}</strong>
            <a
              href={`/systems/${system.id}`}
              class="flex items-center gap-2 group opacity-30 hover:opacity-80 transition-opacity duration-300 z-10 relative"
            >
              <span
                class="font-medium group-hover:opacity-100 opacity-0 transition-opacity duration-300"
                >View Details</span
              >
              <iconify-icon
                width="30"
                height="30"
                icon="ic:outline-arrow-circle-right"
              ></iconify-icon>
            </a>
          </div>
          <div
            class="collapse-content bg-sus-surface-90 text-sus-surface-90-fg flex flex-col"
          >
            {#await systems[x]}
              <span class="loading loading-dots loading-md">loading system</span
              >
            {:then system}
              {#if !system.Revision.length}
                <strong
                  class="w-full py-10 text-center uppercase text-neutral/50"
                  >No revisions for system yet</strong
                >
              {:else}
                <ul class="timeline timeline-vertical p-4">
                  {#each system.Revision as revision, i}
                    <li>
                      {#if i !== 0}<hr />{/if}
                      <div
                        class:!flex-row={i % 2}
                        class:timeline-start={i % 2}
                        class:timeline-end={!(i % 2)}
                        class="group flex flex-row-reverse items-center gap-2"
                      >
                        <div
                          class:dropdown-end={!(i % 2)}
                          class="dropdown rounded-box"
                        >
                          <div
                            tabindex="0"
                            role="button"
                            class="btn btn-square btn-ghost btn-sm m-1"
                          >
                            <iconify-icon
                              width="30"
                              height="30"
                              icon="iconamoon:menu-kebab-vertical-circle-light"
                              class="opacity-0 group-hover:opacity-50 transition-opacity duration-300"
                            ></iconify-icon>
                          </div>
                          <ul
                            class="dropdown-content menu w-56 bg-neutral rounded-box absolute z-10 text-left text-sus-surface-0-fg"
                          >
                            <li>
                              <button> Edit Revision </button>
                            </li>
                            <li class="text-error">
                              <button
                                on:click={() => {
                                  revisionToDelete = revision;
                                }}
                              >
                                Delete!
                              </button>
                            </li>
                          </ul>
                        </div>
                        <a
                          href={`/systems/${system.id}#rev_${revision.id}`}
                          class="timeline-box bg-sus-surface-70 border-none text-sus-surface-70-fg"
                          >{revision.title}</a
                        >
                      </div>
                      <div class="timeline-middle">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          class="w-5 h-5"
                          ><path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                            clip-rule="evenodd"
                          /></svg
                        >
                      </div>
                      {#if i !== system.Revision.length - 1}
                        <hr />
                      {/if}
                    </li>
                  {/each}
                </ul>
              {/if}
              <div class="text-center mb-4">
                <button
                  class="btn btn-sm btn-outline border-neutral text-neutral z-10"
                  on:click|preventDefault={() => showNewRevisionDialog(system)}
                  >New Revision</button
                >
              </div>
            {/await}
          </div>
        </div>
      {/each}
    {/if}
  </div>
  <NewSystemDialog
    {client}
    bind:elm={newSystemDialog}
    open={showNewSystemDialog}
    on:close={createNewSystem}
  />
{/if}
<NewRevisionDialog
  bind:elm={newRevisionDialog}
  on:close={createNewRevision}
  open={!!showNewRevisionDialogSystem}
  system={showNewRevisionDialogSystem}
/>
{#if revisionToDelete}
  <ConfirmDialog
    open
    on:close={deleteRevision}
    bind:elm={deleteRevisionDialog}
    bind:confirmText={revisionToDelete["title"]}
  >
    Deleting the revision will also delete any respondents and responses.
  </ConfirmDialog>
{/if}

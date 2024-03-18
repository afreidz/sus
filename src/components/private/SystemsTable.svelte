<script lang="ts">
  import api from "@/helpers/api";
  import { onMount } from "svelte";
  import type { APIResponses } from "@/helpers/api";
  import ConfirmDialog from "@/components/common/ConfirmDialog.svelte";
  import NewSystemDialog from "@/components/private/NewSystemDialog.svelte";
  import NewRevisionDialog from "@/components/private/NewRevisionDialog.svelte";

  type SingleClient = APIResponses["clientId"]["GET"];
  type SingleSystem = APIResponses["systemId"]["GET"];
  type SingleRevision = SingleSystem["revisions"][number];

  export let client: SingleClient;

  let active: SingleSystem["id"];
  let showNewSystemDialog = false;
  let sections: HTMLInputElement[] = [];
  let newSystemDialog: HTMLDialogElement;
  let newRevisionDialog: HTMLDialogElement;
  let deleteSystemDialog: HTMLDialogElement;
  let systems: Promise<SingleSystem>[] = [];
  let deleteRevisionDialog: HTMLDialogElement;
  let showNewRevisionDialogSystem: SingleSystem | null = null;
  let revisionToDelete: SingleRevision | undefined = undefined;
  let systemToDelete: SingleClient["systems"][number] | undefined = undefined;

  onMount(() => {
    if (client.systems.length) {
      systems = client.systems.map(async (system) => {
        return await api({
          method: "GET",
          endpoint: "systemId",
          substitutions: { systemId: system.id },
        });
      });
    }
  });

  onMount(() => {
    if (window.location.hash) {
      active = window.location.hash.replace("#", "");
    } else if (client.systems.length) {
      active = client.systems[0].id;
    }
  });

  async function refreshClient() {
    client = await api({
      method: "GET",
      endpoint: "clientId",
      substitutions: { clientId: client.id },
    });
    if (client.systems.length) {
      systems = client.systems.map(async (system) => {
        return await api({
          method: "GET",
          endpoint: "systemId",
          substitutions: { systemId: system.id },
        });
      });
    }
  }

  $: if (active) history.replaceState(null, "", `#${active}`);

  async function createNewRevision() {
    showNewRevisionDialogSystem = null;
    if (!newRevisionDialog.returnValue) return;

    await api({
      method: "POST",
      endpoint: "revisions",
      body: newRevisionDialog.returnValue,
    });
    newRevisionDialog.returnValue = "";
    await refreshClient();
  }

  function showNewRevisionDialog(s: unknown) {
    showNewRevisionDialogSystem = s as SingleSystem;
  }

  async function deleteSystem() {
    if (deleteSystemDialog.returnValue !== systemToDelete?.title) {
      systemToDelete = undefined;
      return;
    }

    await api({
      endpoint: "systemId",
      method: "DELETE",
      substitutions: { systemId: systemToDelete.id },
    });

    systemToDelete = undefined;
    await refreshClient();
  }

  async function deleteRevision() {
    if (deleteRevisionDialog.returnValue !== revisionToDelete?.title) {
      revisionToDelete = undefined;
      return;
    }

    await api({
      method: "DELETE",
      endpoint: "revisionId",
      substitutions: { revisionId: revisionToDelete.id },
    });

    revisionToDelete = undefined;
    await refreshClient();
  }

  async function createNewSystem() {
    if (newSystemDialog.returnValue) {
      await api({
        method: "POST",
        endpoint: "systems",
        body: newSystemDialog.returnValue,
      });
      await refreshClient();
    }
    showNewSystemDialog = false;
  }
</script>

{#if client}
  <div
    class:items-center={!client.systems.length}
    class="flex-1 flex flex-col gap-4"
  >
    {#if client.systems?.length === 0}
      <strong class="w-full py-10 text-center uppercase opacity-50"
        >No client systems</strong
      >
      <button
        on:click={() => (showNewSystemDialog = true)}
        class="btn btn-outline">New System</button
      >
    {:else}
      {#each client.systems as system, x}
        <div class="collapse bg-neutral">
          <input
            type="radio"
            on:change={(e) => {
              if (e.currentTarget.checked) active = system.id;
            }}
            bind:this={sections[x]}
            checked={active?.includes(system.id)}
            name={`client_systems_${system.id}`}
          />

          <div class="collapse-title flex items-center justify-between pr-4">
            <strong class="text-xl font-medium">{system.title}</strong>
            <div class="dropdown dropdown-end rounded-box">
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <div
                tabindex="0"
                role="button"
                on:focus={() => sections[x]?.click()}
                on:click={() => sections[x]?.click()}
                class="btn btn-square btn-ghost btn-sm m-1 relative z-10 text-xl"
              >
                <iconify-icon icon="iconamoon:menu-kebab-vertical-fill"
                ></iconify-icon>
              </div>
              <ul
                class="dropdown-content menu w-56 bg-neutral rounded-box absolute z-10 shadow text-left"
              >
                <li>
                  <a href={`/systems/${system.id}`}> View Details </a>
                </li>
                <li class="text-error">
                  <button on:click={() => (systemToDelete = system)}>
                    Delete!
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div
            class="collapse-content bg-sus-surface-90 text-sus-surface-90-fg flex flex-col"
          >
            {#await systems[x]}
              <span class="loading loading-dots loading-md">loading system</span
              >
            {:then system}
              {#if !system?.revisions.length}
                <strong
                  class="w-full py-10 text-center uppercase text-neutral/50"
                  >No revisions for system yet</strong
                >
              {:else}
                <ul class="timeline timeline-vertical p-4">
                  {#each system.revisions as revision, i}
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
                          href={`/systems/${system.id}#${revision.id}`}
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
                      {#if i !== system.revisions.length - 1}
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
  <NewRevisionDialog
    bind:elm={newRevisionDialog}
    on:close={createNewRevision}
    open={!!showNewRevisionDialogSystem}
    system={showNewRevisionDialogSystem}
  />
  {#if systemToDelete}
    <ConfirmDialog
      open
      on:close={deleteSystem}
      bind:elm={deleteSystemDialog}
      bind:confirmText={systemToDelete.title}
    ></ConfirmDialog>
  {/if}
  {#if revisionToDelete}
    <ConfirmDialog
      open
      on:close={deleteRevision}
      bind:elm={deleteRevisionDialog}
      bind:confirmText={revisionToDelete.title}
    >
      Deleting the revision will also delete any respondents and responses.
    </ConfirmDialog>
  {/if}
{/if}

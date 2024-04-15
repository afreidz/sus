<script lang="ts">
  import api from "@/helpers/api";
  import { onMount } from "svelte";
  import type { APIResponses } from "@/helpers/api";
  import { MessageHandler } from "@/stores/messages";
  import ConfirmDialog from "@/components/common/ConfirmDialog.svelte";
  import NewSystemDialog from "@/components/private/NewSystemDialog.svelte";
  import SystemRevisionNav from "@/components/private/SystemRevisionNav.svelte";
  import NewRevisionDialog from "@/components/private/NewRevisionDialog.svelte";

  type SingleClient = APIResponses["clientId"]["GET"];
  type SingleSystem = SingleClient["systems"][number];

  export let client: SingleClient;

  let loading: boolean = false;
  let showNewSystemDialog = false;
  let showNewRevisionDialog = false;
  let sections: HTMLInputElement[] = [];
  let newSystemDialog: HTMLDialogElement;
  let newRevisionDialog: HTMLDialogElement;
  let deleteSystemDialog: HTMLDialogElement;
  let active: SingleSystem["id"] | undefined;
  let systemToDelete: SingleClient["systems"][number] | undefined = undefined;

  onMount(() => {
    if (window.location.hash) {
      active = window.location.hash.replace("#", "");
    } else {
      console.log(client.systems);
      active = client.systems[0].id;
    }
  });

  $: if (active) history.replaceState(null, "", `#${active}`);

  async function refreshClient() {
    loading = true;
    client = await api({
      method: "GET",
      endpoint: "clientId",
      substitutions: { clientId: client.id },
    });
    loading = false;
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
    MessageHandler({ type: "success", message: "The system has been deleted" });
    active = client.systems[0]?.id;
    if (!active) history.replaceState(null, "", "");
  }

  async function createNewSystem() {
    if (newSystemDialog.returnValue) {
      const newSystem = await api({
        method: "POST",
        endpoint: "systems",
        body: newSystemDialog.returnValue,
      });
      await refreshClient();
      showNewSystemDialog = false;
      MessageHandler({ type: "success", message: "The system has been added" });
      active = newSystem.id;
      console.log(active);
    } else {
      MessageHandler({ type: "error", message: "Unable to add the system" });
    }
  }

  async function createNewRevision() {
    showNewRevisionDialog = false;
    if (!newRevisionDialog.returnValue) return;

    await api({
      method: "POST",
      endpoint: "revisions",
      body: newRevisionDialog.returnValue,
    });

    newRevisionDialog.returnValue = "";
    await refreshClient();
    MessageHandler({ type: "success", message: "The revision has been added" });
  }

  function navToRevision(e: MouseEvent) {
    window.location.href = (e.target as HTMLAnchorElement).href;
  }
</script>

{#if client}
  <div
    class:items-center={!client.systems.length}
    class="flex-1 flex flex-col gap-4"
  >
    {#if loading}
      <span class="loading loading-spinner loading-lg"></span>
    {:else if client.systems?.length === 0}
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
          </div>
          <div
            class="collapse-content bg-sus-surface-90 text-sus-surface-90-fg"
          >
            <div class="pt-6 flex flex-col">
              {#if !system?.revisions.length}
                <strong
                  class="w-full py-10 text-center uppercase text-neutral/50"
                  >No revisions for system yet</strong
                >
              {/if}
              <SystemRevisionNav
                vertical
                stacked={false}
                bind:system
                highlightActive={false}
                on:click={navToRevision}
                on:update={refreshClient}
              />
              <div
                class="flex justify-end p-2 -m-4 mt-4 bg-neutral text-base-content"
              >
                <div class="dropdown dropdown-top dropdown-end rounded-box">
                  <div
                    tabindex="0"
                    role="button"
                    class="btn btn-square btn-ghost btn-sm m-1 relative z-10 text-xl"
                  >
                    <iconify-icon icon="pepicons-pencil:dots-y"></iconify-icon>
                  </div>
                  <ul
                    class="dropdown-content menu w-56 bg-neutral rounded-box absolute z-10 shadow text-left"
                  >
                    <li>
                      <a href={`/systems/${system?.id}`}> View Details </a>
                    </li>
                    <li>
                      <button on:click={() => (showNewRevisionDialog = true)}>
                        New Revision
                      </button>
                    </li>
                    <li class="text-error">
                      <button on:click={() => (systemToDelete = system)}>
                        Delete!
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
              <NewRevisionDialog
                {system}
                bind:elm={newRevisionDialog}
                on:close={createNewRevision}
                open={showNewRevisionDialog}
              />
            </div>
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
  {#if systemToDelete}
    <ConfirmDialog
      open
      on:close={deleteSystem}
      bind:elm={deleteSystemDialog}
      bind:confirmText={systemToDelete.title}
    ></ConfirmDialog>
  {/if}
{/if}

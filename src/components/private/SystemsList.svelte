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
  type SingleSystem = APIResponses["systemId"]["GET"];

  export let client: SingleClient;

  let active: SingleSystem["id"];
  let showNewSystemDialog = false;
  let showNewRevisionDialog = false;
  let sections: HTMLInputElement[] = [];
  let newSystemDialog: HTMLDialogElement;
  let newRevisionDialog: HTMLDialogElement;
  let deleteSystemDialog: HTMLDialogElement;
  let systems: Promise<SingleSystem>[] = [];
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
    MessageHandler({ type: "success", message: "The system has been added" });
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
          </div>
          <div
            class="collapse-content bg-sus-surface-90 text-sus-surface-90-fg"
          >
            <div class="pt-6 flex flex-col">
              {#await systems[x]}
                <span class="loading loading-dots loading-md"
                  >loading system</span
                >
              {:then system}
                {#if !system?.revisions.length}
                  <strong
                    class="w-full py-10 text-center uppercase text-neutral/50"
                    >No revisions for system yet</strong
                  >
                {/if}
                <SystemRevisionNav
                  {system}
                  vertical
                  stacked={false}
                  highlightActive={false}
                  on:click={navToRevision}
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
                      <iconify-icon icon="pepicons-pencil:dots-y"
                      ></iconify-icon>
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
              {/await}
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

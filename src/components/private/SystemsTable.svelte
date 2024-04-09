<script lang="ts">
  import api from "@/helpers/api";
  import { onMount } from "svelte";
  import type { APIResponses } from "@/helpers/api";
  import ConfirmDialog from "@/components/common/ConfirmDialog.svelte";
  import NewSystemDialog from "@/components/private/NewSystemDialog.svelte";
  import SystemRevisionNav from "@/components/private/SystemRevisionNav.svelte";
  import { MessageHandler } from "@/stores/messages";

  type SingleClient = APIResponses["clientId"]["GET"];
  type SingleSystem = APIResponses["systemId"]["GET"];

  export let client: SingleClient;

  let active: SingleSystem["id"];
  let showNewSystemDialog = false;
  let sections: HTMLInputElement[] = [];
  let newSystemDialog: HTMLDialogElement;
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
            <div class="dropdown dropdown-end rounded-box">
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <div
                tabindex="0"
                role="button"
                on:focus={() => sections[x]?.click()}
                on:click={() => sections[x]?.click()}
                class="btn btn-square btn-ghost btn-sm m-1 relative z-10 text-xl"
              >
                <iconify-icon icon="pepicons-pencil:dots-y"></iconify-icon>
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

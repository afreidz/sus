<script lang="ts">
  import api from "@/helpers/api";
  import { onMount } from "svelte";
  import type { APIResponses } from "@/helpers/api";
  import ConfirmDialog from "@/components/common/ConfirmDialog.svelte";
  import { activeRevisionsBySystem as actives } from "@/stores/actives";
  import NewRevisionDialog from "@/components/private/NewRevisionDialog.svelte";

  let stacked = true;
  let showMeta = false;
  let vertical = false;
  let classList: string = "";
  let highlightActive = true;
  let showNewRevisionDialog = false;
  let linkType: "anchor" | "url" = "url";
  let newRevisionDialog: HTMLDialogElement;
  let system: APIResponses["systemId"]["GET"];
  let deleteRevisionDialog: HTMLDialogElement;
  let revisionToDelete: (typeof system)["revisions"][number] | undefined =
    undefined;

  $: if (system && $actives[system.id])
    history.replaceState(null, "", `#${$actives[system.id]}`);

  onMount(() => {
    if (system?.revisions.length && !window.location.hash) {
      actives.setKey(system.id, system.revisions[0].id);
    } else if (system && window.location.hash) {
      actives.setKey(system.id, window.location.hash.replace("#", ""));
    }
  });

  async function createNewRevision() {
    showNewRevisionDialog = false;
    if (!newRevisionDialog.returnValue) return;

    await api({
      method: "POST",
      endpoint: "revisions",
      body: newRevisionDialog.returnValue,
    });
    newRevisionDialog.returnValue = "";
    window.location.reload();
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
    window.location.reload();
  }

  export {
    system,
    stacked,
    vertical,
    linkType,
    showMeta,
    highlightActive,
    classList as class,
  };
</script>

<div role="tablist" class="flex flex-col {classList ?? ''}">
  <ul class="timeline" class:timeline-vertical={vertical}>
    {#if system?.revisions.length}
      {#each system.revisions as revision, i}
        <li class="group">
          {#if i !== 0}<hr />{/if}
          <a
            class:!timeline-end={!stacked && i % 2}
            class:opacity-30={highlightActive &&
              $actives[system.id] !== revision.id}
            class="timeline-start timeline-box border-current text-current bg-transparent"
            href={linkType === "anchor"
              ? `#${revision.id}`
              : `/systems/${revision.systemId}#${revision.id}`}
            on:click
            on:click|preventDefault={() =>
              actives.setKey(system.id, revision.id)}>{revision.title}</a
          >
          <iconify-icon class="timeline-middle" icon="material-symbols:circle"
          ></iconify-icon>
          <div
            class:dropdown-end={!stacked && i % 2}
            class:!timeline-start={!stacked && i % 2}
            class="timeline-end dropdown rounded-box"
          >
            <div
              tabindex="0"
              role="button"
              class="btn btn-square btn-ghost btn-sm m-1"
            >
              <iconify-icon
                width="30"
                height="30"
                icon="pepicons-pencil:dots-y"
                class="opacity-0 group-hover:opacity-50 transition-opacity duration-300"
              ></iconify-icon>
            </div>
            <ul
              class="dropdown-content menu w-56 bg-neutral rounded-box shadow-sm absolute z-10 text-left text-sus-surface-0-fg"
            >
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
          {#if i !== system.revisions.length - 1}
            <hr />
          {/if}
        </li>
      {/each}
    {/if}
  </ul>
  {#if !showMeta}
    <div class="flex justify-center m-4 py-4 border-t border-dotted">
      <button
        on:click={() => (showNewRevisionDialog = true)}
        class="btn btn-sm btn-outline border-current text-current"
        >New Revision</button
      >
    </div>
  {/if}
  {#if showMeta && $actives[system.id]}
    {@const revision = system.revisions.find(
      (r) => r.id === $actives[system.id]
    )}
    {#if revision}
      <div class="card bg-neutral shadow-sm sticky top-4 mr-4 mt-8">
        <div class="card-body">
          <header class="prose">
            <h2
              class="border-b mb-2 pb-2 border-sus-surface-30 text-sus-primary-60"
            >
              {system.client.name}
            </h2>
          </header>
          <div class="flex flex-col gap-1">
            <p class="flex justify-between m-0">
              <strong class="flex-1">Revision:</strong>
              <span class="text-sm text-sus-surface-0-fg/50"
                >{revision.title}</span
              >
            </p>
            <p class="flex justify-between m-0">
              <strong class="flex-1">Created By:</strong>
              <span class="text-sm text-sus-surface-0-fg/50"
                >{system.client.createdBy.split("@")[0]}</span
              >
            </p>
            <p class="flex justify-between m-0">
              <strong class="flex-1">Created On:</strong>
              <span class="text-sm text-sus-surface-0-fg/50"
                >{new Date(revision.createdAt).toLocaleDateString(
                  "en-US"
                )}</span
              >
            </p>
            <p class="flex justify-between m-0">
              <strong class="flex-1">Respondents:</strong>
              <span class="text-sm text-sus-surface-0-fg/50"
                >{revision.respondents.length}</span
              >
            </p>
            <p class="flex justify-between m-0 pb-4">
              <strong class="flex-1">Responses:</strong>
              <span class="text-sm text-sus-surface-0-fg/50"
                >{revision.respondents.filter((r) => r.complete).length}</span
              >
            </p>
          </div>
          <button
            on:click={() => (showNewRevisionDialog = true)}
            class="btn btn-secondary text-neutral">New Revision</button
          >
          <div class="divider">
            <span>Danger Zone</span>
          </div>
          <button
            on:click={() => (revisionToDelete = revision)}
            class="btn btn-error btn-outline hover:!text-neutral"
            >Delete Revision</button
          >
        </div>
      </div>
    {/if}
  {/if}
</div>
<NewRevisionDialog
  {system}
  bind:elm={newRevisionDialog}
  on:close={createNewRevision}
  open={showNewRevisionDialog}
/>
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

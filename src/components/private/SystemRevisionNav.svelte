<script lang="ts">
  import api from "@/helpers/api";
  import { createEventDispatcher } from "svelte";
  import type { APIResponses } from "@/helpers/api";
  import ConfirmDialog from "@/components/common/ConfirmDialog.svelte";
  import { activeRevisionsBySystem as actives } from "@/stores/actives";
  import NewRevisionDialog from "@/components/private/NewRevisionDialog.svelte";

  let stacked = true;
  let vertical = false;
  let classList: string = "";
  let highlightActive = true;
  let showNewRevisionDialog = false;
  let linkType: "anchor" | "url" = "url";
  let newRevisionDialog: HTMLDialogElement;
  let deleteRevisionDialog: HTMLDialogElement;
  let revisionToDelete: (typeof system)["revisions"][number] | undefined =
    undefined;

  let system:
    | APIResponses["systemId"]["GET"]
    | APIResponses["clientId"]["GET"]["systems"][number];

  const dispatch = createEventDispatcher();

  async function createNewRevision() {
    showNewRevisionDialog = false;
    if (!newRevisionDialog.returnValue) return;

    await api({
      method: "POST",
      endpoint: "revisions",
      body: newRevisionDialog.returnValue,
    });
    newRevisionDialog.returnValue = "";
    dispatch("update");
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
    dispatch("update");
  }

  export {
    system,
    stacked,
    vertical,
    linkType,
    highlightActive,
    classList as class,
  };
</script>

<ul class="timeline {classList ?? ''}" class:timeline-vertical={vertical}>
  {#if system.revisions?.length}
    {#each system.revisions as revision, i}
      <li class="group">
        {#if i !== 0}<hr />{/if}
        <a
          title={revision.title}
          class:!timeline-end={!stacked && i % 2}
          class:opacity-30={highlightActive &&
            $actives[system.id] !== revision.id}
          class="timeline-start timeline-box border-current text-current bg-transparent overflow-hidden whitespace-nowrap text-ellipsis max-w-32"
          href={linkType === "anchor"
            ? `#${revision.id}`
            : `/systems/${revision.systemId}#${revision.id}`}
          on:click
          on:click={() => dispatch("activate", revision.id)}
          on:click|preventDefault={() => actives.setKey(system.id, revision.id)}
          >{revision.title}</a
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

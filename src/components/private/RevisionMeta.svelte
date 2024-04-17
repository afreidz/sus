<script lang="ts">
  import api from "@/helpers/api";
  import { createEventDispatcher } from "svelte";
  import type { APIResponses } from "@/helpers/api";
  import ConfirmDialog from "@/components/common/ConfirmDialog.svelte";
  import NewRevisionDialog from "@/components/private/NewRevisionDialog.svelte";

  let hasTasklist: boolean = false;
  let newRevisionDialog: HTMLDialogElement;
  let showNewRevisionDialog: boolean = false;
  let deleteRevisionDialog: HTMLDialogElement;
  let showDeleteRevisionDialog: boolean = false;
  let revision:
    | APIResponses["systemId"]["GET"]["revisions"][number]
    | APIResponses["revisionId"]["GET"];

  const dispatch = createEventDispatcher();

  async function deleteRevision() {
    if (deleteRevisionDialog.returnValue !== revision.title) {
      showDeleteRevisionDialog = false;
      return;
    }

    await api({
      method: "DELETE",
      endpoint: "revisionId",
      substitutions: { revisionId: revision.id },
    });

    showDeleteRevisionDialog = false;
    dispatch("update");
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
    dispatch("update");
  }

  export { revision, hasTasklist };
</script>

{#if revision}
  <div class="card bg-neutral shadow-sm sticky top-20 mr-4 mt-8">
    <div class="card-body">
      <header class="prose">
        <h2
          class="border-b mb-2 pb-2 border-sus-surface-30 text-sus-primary-60"
        >
          {revision.title}
        </h2>
      </header>
      <div class="flex flex-col gap-1">
        <p class="flex justify-between m-0">
          <strong class="flex-1">System:</strong>
          <span class="text-sm text-sus-surface-0-fg/50"
            >{revision.system.title}</span
          >
        </p>
        <p class="flex justify-between m-0">
          <strong class="flex-1">Created By:</strong>
          <span class="text-sm text-sus-surface-0-fg/50"
            >{revision.system.client.createdBy.split("@")[0]}</span
          >
        </p>
        <p class="flex justify-between m-0">
          <strong class="flex-1">Created On:</strong>
          <span class="text-sm text-sus-surface-0-fg/50"
            >{new Date(revision.createdAt).toLocaleDateString("en-US")}</span
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
      <a href={`/tasklist/${revision.id}`} class="btn btn-outline"
        >{hasTasklist ? "Edit" : "Create"} user test tasklist</a
      >
      <div class="divider">
        <span>Danger Zone</span>
      </div>
      <button
        on:click={() => (showDeleteRevisionDialog = true)}
        class="btn btn-error btn-outline hover:!text-neutral"
        >Delete Revision</button
      >
    </div>
  </div>
{/if}

{#if showDeleteRevisionDialog}
  <ConfirmDialog
    open
    on:close={deleteRevision}
    bind:elm={deleteRevisionDialog}
    bind:confirmText={revision.title}
  >
    Deleting the revision will also delete any respondents and responses.
  </ConfirmDialog>
{/if}

<NewRevisionDialog
  system={revision.system}
  bind:elm={newRevisionDialog}
  on:close={createNewRevision}
  open={showNewRevisionDialog}
/>

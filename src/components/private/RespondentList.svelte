<script lang="ts">
  import ConfirmDialog, {
    defaultConfirmValue,
  } from "@/components/common/ConfirmDialog.svelte";

  import api from "@/helpers/api";
  import copy from "clipboard-copy";
  import type { APIResponses } from "@/helpers/api";

  let hasTasklist = false;
  let deleteRespondentDialog: HTMLDialogElement;
  let respondents: APIResponses["revisionId"]["GET"]["respondents"] = [];
  let respondentToDelete: (typeof respondents)[number] | undefined = undefined;

  async function deleteRespondent() {
    if (
      deleteRespondentDialog.returnValue !== defaultConfirmValue ||
      !respondentToDelete
    ) {
      respondentToDelete = undefined;
      return;
    }

    await api({
      endpoint: "respondentId",
      method: "DELETE",
      substitutions: { respondentId: respondentToDelete.id },
    });

    respondents = (
      await api({
        endpoint: "revisionId",
        method: "GET",
        substitutions: { revisionId: respondentToDelete.revisionId },
      })
    ).respondents;

    respondentToDelete = undefined;
  }

  async function resetStatus(respondent: (typeof respondents)[number]) {
    await api({
      endpoint: "respondentId",
      method: "PUT",
      substitutions: { respondentId: respondent.id },
      body: JSON.stringify({ complete: false }),
    });

    respondents = (
      await api({
        endpoint: "revisionId",
        method: "GET",
        substitutions: { revisionId: respondent.revisionId },
      })
    ).respondents;
  }

  export { respondents, hasTasklist };
</script>

<h4 class="label sticky top-0 bg-neutral left-0 right-0 z-10">
  <span class="label-text">Respondents</span>
</h4>
<ul class="w-full h-full">
  {#each respondents as respondent}
    <li class="bg-neutral-50 rounded-lg mb-1 p-3 flex items-center gap-2">
      <span class="flex-1">{respondent.email}</span>
      {#if respondent.complete}
        <div class="badge badge-success">completed</div>
      {:else if respondent.responses.length}
        <div class="badge badge-warning">started</div>
      {:else}
        <div class="badge">not started</div>
      {/if}
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
            <a
              target="_blank"
              href={`/surveys/sus/${respondent.revisionId}/${respondent.id}`}
              >Go to SUS survey</a
            >
          </li>
          {#if hasTasklist}
            <li>
              <a
                target="_blank"
                href={`/surveys/task/${respondent.revisionId}/${respondent.id}`}
                >Go to Tasklist</a
              >
            </li>
          {/if}
          <li>
            <button
              on:click={() =>
                copy(
                  `${window.location.origin}/surveys/sus/${respondent.revisionId}/${respondent.id}`
                )}
            >
              Copy SUS link
            </button>
          </li>
          <li>
            <button on:click={() => resetStatus(respondent)}
              >Set to incomplete</button
            >
          </li>
          <li class="text-error">
            <button on:click={() => (respondentToDelete = respondent)}>
              Delete!
            </button>
          </li>
        </ul>
      </div>
      {#if respondentToDelete}
        <ConfirmDialog
          open
          on:close={deleteRespondent}
          bind:elm={deleteRespondentDialog}
        >
          Deleting the respondent will also delete any respondent responses.
        </ConfirmDialog>
      {/if}
    </li>
  {/each}
</ul>

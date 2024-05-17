<script lang="ts">
  import api from "@/helpers/api";
  import type { APIResponses } from "@/helpers/api";
  import Gauge from "@/components/common/Gauge.svelte";
  import { generateRevisionPresentation } from "@/helpers/ppt";
  import { onMount, createEventDispatcher, tick } from "svelte";
  import { calculateSUSScoreFromRespondent } from "@/helpers/score";
  import ChecklistCreate from "@/components/checklist/Create.svelte";
  import ConfirmDialog from "@/components/common/ConfirmDialog.svelte";
  import { checklistType, refreshTypes, susType } from "@/stores/types";
  import NewRevisionDialog from "@/components/private/NewRevisionDialog.svelte";

  let loadingPPT = false;
  let showChecklistDialog = false;
  let checklistDialog: HTMLDialogElement;
  let newRevisionDialog: HTMLDialogElement;
  let showNewRevisionDialog: boolean = false;
  let deleteRevisionDialog: HTMLDialogElement;
  let showDeleteRevisionDialog: boolean = false;

  let hiddenChartsForPPT: {
    chart?: SVGSVGElement;
    respondent: APIResponses["summarizeRevision"]["GET"]["respondents"][number];
  }[] = [];

  $: if (checklistDialog) checklistDialog.showModal();

  let revision:
    | APIResponses["systemId"]["GET"]["revisions"][number]
    | APIResponses["revisionId"]["GET"];

  const dispatch = createEventDispatcher();

  onMount(async () => await refreshTypes());

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

  async function generatePowerPoint() {
    loadingPPT = true;
    if (!revision.summarized) {
      const updated = await api({
        method: "GET",
        endpoint: "summarizeRevision",
        substitutions: { revisionId: revision.id },
      });

      const susCompleteRespondents = updated.respondents.filter(
        (r) => r.complete
      );

      hiddenChartsForPPT = susCompleteRespondents.map((r) => ({
        respondent: r,
      }));

      await tick();
      await generateRevisionPresentation(updated, hiddenChartsForPPT);
    }
    loadingPPT = false;
  }

  export { revision };
</script>

{#if revision}
  {@const hasChecklist =
    $checklistType &&
    !!revision.surveys.find((s) => s.scoreTypeId == $checklistType?.id)}
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
      <button on:click={generatePowerPoint} class="btn btn-primary">
        {#if loadingPPT}
          <span class="loading loading-spinner loading-sm"></span>
        {:else}
          <iconify-icon icon="simple-icons:openai"></iconify-icon>
        {/if}
        Generate Readout
      </button>
      <button
        on:click={() => (showNewRevisionDialog = true)}
        class="btn btn-secondary text-neutral">New Revision</button
      >
      <button
        on:click={() => (showChecklistDialog = true)}
        class="btn btn-outline"
        >{hasChecklist ? "Edit" : "Create"} user test checklist</button
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

{#if showChecklistDialog}
  <dialog open class="modal" on:close={() => (showChecklistDialog = false)}>
    <div class="modal-box bg-neutral w-full max-w-2xl">
      <ChecklistCreate
        {revision}
        on:update={() => (showChecklistDialog = false)}
        on:cancel={() => (showChecklistDialog = false)}
      />
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          >✕</button
        >
      </form>
    </div>
    <div class="modal-backdrop bg-neutral-950/80"></div>
  </dialog>
{/if}

{#each hiddenChartsForPPT as respondentChart}
  {@const survey = revision.surveys.find((s) => s.scoreTypeId === $susType?.id)}
  {@const susScore = calculateSUSScoreFromRespondent(
    respondentChart.respondent,
    survey?.id
  )}
  <div class="invisible h-20 pointer-events-none">
    <Gauge
      differential={susScore - 50}
      scores={[[50, susScore], [50]]}
      bind:svg={respondentChart.chart}
    />
  </div>
{/each}

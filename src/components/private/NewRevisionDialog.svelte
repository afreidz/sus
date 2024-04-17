<script lang="ts">
  import api from "@/helpers/api";
  import type { APIResponses } from "@/helpers/api";
  import { safeTextRegEx } from "@/helpers/strings";
  import { MessageHandler } from "@/stores/messages";
  import { susType, refreshTypes } from "@/stores/types";

  type SingleSystem =
    | APIResponses["systemId"]["GET"]["revisions"][number]["system"]
    | APIResponses["revisionId"]["GET"]["system"];

  let open: boolean = false;
  let elm: HTMLDialogElement;
  let system: SingleSystem | null = null;

  let newRevisionTitle: string = "";
  let newRevisionSurveys: string[] = [];
  let surveys: APIResponses["surveyType"]["GET"] = [];

  $: if (open && elm) showModal();

  async function showModal() {
    if (!$susType?.id) await refreshTypes();
    const id = $susType?.id;

    if (!surveys.length && id) {
      surveys = await api({
        endpoint: "surveyType",
        method: "GET",
        substitutions: { surveyType: id },
      });
    }

    if (!surveys.length)
      return MessageHandler({
        type: "error",
        message: "Could not find any surveys for revision",
      });

    elm.showModal();
  }

  $: if (!open) {
    newRevisionTitle = "";
    newRevisionSurveys = [];
  }

  export { elm, open, system };
</script>

<dialog class="modal text-neutral-950" bind:this={elm} on:close>
  <form
    method="dialog"
    class="modal-box bg-neutral"
    on:submit|preventDefault={(e) => {
      elm.close(
        e &&
          JSON.stringify({
            title: newRevisionTitle,
            systemId: system?.id,
            surveys: newRevisionSurveys,
          })
      );
    }}
  >
    <h3 class="font-bold text-lg">Create Revision for {system?.title}</h3>
    <div class="prose">
      <p>
        <label class="form-control">
          <div class="label">
            <span class="label-text">Title for revision</span>
          </div>
          <input
            required
            type="text"
            class="input w-full max-w-xs"
            title="Invalid revision name"
            bind:value={newRevisionTitle}
            pattern={safeTextRegEx.source}
          />
        </label>
      </p>
      {#if surveys.length}
        <label class="form-control">
          <div class="label">
            <span class="label-text">Pick a SUS survey type for revision</span>
          </div>
          <select
            required
            bind:value={newRevisionSurveys[0]}
            class="select w-full max-w-xs"
          >
            {#each surveys as survey}
              <option value={survey.id}>{survey.label}</option>
            {/each}
          </select>
        </label>
      {/if}
    </div>
    <div class="modal-action">
      <button value="confirm" class="btn btn-secondary text-neutral"
        >Create</button
      >
      <button
        value="cancel"
        formmethod="dialog"
        on:click|preventDefault={() => {
          elm.close();
        }}
        class="btn btn-link">Cancel</button
      >
    </div>
  </form>
</dialog>

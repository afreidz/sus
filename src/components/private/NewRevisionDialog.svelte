<script lang="ts">
  import { onMount } from "svelte";
  import type { APIResponses } from "@/helpers/api";
  import { safeTextRegEx } from "@/helpers/strings";
  import { refreshTypes, susType } from "@/stores/types";
  import surveys, { refreshSurveys } from "@/stores/surveys";

  type SingleSystem = APIResponses["systemId"]["GET"];

  export let open: boolean = false;
  export let elm: HTMLDialogElement;
  export let system: SingleSystem | null = null;

  let newRevisionTitle: string = "";
  let newRevisionSurveys: string[] = [];
  let susSurveys: APIResponses["surveys"]["GET"] = [];

  onMount(() => {
    refreshSurveys();
  });

  if (!$susType?.id) refreshTypes();

  $: if ($surveys?.length) {
    susSurveys = $surveys?.filter((s) => s.scoreTypeId === $susType?.id) ?? [];
  }

  $: if (open && elm) {
    elm.showModal();
  }

  $: if (!open) {
    newRevisionTitle = "";
    newRevisionSurveys = [];
  }
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
            bind:value={newRevisionTitle}
            pattern={safeTextRegEx.source}
            on:invalid={(e) =>
              e.currentTarget.setCustomValidity(`Invalid revision name`)}
          />
        </label>
      </p>
      {#if susSurveys.length}
        <label class="form-control">
          <div class="label">
            <span class="label-text">Pick a SUS survey type for revision</span>
          </div>
          <select
            required
            bind:value={newRevisionSurveys[0]}
            class="select w-full max-w-xs"
          >
            {#each susSurveys as survey}
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

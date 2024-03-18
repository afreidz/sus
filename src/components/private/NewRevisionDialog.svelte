<script lang="ts">
  import { onMount } from "svelte";
  import type { APIResponses } from "@/helpers/api";
  import surveys, { refreshSurveys } from "@/stores/surveys";
  import { refreshTypes, susType, taskType } from "@/stores/types";

  type SingleSystem = APIResponses["systemId"]["GET"];

  export let open: boolean = false;
  export let elm: HTMLDialogElement;
  export let system: SingleSystem | null = null;

  let newRevisionTitle: string = "";
  let newRevisionSurveys: string[] = [];
  let susSurveys: APIResponses["surveys"]["GET"] = [];
  let taskSurveys: APIResponses["surveys"]["GET"] = [];

  onMount(() => {
    refreshTypes();
    refreshSurveys();
  });

  $: if ($surveys?.length) {
    susSurveys = $surveys?.filter((s) => s.scoreTypeId === $susType?.id) ?? [];
    taskSurveys =
      $surveys?.filter((s) => s.scoreTypeId === $taskType?.id) ?? [];
  }

  $: if (open && elm) {
    elm.showModal();
  }

  $: if (!open) {
    newRevisionTitle = "";
    newRevisionSurveys = [];
  }
</script>

<dialog class="modal" bind:this={elm} on:close>
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
            <option disabled selected>Choose one...</option>
            {#each susSurveys as survey}
              <option value={survey.id}>{survey.label}</option>
            {/each}
          </select>
        </label>
      {/if}
      {#if taskSurveys.length}
        <label class="form-control">
          <div class="label">
            <span class="label-text"
              >Pick a user test tasklist for revision</span
            >
          </div>
          <select
            required
            bind:value={newRevisionSurveys[1]}
            class="select w-full max-w-xs"
          >
            <option disabled selected>Choose one...</option>
            {#each taskSurveys as survey}
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

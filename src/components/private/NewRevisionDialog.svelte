<script lang="ts">
  import { onMount } from "svelte";
  import type { APIResponses } from "@/helpers/api";
  import surveys, { refreshSurveys } from "@/stores/surveys";

  type SingleSystem = APIResponses["systemId"]["GET"];

  export let open: boolean = false;
  export let elm: HTMLDialogElement;
  export let system: SingleSystem | null = null;

  let newRevisionTitle: string = "";
  let newRevisionSurvey: string = "";

  onMount(() => {
    refreshSurveys();
  });

  $: if (open && elm) {
    elm.showModal();
  }

  $: if (!open) {
    newRevisionTitle = "";
    newRevisionSurvey = "";
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
      <p>
        {#if $surveys}
          <select
            required
            bind:value={newRevisionSurvey}
            class="select w-full max-w-xs"
          >
            <option disabled selected>Pick a survey for revision</option>
            {#each $surveys as survey}
              <option value={survey.id}>{survey.label}</option>
            {/each}
          </select>
        {/if}
      </p>
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

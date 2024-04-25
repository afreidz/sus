<script lang="ts">
  import {
    reorderArray,
    groupTaskListSection,
    orderResponseByNumericalValue,
  } from "@/helpers/order";

  import api from "@/helpers/api";
  import { onMount } from "svelte";
  import session, { stopRecording } from "@/stores/session";
  import type { APIResponses } from "@/helpers/api";
  import CardHeader from "@/components/common/CardHeader.svelte";

  type Response = { response: string; notes?: string };
  const responses: { [key: string]: Response } = {};

  let loading = false;
  let sectionActiveTaskIndices: number[] = [];
  let sections: ReturnType<typeof groupTaskListSection> = [];
  let respondent: APIResponses["respondentBySurveyId"]["GET"];
  let survey:
    | APIResponses["revisionSurveyType"]["GET"]["surveys"][number]
    | undefined = undefined;

  onMount(async () => {
    if (!survey?.questions) return;

    loading = true;
    sections = groupTaskListSection(survey.questions);

    // const existingResponses = await api({
    //   method: "GET",
    //   endpoint: "respondentSurveyResponses",
    //   substitutions: {
    //     respondentId: respondent.id,
    //     surveyId: survey.id,
    //   },
    // });

    // survey.questions.forEach((q) => {
    //   const existing = existingResponses.find((r) => r.questionId === q.id);
    //   const response = existing ? existing.curratedResponseId ?? "" : "";
    //   const notes = existing ? existing.freeformResponse ?? "" : "";
    //   responses[q.id] = { response, notes };
    // });

    loading = false;
  });

  $: if (sections) {
    sections.forEach((_, i) => {
      if (typeof sectionActiveTaskIndices?.[i] !== "number") {
        sectionActiveTaskIndices[i] = 0;
      }
    });
  }

  async function saveSection() {
    if (!survey?.id) throw new Error("Unable to save answers to survey");

    await Promise.all(
      Object.entries(responses).map(([questionId, { response, notes }]) => {
        return api({
          method: "POST",
          endpoint: "responses",
          body: JSON.stringify({
            questionId,
            freeformResponse: notes,
            respondentId: respondent.id,
            surveyId: (survey as any).id,
            curratedResponseId: response,
            revisionId: respondent.revisionId,
          }),
        });
      })
    );
  }

  function incrementTaskIndex(sectionIndex: number) {
    const section = sections[sectionIndex];
    const index = sectionActiveTaskIndices[sectionIndex] + 1;
    sectionActiveTaskIndices[sectionIndex] =
      index < 0 ? 0 : index >= section.tasks.length ? 0 : index;
  }

  function decrementTaskIndex(sectionIndex: number) {
    const section = sections[sectionIndex];
    const index = sectionActiveTaskIndices[sectionIndex] - 1;
    sectionActiveTaskIndices[sectionIndex] =
      index < 0
        ? section.tasks.length - 1
        : index >= section.tasks.length
          ? section.tasks.length - 1
          : index;
  }

  export { survey, respondent };
</script>

<div class="flex overflow-auto flex-nowrap flex-1">
  {#each sections as section, s (section.group)}
    <div
      id={`section_${section.group}`}
      class="rounded-lg bg-sus-surface-0 shadow-md flex flex-col gap-4 min-w-full"
    >
      <CardHeader class="p-4">
        <span class="!text-lg">
          {section.group}
        </span>

        <span
          class:tooltip={$session.recorder.status !== "recording"}
          data-tip="Task lists will be enabled when recording is started"
          class="tooltip-secondary tooltip-bottom tooltip-open"
          slot="sub"
          >Ask the candidate to perform the following tasks and record their
          results below</span
        >
      </CardHeader>

      <div class="flex-1 flex items-center justify-center flex-col">
        <ul
          class="stack px-4 w-full -mt-8"
          class:opacity-10={$session.recorder.status !== "recording"}
          class:pointer-events-none={$session.recorder.status !== "recording"}
        >
          {#each reorderArray(section.tasks, sectionActiveTaskIndices[s]) as task, t (task.id)}
            <li class="card shadow-md bg-neutral-50 w-full">
              <div class="card-body">
                <h4 class="italic text-center font-thin text-xl">
                  Task: {task.text}
                </h4>
                <ul class="join join-vertical xl:join-horizontal mx-auto my-4">
                  {#if survey}
                    {#each orderResponseByNumericalValue(survey.questions[0].curratedResponses) as response (response.id)}
                      <li
                        class="p-0 join-item btn btn-outline border-neutral-300 bg-neutral btn-lg"
                      >
                        <label
                          class="group flex flex-1 h-full items-center gap-4 px-4"
                        >
                          <input
                            required
                            type="radio"
                            value={response.id}
                            name={`section_${s}_task_${t}`}
                            class="radio flex-none radio-sm group-hover:radio-accent"
                          />
                          <strong
                            class="flex-1 text-left font-light group-has-[:checked]:font-semibold"
                            >{response.label}</strong
                          >
                        </label>
                      </li>
                    {/each}
                  {/if}
                </ul>
                <label class="form-control">
                  <div class="label">
                    <span class="label-text">Moderator notes</span>
                  </div>
                  <textarea class="textarea textarea-bordered h-40 bg-neutral"
                  ></textarea>
                </label>
                {#if section.tasks.length > 1}
                  <footer class="join flex-none justify-self-end my-4 mx-auto">
                    <button
                      type="button"
                      on:click={() => decrementTaskIndex(s)}
                      class="join-item btn btn-secondary">« Prev</button
                    >
                    <button
                      type="submit"
                      on:click={() => incrementTaskIndex(s)}
                      class="join-item btn btn-secondary">Next »</button
                    >
                  </footer>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      </div>
      {#if $session.recorder.status === "recording"}
        <footer class="join flex-none p-4 flex">
          <button
            on:click={stopRecording}
            class="btn btn-error text-neutral flex-1">End Section</button
          >
        </footer>
      {/if}
    </div>
  {/each}
</div>

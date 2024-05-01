<script lang="ts">
  import {
    reorderArray,
    groupTaskListSection,
    orderResponseByNumericalValue,
  } from "@/helpers/order";

  import api from "@/helpers/api";
  import { onMount } from "svelte";
  import session from "@/stores/session";
  import type { APIResponses } from "@/helpers/api";
  import CardHeader from "@/components/common/CardHeader.svelte";

  const responses: { [key: string]: Response } = {};
  type Response = { response: string; notes?: string; section: string | null };

  let loading = false;
  let sectionElms: HTMLElement[] = [];
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

    const existingResponses = await api({
      method: "GET",
      endpoint: "respondentSurveyResponses",
      substitutions: {
        respondentId: respondent.id,
        surveyId: survey.id,
      },
    });

    survey.questions.forEach((q) => {
      const existing = existingResponses.find((r) => r.questionId === q.id);
      const response = existing ? existing.curratedResponseId ?? "" : "";
      const notes = existing ? existing.freeformResponse ?? "" : "";
      responses[q.id] = { response, notes, section: q.group };
    });

    loading = false;
  });

  $: if (sections) {
    sections.forEach((_, i) => {
      if (typeof sectionActiveTaskIndices?.[i] !== "number") {
        sectionActiveTaskIndices[i] = 0;
      }
    });
  }

  async function endSection(id: string | null, i: number) {
    loading = true;

    // convert responses to an array to filter out any not part of the
    // section.  then convert back to an object;
    // const responsesToSave = id
    //   ? Object.entries(responses)
    //       .filter(([_, { section }]) => section === id)
    //       .reduce(
    //         (o, [k, v]) => {
    //           o[k] = v;
    //           return o;
    //         },
    //         {} as typeof responses
    //       )
    //   : responses;

    // await new Promise((r) => setTimeout(r, 2000)); // Wait for final transcription
    // const recording = await stopRecording();
    // await saveSection(responsesToSave, recording);
    // if (sectionElms[i + 1])
    //   sectionElms[i + 1].scrollIntoView({ behavior: "smooth" });
    // // startRecording();

    loading = false;
  }

  // async function saveSection(
  //   r: typeof responses,
  //   recording?: SessionRecording
  // ) {
  //   const responses = Object.entries(r).map(
  //     ([questionId, { response, notes, section }]) => ({
  //       notes,
  //       section,
  //       questionId,
  //       responseId: response,
  //     })
  //   );

  //   const body = JSON.stringify({
  //     responses,
  //     respondentId: respondent.id,
  //     moments: recording?.moments,
  //     moderator: $session.hostname,
  //     videoURL: recording?.videoURL,
  //     transcript: recording?.transcript,
  //     revisionId: respondent.revisionId,
  //     start: recording?.start.toString(),
  //   });

  //   await api({
  //     endpoint: "sessions",
  //     method: "POST",
  //     body,
  //   });
  // }

  function incrementTaskIndex(sectionIndex: number) {
    const section = sections[sectionIndex];
    const index = sectionActiveTaskIndices[sectionIndex] + 1;
    sectionActiveTaskIndices[sectionIndex] =
      index < 0
        ? 0
        : index >= section.tasks.length
          ? section.tasks.length
          : index;
  }

  function decrementTaskIndex(sectionIndex: number) {
    const section = sections[sectionIndex];
    const index = sectionActiveTaskIndices[sectionIndex] - 1;
    sectionActiveTaskIndices[sectionIndex] =
      index < 0
        ? 0
        : index >= section.tasks.length
          ? section.tasks.length - 1
          : index;
  }

  export { survey, respondent };
</script>

<div
  class="flex overflow-auto flex-nowrap flex-1 rounded-lg bg-sus-surface-0 shadow-md"
>
  {#if loading}
    <span class="loading loading-spinner loading-lg mx-auto"></span>
  {:else}
    {#each sections as section, s (section.group)}
      <div
        bind:this={sectionElms[s]}
        id={`section_${section.group}`}
        class="flex flex-col gap-4 min-w-full"
      >
        <CardHeader class="p-4">
          <span class="!text-lg">
            {section.group}
          </span>

          <span
            class:tooltip={!$session.status.recording}
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
            class:opacity-10={!$session.status.recording}
            class:pointer-events-none={!$session.status.recording}
          >
            {#each reorderArray(section.tasks, sectionActiveTaskIndices[s]) as task, t (task.id)}
              <li class="card shadow-md bg-neutral-50 w-full">
                <div class="card-body">
                  <h4 class="italic text-center font-thin text-xl">
                    Task: {task.text}
                  </h4>
                  <ul
                    class="join join-vertical xl:join-horizontal mx-auto my-4"
                  >
                    {#if survey}
                      {#each orderResponseByNumericalValue(survey.questions[0].curratedResponses) as response (response.id)}
                        <li
                          class="p-0 join-item btn btn-outline border-neutral-300 bg-neutral btn-lg"
                        >
                          {#if task.id && responses[task.id]}
                            <label
                              class="group flex flex-1 h-full items-center gap-4 px-4"
                            >
                              <input
                                required
                                type="radio"
                                value={response.id}
                                name={`section_${s}_task_${t}`}
                                bind:group={responses[task.id].response}
                                class="radio flex-none radio-sm group-hover:radio-accent"
                              />
                              <strong
                                class="flex-1 text-left font-light group-has-[:checked]:font-semibold"
                                >{response.label}</strong
                              >
                            </label>
                          {/if}
                        </li>
                      {/each}
                    {/if}
                  </ul>
                  <label class="form-control">
                    <div class="label">
                      <span class="label-text">Moderator notes</span>
                    </div>
                    {#if task.id && responses[task.id]}
                      <textarea
                        class="textarea textarea-bordered h-40 bg-neutral"
                        bind:value={responses[task.id].notes}
                        name={`section_${s}_task_${t}_notes`}
                      ></textarea>
                    {/if}
                  </label>
                  {#if section.tasks.length > 1}
                    <footer
                      class="join flex-none justify-self-end my-4 mx-auto"
                    >
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
      </div>
    {/each}
  {/if}
</div>

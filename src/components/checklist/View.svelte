<script lang="ts">
  import api from "@/helpers/api";
  import { onMount } from "svelte";
  import confetti from "@/helpers/confetti";
  import type { APIResponses } from "@/helpers/api";
  import { groupChecklistSection } from "@/helpers/order";
  import CardHeader from "@/components/common/CardHeader.svelte";
  import { orderResponseByNumericalValue } from "@/helpers/order";

  let loading = false;
  let complete = false;
  let sections: ReturnType<typeof groupChecklistSection>;
  let respondent: APIResponses["respondentBySurveyId"]["GET"];
  let survey: APIResponses["revisionId"]["GET"]["surveys"][number];

  type Response = { response: string; notes?: string };
  const responses: { [key: string]: Response } = {};

  onMount(async () => {
    if (!survey.questions) return;

    loading = true;
    sections = groupChecklistSection(survey.questions);

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
      responses[q.id] = { response, notes };
    });

    loading = false;
  });

  async function saveChecklist() {
    loading = true;

    await Promise.all(
      Object.entries(responses).map(([questionId, { response, notes }]) => {
        return api({
          method: "POST",
          endpoint: "responses",
          body: JSON.stringify({
            questionId,
            surveyId: survey.id,
            freeformResponse: notes,
            respondentId: respondent.id,
            curratedResponseId: response,
            revisionId: respondent.revisionId,
          }),
        });
      })
    );

    confetti();
    loading = false;
    complete = true;
  }

  export { respondent, survey };
</script>

<form
  on:submit|preventDefault={saveChecklist}
  class:skeleton={!sections?.length || loading}
  class="flex-1 card bg-neutral rounded-lg shadow-sm px-4 w-full max-w-screen-lg overflow-clip"
>
  <CardHeader
    icon="mdi:list-status"
    class="mb-4 flex-none !sticky top-[60px] bg-neutral left-0 right-0 z-10 -mx-4 px-4 pt-4"
  >
    <span>{respondent.email}</span>

    <span slot="sub"
      >Ask the candidate to perform the following tasks and record their results
      below</span
    >
    <div slot="pull">
      {#if sections?.length && !loading && !complete}
        <button type="submit" class="btn btn-primary">Complete Session</button>
      {/if}
    </div>
  </CardHeader>
  {#if complete}
    <div class="flex-1 w-full flex items-center justify-center">
      <h2 class="text-2xl xl:text-4xl font-extrabold ms-10 me-10 text-center">
        The results have been recorded.
      </h2>
    </div>
  {:else if sections?.length && !loading}
    {#each sections as section, s}
      <table
        class="table mb-8 rounded-lg ring-4 ring-base-300/50 border-base-200"
      >
        <thead>
          <tr>
            <th class="w-[30%] border-r border-base-200 p-0">
              <div class="mockup-window bg-sus-primary-40 m-4">
                <div class="flex justify-center bg-sus-surface-20">
                  {#if section.imageURL}
                    <img
                      alt="section checklist screenshot"
                      src={section.imageURL}
                    />
                  {/if}
                </div>
              </div>
            </th>
            <th class="border-r border-base-200 text-base bg-sus-surface-10 p-0"
            ></th>
            <th class="border-r border-base-200 text-base bg-sus-surface-10 p-0"
            ></th>
            <th class="border-r border-base-200 text-base bg-sus-surface-10 p-0"
            ></th>
            <th class="border-r border-base-200 text-base bg-sus-surface-10 p-0"
            ></th>
            <th class="border-r border-base-200 text-base bg-sus-surface-10 p-0"
            ></th>
          </tr>
          <tr class="sticky top-36">
            <th
              class="border-r border-base-200 text-center text-base bg-neutral p-0"
            >
              <span class="border-b border-base-200 p-4 block w-full"
                >Tasks</span
              >
            </th>
            {#each orderResponseByNumericalValue(survey.questions[0].curratedResponses) as response}
              <th
                class="w-[15%] text-center text-base bg-neutral p-0 border-r border-base-200"
              >
                <span class="border-b border-base-200 p-4 block w-full"
                  >{response.label}</span
                >
              </th>
            {/each}
            <th
              class="w-[15%] rounded-tr-lg overflow-clip text-center bg-neutral text-base p-0"
            >
              <span class="border-b border-base-200 p-4 block w-full"
                >Notes</span
              >
            </th>
          </tr>
        </thead>
        <tbody>
          {#each section.tasks as task, t}
            <tr>
              <td class="border-r border-base-200">
                {t + 1}. {sections[s].tasks[t].text}
              </td>
              {#each orderResponseByNumericalValue(survey.questions[0].curratedResponses) as resp, r}
                <td class="border-r border-base-200 !p-0">
                  {#if task.id}
                    <label class="p-4 w-full h-full flex justify-center">
                      <input
                        required
                        type="radio"
                        value={resp.id}
                        class="radio radio-primary"
                        name={`section_${s}_task_${t}`}
                        bind:group={responses[task.id].response}
                      />
                    </label>
                  {/if}
                </td>
              {/each}
              <td class="border-base-200">
                {#if task.id}
                  <textarea
                    bind:value={responses[task.id].notes}
                    name={`section_${s}_task_${t}_notes`}
                  ></textarea>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/each}
  {/if}
</form>

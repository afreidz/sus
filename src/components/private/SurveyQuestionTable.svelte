<script lang="ts">
  import api from "@/helpers/api";
  import { onMount } from "svelte";
  import type { APIResponses } from "@/helpers/api";
  import { susType, refreshTypes } from "@/stores/types";
  import { averageOccurringString } from "@/helpers/strings";

  let revisionId: string;
  let revision: APIResponses["revisionId"]["GET"];

  onMount(async () => {
    await refreshTypes();
    revision = await api({
      endpoint: "revisionId",
      method: "GET",
      substitutions: { revisionId },
    });
  });

  function getResponseCount(qid: string) {
    return revision.respondents.reduce((count, respondent) => {
      return (count += respondent.responses.find(
        (response) => response.questionId === qid
      )
        ? 1
        : 0);
    }, 0);
  }

  function getAverageResponse(qid: string) {
    const responses = revision.respondents
      .map((respondent) =>
        respondent.responses.find((response) => response.questionId === qid)
      )
      .filter(Boolean) as (typeof revision.respondents)[number]["responses"];

    const possibleResponses = responses
      .reduce<(string | undefined)[]>((possible, response) => {
        possible.push(
          (response?.curratedResponse?.label || response?.freeformResponse) ??
            undefined
        );
        return possible;
      }, [])
      .filter(Boolean) as string[];

    return averageOccurringString(possibleResponses) ?? "none";
  }

  export { revisionId };
</script>

<div class="card bg-neutral shadow-sm p-4">
  <header class="flex gap-2 pb-4">
    <iconify-icon class="text-2xl mt-1" icon="mdi:invite"></iconify-icon>
    <div class="prose">
      <h3 class="mb-1">SUS Survey Questions</h3>
    </div>
  </header>
  <table class="table">
    <thead>
      <tr>
        <th></th>
        <th>Question</th>
        <th>Avg. Response</th>
        <th>Respondents</th>
      </tr>
    </thead>
    {#if revision && $susType}
      {@const susSurvey = revision.surveys.find(
        (survey) => survey.survey.scoreTypeId === $susType?.id
      )?.survey}
      <tbody>
        {#if susSurvey?.questions}
          {#each susSurvey.questions as surveyQuestion}
            {@const question = surveyQuestion.question}
            <tr>
              <th></th>
              <td class="italic opacity-50">"{question.text}"</td>
              <td class="text-center">{getAverageResponse(question.id)}</td>
              <td class="text-center">{getResponseCount(question.id)}</td>
            </tr>
          {/each}
        {/if}
      </tbody>
    {/if}
  </table>
</div>

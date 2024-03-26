<script lang="ts">
  import api from "@/helpers/api";
  import { onMount } from "svelte";
  import copy from "clipboard-copy";
  import type { APIResponses } from "@/helpers/api";
  import { susType, refreshTypes } from "@/stores/types";
  import { averageOccurringString } from "@/helpers/strings";
  import CardHeader from "@/components/common/CardHeader.svelte";

  let revisionId: string;
  let surveyTestLink = "";
  let revision: APIResponses["revisionId"]["GET"];

  $: if (revision)
    surveyTestLink = `${window.location.origin}/surveys/sus/${revision.id}`;

  onMount(async () => {
    await refreshTypes();
    revision = await api({
      method: "GET",
      endpoint: "revisionId",
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

<div class="card bg-neutral shadow-sm p-4 flex flex-col">
  <CardHeader icon="ph:question">
    <span>SUS Survey Questions</span>
    <span slot="sub"
      >These are the questions in order that the respondents will see when
      completing the SUS survey for this revision</span
    >
  </CardHeader>
  <table class="table flex-1">
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
        (survey) => survey.scoreTypeId === $susType?.id
      )}
      <tbody>
        {#if susSurvey?.questions}
          {#each susSurvey.questions as question}
            <tr class="text-base font-light">
              <th></th>
              <td class="italic opacity-50">"{question.text}"</td>
              <td class="text-center font-semibold"
                >{getAverageResponse(question.id)}</td
              >
              <td class="text-center font-semibold"
                >{getResponseCount(question.id)}</td
              >
            </tr>
          {/each}
        {/if}
      </tbody>
    {/if}
  </table>
  <div class="flex gap-2 items-end mb-4 flex-none">
    <label class="form-control w-full">
      <div class="label">
        <span class="label-text">Test survey link</span>
      </div>
      <div class="flex">
        <a class="btn btn-outline me-2" href={surveyTestLink} target="_blank">
          <iconify-icon class="text-xl" icon="carbon:view"></iconify-icon>
        </a>
        <input
          disabled
          type="text"
          bind:value={surveyTestLink}
          class="input input-bordered !bg-neutral-100 w-full"
        />
      </div>
    </label>
    <button on:click={() => copy(surveyTestLink)} class="btn btn-outline"
      >Copy</button
    >
  </div>
</div>

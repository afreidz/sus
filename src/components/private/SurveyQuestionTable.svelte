<script lang="ts">
  import api from "@/helpers/api";
  import { onMount } from "svelte";
  import type { APIResponses } from "@/helpers/api";
  import { susType, refreshTypes } from "@/stores/types";
  import { getAverageResponseLabel } from "@/helpers/strings";
  import CardHeader from "@/components/common/CardHeader.svelte";

  type Response = {
    label: string;
    value: number;
  };

  let loading = false;
  let revisionId: string;
  let surveyTestLink = "";
  let possibleResponses: Response[] = [];
  let revision: APIResponses["revisionId"]["GET"];
  let susSurvey: (typeof revision)["surveys"][number] | undefined;

  $: if (revision)
    surveyTestLink = `${window.location.origin}/surveys/sus/${revision.id}`;

  $: if (revision && $susType) {
    susSurvey = revision.surveys.find(
      (survey) => survey.scoreTypeId === $susType?.id
    );
  }

  $: if (susSurvey) {
    const responseMap = new Map<string, number>();
    susSurvey.questions.forEach((q) => {
      q.curratedResponses.forEach((r) => {
        if (!r.numericalValue) return;
        responseMap.set(r.label, r.numericalValue);
      });
    });

    possibleResponses = Array.from(responseMap.keys()).map((k) => ({
      label: k,
      value: responseMap.get(k) ?? 0,
    }));
  }

  onMount(async () => {
    loading = true;
    await refreshTypes();
    revision = await api({
      method: "GET",
      endpoint: "revisionId",
      substitutions: { revisionId },
    });
    loading = false;
  });

  function nonNullable<T>(value: T): value is NonNullable<T> {
    return value !== null && value !== undefined;
  }

  function getResponseCount(qid: string) {
    return revision.respondents
      .filter((r) => r.complete)
      .reduce((count, respondent) => {
        return (count += respondent.responses.find(
          (response) => response.questionId === qid
        )
          ? 1
          : 0);
      }, 0);
  }

  function getAverageResponse(qid: string) {
    const responses = revision.respondents
      .filter((r) => r.complete)
      .map(
        (respondent) =>
          respondent.responses.find(
            (response) =>
              response.curratedResponse?.numericalValue &&
              response.questionId === qid
          )?.curratedResponse
      )
      .filter(nonNullable);

    return getAverageResponseLabel(responses, possibleResponses) ?? "none";
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
  <table class:skeleton={loading} class="table flex-1 bg-neutral">
    <thead>
      <tr>
        <th></th>
        <th>Question</th>
        <th>Avg. Response</th>
        <th>Respondents</th>
      </tr>
    </thead>
    {#if susSurvey}
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
</div>

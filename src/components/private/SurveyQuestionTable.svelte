<script lang="ts">
  import type { APIResponses } from "@/helpers/api";
  import { getAverageResponseLabel } from "@/helpers/strings";
  import CardHeader from "@/components/common/CardHeader.svelte";

  type Response = {
    label: string;
    value: number;
  };

  let possibleResponses: Response[] = [];
  let respondents: APIResponses["systemId"]["GET"]["revisions"][number]["respondents"];
  let survey:
    | APIResponses["systemId"]["GET"]["revisions"][number]["surveys"][number]
    | undefined;

  $: if (survey) {
    const responseMap = new Map<string, number>();
    survey.questions.forEach((q) => {
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

  function nonNullable<T>(value: T): value is NonNullable<T> {
    return value !== null && value !== undefined;
  }

  function getResponseCount(qid: string) {
    return respondents.reduce((count, respondent) => {
      return (count += respondent.responses.find(
        (response) => response.questionId === qid
      )
        ? 1
        : 0);
    }, 0);
  }

  function getAverageResponse(qid: string) {
    const mappedResponses = respondents
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

    return (
      getAverageResponseLabel(mappedResponses, possibleResponses) ?? "none"
    );
  }

  export { survey, respondents };
</script>

<div class="card bg-neutral shadow-sm p-4 flex flex-col">
  <CardHeader icon="ph:question">
    <span>SUS Survey Questions</span>
    <span slot="sub"
      >These are the questions in order that the respondents will see when
      completing the SUS survey for this revision</span
    >
  </CardHeader>
  <table class="table flex-1 bg-neutral">
    <thead>
      <tr>
        <th></th>
        <th>Question</th>
        <th>Avg. Response</th>
        <th>Respondents</th>
      </tr>
    </thead>
    {#if survey}
      <tbody>
        {#if survey?.questions}
          {#each survey.questions as question}
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

<script lang="ts">
  import { bufferToDataUri } from "@/helpers/image";
  import type { APIResponses } from "@/helpers/api";

  let respondent: APIResponses["respondentBySurveyId"]["GET"];
  let survey: APIResponses["revisionId"]["GET"]["surveys"][number];

  export { respondent, survey };
</script>

{console.log("Survey", survey)}
{console.log("Respondent", respondent)}

{#if survey.questions.length}
  {#each survey.questions as question}
    {#if question.media}
      <img src={bufferToDataUri(question.mediaMIME, question.media)} />
    {/if}
  {/each}
{/if}

<script lang="ts">
  import api from "@/helpers/api";
  import { onMount } from "svelte";
  import me, { refreshMe } from "@/stores/me";
  import type { APIResponses } from "@/helpers/api";

  let disabled = false;
  export let revision: APIResponses["revisionSurveyType"]["GET"];

  onMount(async () => {
    await refreshMe();
    if (!$me?.user?.email) return;

    const rev = await api({
      method: "GET",
      endpoint: "revisionId",
      substitutions: { revisionId: revision.id },
    });

    disabled = !rev.respondents.some((r) => r.email === $me?.user?.email);
  });
</script>

<div class="flex snap-mandatory snap-x overflow-auto flex-0 w-full">
  {#if revision.surveys[0].survey.questions.length}
    {#each revision.surveys[0].survey.questions as surveyQuestion}
      {@const question = surveyQuestion.question}
      <section
        class="snap-start w-full flex-none flex flex-col gap-8 justify-center items-center"
      >
        <h2 class="text-4xl font-extrabold">{question.text}</h2>
        <ul class="flex gap-2">
          {#each question.curratedQuestionResponse as curratedResponse}
            {@const response = curratedResponse.response}
            <li>
              <label
                class="card has-[:checked]:border has-[:checked]:ring-4 border-sus-primary-60 ring-sus-primary-40/50 w-40 aspect-square flex gap-3 items-center justify-center bg-neutral"
              >
                <input
                  {disabled}
                  class="radio radio-sm radio-primary"
                  type="radio"
                  name={question.id}
                  value={response.value}
                />
                <strong>{response.label}</strong>
              </label>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  {/if}
</div>

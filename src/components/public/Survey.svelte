<script lang="ts">
  import api from "@/helpers/api";
  import { onMount } from "svelte";
  import confetti from "@/helpers/confetti";
  import type { APIResponses } from "@/helpers/api";

  let completed = false;
  let emailField: HTMLInputElement;
  let questions: HTMLFormElement[] = [];
  let responses: APIResponses["respondentResponseRevision"]["GET"] = [];

  export let revision: APIResponses["revisionSurveyType"]["GET"];
  export let respondent: APIResponses["respondentId"]["GET"] | undefined =
    undefined;

  type Question = (typeof revision)["surveys"][number]["questions"][number];

  $: if (respondent?.complete) completed = true;

  onMount(async () => {
    if (emailField) emailField.focus();
    if (respondent && revision) {
      responses = await api({
        method: "GET",
        endpoint: "respondentResponseRevision",
        substitutions: { respondentId: respondent.id, revisionId: revision.id },
      });
    }
    if (respondent?.complete) confetti();
  });

  async function focusIndex(q: number = 0) {
    const question = q < 0 ? emailField : questions[q];
    const input = q < 0 ? emailField : question.querySelector("input");

    question.scrollIntoView({ behavior: "smooth" });
    await new Promise((r) => setTimeout(r, 500));
    input?.focus();
  }

  async function updateResponse(
    target: EventTarget | null,
    q: Question,
    i: number
  ) {
    if (!respondent) return;

    const form = target as HTMLFormElement;
    const value = (form.elements.namedItem(q.id) as RadioNodeList).value;

    const response = q.curratedResponses.find(
      (response) => response.value === value
    );

    await api({
      endpoint: "responses",
      method: "POST",
      body: JSON.stringify({
        questionId: q.id,
        revisionId: revision.id,
        respondentId: respondent.id,
        surveyId: respondent.surveyId,
        curratedResponseId: response?.id,
        freeformResponse: !response ? value : undefined,
      }),
    });

    if (i === revision.surveys[0].questions.length) {
      completeSurvey();
    } else {
      focusIndex(i);
    }
  }

  async function completeSurvey() {
    if (!respondent) {
      alert("test survey cannot be submitted");
      completed = true;
      return;
    }

    await api({
      endpoint: "publicRespondentId",
      method: "PUT",
      substitutions: { publicRespondentId: respondent.id },
      body: JSON.stringify({ complete: true }),
    });

    completed = true;
    confetti();
  }

  const containerClass =
    "w-full snap-center min-w-80 flex flex-shrink-0 flex-col gap-8 justify-center items-center";

  const questionTextClass =
    "text-2xl xl:text-4xl font-extrabold ms-10 me-10 text-center";
</script>

<div class="flex snap-mandatory snap-x overflow-auto w-full">
  {#if completed}
    <section class={containerClass}>
      <h2 class={questionTextClass}>
        Thank you for your responses! They have been submitted and recorded.
      </h2>
    </section>
  {:else if revision.surveys[0].questions.length}
    {@const surveyQuestions = revision.surveys[0].questions}
    <form on:submit|preventDefault={() => focusIndex(0)} class={containerClass}>
      <label class="flex-1 flex flex-col gap-10 justify-center items-center">
        <h2 class={questionTextClass}>
          Plese verify your email address to begin.
        </h2>
        <input
          required
          disabled
          type="email"
          bind:this={emailField}
          value={respondent?.email ?? "This survey link is just for testing"}
          class="input input-bordered input-sm xl:input-lg w-full max-w-xs bg-neutral"
        />
      </label>
      <div class="join flex-none justify-self-end my-10">
        <button type="submit" class="join-item btn btn-outline btn-primary"
          >Continue »</button
        >
      </div>
    </form>
    {#each surveyQuestions as question, i}
      {@const existingResponse = responses.find(
        (r) => r.questionId === question.id
      )}
      <form
        on:submit|preventDefault={(e) =>
          updateResponse(e.target, question, i + 1)}
        bind:this={questions[i]}
        class={containerClass}
      >
        <div class="flex-1 flex flex-col gap-10 justify-center items-center">
          <h2 class={questionTextClass}>
            {question.text}
          </h2>
          <ul class="join join-vertical xl:join-horizontal">
            {#each question.curratedResponses as response}
              <li
                class="p-0 join-item btn btn-outline btn-lg bg-neutral border-neutral-300 has-[:checked]:border-sus-primary-60 has-[:checked]:ring-1 ring-sus-primary-60 has-[:checked]:z-10"
              >
                <label class="group flex flex-1 h-full items-center gap-4 px-4">
                  <input
                    required
                    type="radio"
                    name={question.id}
                    value={response.value}
                    checked={existingResponse?.curratedResponse?.value ===
                      response.value}
                    class="radio flex-none radio-sm radio-primary"
                  />
                  <strong
                    class="flex-1 text-left font-light group-has-[:checked]:font-semibold"
                    >{response.label}</strong
                  >
                </label>
              </li>
            {/each}
          </ul>
        </div>
        <div class="join flex-none justify-self-end my-10">
          <button
            type="button"
            on:click={() => focusIndex(i - 1)}
            class="join-item btn btn-outline btn-primary">« Prev</button
          >
          <span class="join-item btn btn-outline btn-info"
            >{i + 1} of {surveyQuestions.length}</span
          >
          <button type="submit" class="join-item btn btn-outline btn-primary"
            >{#if i === surveyQuestions.length - 1}Finish{:else}Next{/if} »</button
          >
        </div>
      </form>
    {/each}
  {/if}
</div>

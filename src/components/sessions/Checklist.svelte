<script lang="ts">
  import api from "@/helpers/api";
  import { onMount } from "svelte";
  import copy from "clipboard-copy";
  import confetti from "@/helpers/confetti";
  import type { APIResponses } from "@/helpers/api";
  import { orderResponseByNumericalValue } from "@/helpers/order";

  const responses: { [key: string]: Response } = {};
  type Response = { response: string; notes?: string; section: string | null };

  let enabled = true;
  let copied = false;
  let loading = false;
  let rest: (typeof current)[];
  let respondent: APIResponses["respondentBySurveyId"]["GET"];

  let susURL = new URL(window.location.origin);

  $: if (respondent)
    susURL.pathname = `/surveys/sus/${respondent.revisionId}/${respondent.id}`;

  let current:
    | APIResponses["revisionSurveyType"]["GET"]["surveys"][number]["questions"][number]
    | undefined = undefined;
  let survey:
    | APIResponses["revisionSurveyType"]["GET"]["surveys"][number]
    | undefined = undefined;

  $: if (survey && current) {
    rest = survey?.questions.filter((q) => q !== current);
  }

  onMount(async () => {
    if (!survey?.questions) return;

    loading = true;

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

    current = survey.questions[0];

    loading = false;
  });

  function previousQuestion() {
    if (!survey?.questions) return;
    const idx = survey.questions.findIndex((q) => q === current);

    return survey.questions[idx - 1];
  }

  function nextQuestion() {
    if (!survey?.questions) return;
    const idx = survey.questions.findIndex((q) => q === current);

    return survey.questions[idx + 1];
  }

  async function saveQuestion(prev?: boolean) {
    if (!current || !survey) return;

    const next = prev ? previousQuestion() : nextQuestion();

    if (prev && !next) return;

    loading = true;

    const response = responses[current.id];
    await api({
      method: "POST",
      endpoint: "responses",
      body: JSON.stringify({
        questionId: current.id,
        surveyId: survey.id,
        respondentId: respondent.id,
        freeformResponse: responses.notes,
        revisionId: respondent.revisionId,
        curratedResponseId: response.response,
      }),
    });

    loading = false;

    if (!prev && !next) confetti();

    if (!prev) current = next;
  }

  async function showCopied() {
    copied = true;
    await new Promise((r) => setTimeout(r, 2000));
    copied = false;
  }

  export { survey, respondent, enabled };
</script>

<div class="stack h-[95%]">
  {#if survey}
    {#if !current}
      <div
        class="mockup-browser bg-sus-primary-45 shadow-md flex flex-col h-full"
      >
        <div class="mockup-browser-toolbar">
          <div class="input !bg-neutral-950/10">Checklist complete</div>
        </div>
        <div class="bg-neutral-50 flex-1 flex flex-col p-4">
          <div class="flex-1 flex items-center justify-center">
            <form
              action="/"
              class="flex flex-1 justify-center items-center gap-4"
              on:submit|preventDefault={() => copy(susURL.href)}
            >
              <span>SUS Survey URL</span>
              <input
                readonly
                type="text"
                placeholder="Make a note.."
                class="input input-bordered flex-1"
                value={susURL.href}
              />
              <button
                data-tip="copied!"
                on:click={showCopied}
                class:tooltip={copied}
                type="submit"
                class="btn btn-primary tooltip-open tooltip-top tooltip-info"
              >
                <iconify-icon class="text-xl" icon="mdi:content-copy"
                ></iconify-icon>
              </button>
            </form>
          </div>
          <footer class="join flex-none justify-self-end my-4 mx-auto">
            <button
              on:click={() => (current = survey.questions[0])}
              class="join-item btn btn-secondary">Start Over</button
            >
          </footer>
        </div>
      </div>
    {:else}
      {@const task = current}
      <form
        on:submit|preventDefault={() => saveQuestion()}
        class="mockup-browser bg-sus-primary-45 shadow-md flex flex-col h-full"
      >
        <div class="mockup-browser-toolbar">
          <div class="input !bg-neutral-950/10">
            {task.group}
          </div>
        </div>
        <div class="bg-neutral-50 flex-1 px-4 flex flex-col items-center gap-4">
          {#if !enabled}
            <div
              data-tip="Checklist will be enabled when recording is started"
              class="tooltip tooltip-secondary tooltip-bottom tooltip-open font-semibold"
            ></div>
          {/if}
          {#if task.imageURL}
            <img
              alt=""
              class:!opacity-5={!enabled}
              class:!pointer-events-none={!enabled}
              src={task.imageURL}
              class="mt-4 h-full min-h-36 max-h-60 rounded-lg overflow-clip shadow-sm flex-none"
            />
          {/if}
          <div
            class:!opacity-5={!enabled}
            class:!pointer-events-none={!enabled}
            class="flex flex-1 flex-col gap-4"
          >
            <h4 class="italic text-center font-thin text-xl">
              Task: {task.text}
            </h4>
            <ul class="join join-vertical xl:join-horizontal mx-auto my-4">
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
            </ul>
            <label class="form-control w-full">
              <div class="label">
                <span class="label-text">Moderator notes</span>
              </div>
              {#if task.id && responses[task.id]}
                <textarea
                  bind:value={responses[task.id].notes}
                  class="textarea textarea-bordered h-40 bg-neutral"
                ></textarea>
              {/if}
            </label>
          </div>
          <footer
            class:!opacity-5={!enabled}
            class:!pointer-event-none={!enabled}
            class="join flex-none justify-self-end my-4 mx-auto"
          >
            <button
              type="submit"
              on:click|preventDefault={() => saveQuestion(true)}
              class="join-item btn btn-secondary">« Prev</button
            >
            <button type="submit" class="join-item btn btn-secondary"
              >Next »</button
            >
          </footer>
        </div>
      </form>
    {/if}
    <div class="bg-neutral-50 shadow-md rounded-box h-full"></div>
    <div class="bg-neutral-50 shadow-md rounded-box h-full"></div>
  {/if}
</div>

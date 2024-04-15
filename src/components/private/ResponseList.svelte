<script lang="ts">
  import {
    removeDuplicatesById,
    orderResponseByNumericalValue,
  } from "@/helpers/order";
  import api from "@/helpers/api";
  import { onMount } from "svelte";
  import type { APIResponses } from "@/helpers/api";
  import Gauge from "@/components/common/Gauge.svelte";
  import CardHeader from "@/components/common/CardHeader.svelte";
  import { susType, taskType, refreshTypes } from "@/stores/types";
  import { calculateSUSScoreFromRespondent } from "@/helpers/score";

  let loading = false;
  let revisionId: string;
  let revision: APIResponses["revisionId"]["GET"];

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

  export { revisionId as revision };
</script>

{#if revision && $susType}
  {@const susSurvey = revision.surveys.find(
    (survey) => survey.scoreTypeId === $susType?.id
  )}
  {@const taskList = revision.surveys.find(
    (survey) => survey.scoreTypeId === $taskType?.id
  )}
  <div
    class:skeleton={loading}
    class="card bg-neutral rounded-lg shadow-sm p-4 w-full"
  >
    <CardHeader icon="mdi:bullhorn-outline" class="mb-4">
      <span>Respondent Responses</span>
      <span slot="sub">
        An individualized SUS score for each respondent along with their
        responses to the survey. It also contains the results of the user test
        task list when applicable.
      </span>
    </CardHeader>
    {#each revision.respondents.filter((r) => r.complete) as respondent, i}
      {@const score = calculateSUSScoreFromRespondent(respondent, $susType.id)}
      <div class="collapse collapse-arrow bg-neutral-50 mb-1">
        <input type="checkbox" checked={i === 0} />
        <div class="collapse-title text-xl font-medium">
          {respondent.email}
        </div>
        <div class="collapse-content bg-sus-surface-80">
          <div role="tablist" class="tabs tabs-boxed bg-sus-surface-80 mt-4">
            <input
              checked
              role="tab"
              type="radio"
              class="tab text-neutral checked:!bg-sus-surface-90"
              aria-label="SUS"
              name={`${respondent.id}_response_display`}
            />
            <div
              role="tabpanel"
              class="tab-content bg-sus-surface-90 text-neutral rounded-box p-6"
            >
              <div class="flex items-center gap-8">
                <table class="table flex-[2] border-neutral-400">
                  <thead>
                    <tr class="text-neutral-50">
                      <th></th>
                      <th>Question</th>
                      <th class="text-center">Response</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#if susSurvey?.questions}
                      {#each susSurvey.questions as question}
                        {@const response = respondent.responses.find(
                          (r) => r.questionId === question.id
                        )}
                        <tr class="text-base font-light border-neutral-600">
                          <th></th>
                          <td class="italic opacity-50">"{question.text}"</td>
                          <td class="text-center font-semibold"
                            >{response?.curratedResponse?.label ??
                              "no response"}</td
                          >
                        </tr>
                      {/each}
                    {/if}
                  </tbody>
                </table>
                <div class="flex-1">
                  <Gauge
                    differential={score - 50}
                    scores={[[50, score], [50]]}
                    keys={[revision.title, "Benchmark"]}
                    differentialSubtitle="to industry benchmark"
                  />
                </div>
              </div>
            </div>
            {#if taskList}
              {@const responses = orderResponseByNumericalValue(
                removeDuplicatesById(
                  taskList.questions.map((q) => q.curratedResponses).flat(2)
                )
              )}
              <input
                role="tab"
                type="radio"
                aria-label="User Test"
                class="tab text-neutral checked:!bg-sus-surface-90"
                name={`${respondent.id}_response_display`}
              />
              <div
                role="tabpanel"
                class="tab-content bg-sus-surface-90 text-neutral rounded-box p-6"
              >
                <table class="table border-neutral-400">
                  <thead>
                    <tr class="text-neutral-50">
                      <th>Task</th>
                      {#each responses as response}
                        <th class="text-center">{response.label}</th>
                      {/each}
                    </tr>
                  </thead>
                  <tbody>
                    {#each taskList.questions as question}
                      {@const answer = respondent.responses.find(
                        (r) => r.questionId === question.id
                      )}
                      <tr
                        class="text-base font-light border-neutral-600 border-b"
                      >
                        <td
                          class="italic opacity-50 border-r border-l border-neutral-600"
                          >"{question.text}"</td
                        >
                        {#each question.curratedResponses as curratedResponse}
                          <td class="border-r border-neutral-600 text-center">
                            <input
                              readonly
                              type="radio"
                              class="radio pointer-events-none"
                              checked={answer?.curratedResponseId ===
                                curratedResponse.id}
                            />
                          </td>
                        {/each}
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  </div>
{/if}

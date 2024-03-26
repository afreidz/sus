<script lang="ts">
  import api from "@/helpers/api";
  import { onMount } from "svelte";
  import type { APIResponses } from "@/helpers/api";
  import Gauge from "@/components/common/Gauge.svelte";
  import { susType, refreshTypes } from "@/stores/types";
  import CardHeader from "@/components/common/CardHeader.svelte";
  import { calculateSUSScoreFromRespondent } from "@/helpers/score";

  let revisionId: string;
  let revision: APIResponses["revisionId"]["GET"];

  onMount(async () => {
    await refreshTypes();
    revision = await api({
      method: "GET",
      endpoint: "revisionId",
      substitutions: { revisionId },
    });
  });

  export { revisionId as revision };
</script>

{#if revision && $susType}
  {@const susSurvey = revision.surveys.find(
    (survey) => survey.scoreTypeId === $susType?.id
  )}
  <div class="card bg-neutral rounded-lg shadow-sm p-4 w-full">
    <CardHeader icon="mdi:bullhorn-outline" class="mb-4">
      <span>Respondent Responses</span>
    </CardHeader>
    {#each revision.respondents.filter((r) => r.complete) as respondent, i}
      {@const score = calculateSUSScoreFromRespondent(respondent)}
      <div class="collapse collapse-arrow bg-neutral-50 mb-1">
        <input type="checkbox" checked={i === 0} />
        <div class="collapse-title text-xl font-medium">
          {respondent.email}
        </div>
        <div
          class="collapse-content bg-sus-surface-90 text-neutral-50 flex gap-8 items-center"
        >
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
                      >{response?.curratedResponse?.label ?? "no response"}</td
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
    {/each}
  </div>
{/if}

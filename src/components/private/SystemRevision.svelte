<script lang="ts">
  import { onMount } from "svelte";
  import type { APIResponses } from "@/helpers/api";
  import Gauge from "@/components/common/Gauge.svelte";
  import { refreshTypes, susType } from "@/stores/types";
  import Invite from "@/components/private/Invite.svelte";
  import { activeRevisionsBySystem } from "@/stores/actives";
  import { calculateAverageScoreForRevision } from "@/helpers/score";
  import SurveyQuestionTable from "@/components/private/SurveyQuestionTable.svelte";

  let susSurvey: (typeof revision)["surveys"][number] | undefined;
  let revision: APIResponses["systemId"]["GET"]["revisions"][number];

  onMount(async () => {
    await refreshTypes();
    susSurvey = revision.surveys.find(
      (survey) => survey.survey.scoreTypeId === susType.get()?.id
    );
  });

  export { revision };
</script>

<div
  role="tabpanel"
  id={revision.id}
  class:flex={$activeRevisionsBySystem[revision.systemId] === revision.id}
  class:hidden={$activeRevisionsBySystem[revision.systemId] !== revision.id}
  class="flex gap-8 flex-1"
>
  <div class="flex-1 flex justify-center max-w-xl">
    <SurveyQuestionTable revisionId={revision.id} />
  </div>
  {#if susSurvey}
    {@const average = calculateAverageScoreForRevision(
      revision.respondents.filter(
        (r) => r.complete && r.surveyId === susSurvey?.surveyId
      )
    )}
    {console.log(average)}
    <div class="flex flex-col gap-6">
      <Gauge
        labelClass="w-11"
        revision={revision.title}
        differential={average - 50}
        scores={[[50, average], [50]]}
      />
      <Invite revision={revision.id} survey={susSurvey.surveyId} />
    </div>
  {/if}
</div>

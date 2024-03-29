<script lang="ts">
  import type { APIResponses } from "@/helpers/api";
  import Gauge from "@/components/common/Gauge.svelte";
  import Invite from "@/components/private/Invite.svelte";
  import { activeRevisionsBySystem } from "@/stores/actives";
  import CardHeader from "@/components/common/CardHeader.svelte";
  import { calculateAverageSUSScore } from "@/helpers/score";
  import ResponseList from "@/components/private/ResponseList.svelte";
  import SurveyQuestionTable from "@/components/private/SurveyQuestionTable.svelte";

  let average = 0;
  let susSurvey: (typeof revision)["surveys"][number];
  let revision: APIResponses["systemId"]["GET"]["revisions"][number];

  $: if (susSurvey && susSurvey.scoreTypeId) {
    average = calculateAverageSUSScore(
      revision.respondents.filter(
        (r) => r.complete && r.surveyId === susSurvey.id
      ),
      susSurvey.scoreTypeId
    );
  }

  export { revision, susSurvey as survey };
</script>

<div
  role="tabpanel"
  id={revision.id}
  class:flex={$activeRevisionsBySystem[revision.systemId] === revision.id}
  class:hidden={$activeRevisionsBySystem[revision.systemId] !== revision.id}
  class="flex gap-8 flex-1 flex-wrap max-w-6xl"
>
  <div class="flex flex-1 flex-col gap-6">
    <div class="card bg-neutral rounded-lg shadow-sm p-4 w-full">
      <CardHeader icon="mdi:speedometer" class="mb-4">
        <span>Score for revision</span>
        <span slot="sub"
          >The raw SUS score based on completed respondents for <strong
            >"{revision.title}"</strong
          > compared to the industry SUS benchmark</span
        >
      </CardHeader>
      <Gauge
        differential={average - 50}
        scores={[[50, average], [50]]}
        keys={[revision.title, "Benchmark"]}
        differentialSubtitle="to industry benchmark"
      />
    </div>
    <Invite revision={revision.id} survey={susSurvey.id} />
  </div>
  <div class="flex-1 flex justify-center">
    <SurveyQuestionTable revisionId={revision.id} />
  </div>
  <div class="w-full">
    <ResponseList revision={revision.id} />
  </div>
</div>

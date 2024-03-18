<script lang="ts">
  import { onMount } from "svelte";
  import { refreshTypes, susType } from "@/stores/types";
  import type { APIResponses } from "@/helpers/api";
  import Gauge from "@/components/common/Gauge.svelte";
  import Invite from "@/components/private/Invite.svelte";
  import { activeRevisionsBySystem } from "@/stores/actives";
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
    <Invite revision={revision.id} survey={susSurvey.surveyId} />
  {/if}
</div>

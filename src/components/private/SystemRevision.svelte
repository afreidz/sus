<script lang="ts">
  import api from "@/helpers/api";
  import { onMount } from "svelte";
  import type { APIResponses } from "@/helpers/api";
  import Gauge from "@/components/common/Gauge.svelte";
  import { susType, checklistType } from "@/stores/types";
  import Invite from "@/components/private/Invite.svelte";
  import { activeRevisionsBySystem } from "@/stores/actives";
  import { calculateAverageSUSScore } from "@/helpers/score";
  import CardHeader from "@/components/common/CardHeader.svelte";
  import ResponseList from "@/components/private/ResponseList.svelte";
  import SystemSidebar from "@/components/private/SystemSidebar.svelte";
  import SurveyQuestionTable from "@/components/private/SurveyQuestionTable.svelte";

  let loading: boolean = false;
  let active: string | undefined;
  let hasChecklist: boolean = false;
  let system: APIResponses["systemId"]["GET"];
  let sus: APIResponses["types"]["GET"][number];

  $: if (active) {
    const revision = system.revisions.find((r) => r.id === active);
    if (revision) activeRevisionsBySystem.setKey(revision.systemId, active);
  }

  $: if (sus) {
    susType.set(sus);
  }

  $: if ($checklistType && $activeRevisionsBySystem[system.id]) {
    const revision = system.revisions.find(
      (r) => r.id === $activeRevisionsBySystem[system.id]
    );
    if (revision) {
      hasChecklist = !!revision.surveys.find(
        (s) => s.scoreTypeId === $checklistType.id
      );
    }
  }

  onMount(async () => {
    if (window.location.hash) {
      const id = window.location.hash.replace("#", "");
      const revision = system.revisions.find((r) => r.id === id);
      active = revision?.id;
    }
  });

  async function refreshSystem() {
    loading = true;
    system = await api({
      method: "GET",
      endpoint: "systemId",
      substitutions: { systemId: system.id },
    });
    loading = false;

    const revToActivate = system.revisions
      .map((r) => r.id)
      .includes($activeRevisionsBySystem[system.id])
      ? $activeRevisionsBySystem[system.id]
      : system.revisions[0]?.id;

    if (revToActivate) activeRevisionsBySystem.setKey(system.id, revToActivate);
  }

  export { active, system, sus };
</script>

<SystemSidebar bind:system on:update={refreshSystem} />

{#each system.revisions as revision}
  {@const susSurvey = revision.surveys.find(
    (s) => s.scoreTypeId === $susType?.id
  )}
  {#if susSurvey}
    <div
      class:flex={$activeRevisionsBySystem[revision.systemId] === revision.id}
      class:hidden={$activeRevisionsBySystem[revision.systemId] !== revision.id}
      class="flex gap-8 flex-1 flex-wrap max-w-6xl"
    >
      <div class="flex flex-1 gap-6">
        <div
          class="card bg-neutral rounded-lg shadow-sm p-4 w-full flex flex-col"
        >
          <CardHeader icon="mdi:speedometer" class="mb-4 flex-none">
            <span>Score for revision</span>
            <span slot="sub"
              >The raw SUS score based on completed respondents for <strong
                >"{revision.title}"</strong
              > compared to the industry SUS benchmark</span
            >
          </CardHeader>
          <div class="flex-1 flex items-center justify-center">
            {#if revision.respondents.filter((r) => r.complete).length && $susType?.id}
              {@const survey = revision.surveys.find(
                (s) => s.scoreTypeId === $susType.id
              )}
              {@const average = calculateAverageSUSScore(
                revision.respondents.filter((r) => r.complete),
                survey?.id
              )}
              <Gauge
                class="flex-1"
                differential={average - 50}
                scores={[[50, average], [50]]}
                keys={[revision.title, "Benchmark"]}
                differentialSubtitle="to industry benchmark"
              />
            {:else}
              <strong
                class="uppercase text-center font-semibold opacity-30 text-balance px-4"
                >There have been no submitted responses for this revision yet</strong
              >
            {/if}
          </div>
        </div>
        <Invite
          {revision}
          survey={susSurvey.id}
          on:update={refreshSystem}
          bind:hasChecklist
        />
      </div>
      <div class="w-full flex flex-col gap-8">
        {#if revision.respondents.filter((r) => r.complete).length}
          <ResponseList revision={revision.id} />
        {/if}

        {#if revision.surveys.length && $activeRevisionsBySystem[revision.systemId] === revision.id && $susType?.id}
          {@const susSurvey = revision.surveys.find(
            (s) => s.scoreTypeId === $susType?.id
          )}
          <SurveyQuestionTable
            survey={susSurvey}
            respondents={revision.respondents.filter((r) => r.complete)}
          />
        {/if}
      </div>
    </div>
  {/if}
{/each}

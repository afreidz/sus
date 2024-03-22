<script lang="ts">
  import { onMount } from "svelte";
  import type { APIResponses } from "@/helpers/api";
  import Gauge from "@/components/common/Gauge.svelte";
  import { susType, refreshTypes } from "@/stores/types";
  import { calculateAverageSUSScore } from "@/helpers/score";

  let average = 0;
  let systemCount = 0;
  let clientCount = 0;
  let responseCount = 0;
  let clients: APIResponses["clients"]["GET"];
  let respondents: APIResponses["nonCurrentSUSRespondents"]["GET"];

  onMount(refreshTypes);

  $: if (clients.length) {
    clientCount = clients.length;

    systemCount = clients.reduce((count, client) => {
      return (count += client.systems.length);
    }, 0);

    responseCount = clients.reduce((count, client) => {
      return (count += client.systems.reduce((scount, system) => {
        return (scount += system.revisions.reduce((rcount, revision) => {
          return (rcount += revision.respondents.filter(
            (r) => r.complete
          ).length);
        }, 0));
      }, 0));
    }, 0);
  }

  $: console.log($susType, respondents, clients);

  $: if ($susType?.id && respondents.length) {
    average = calculateAverageSUSScore(respondents);
  }

  export { respondents, clients };
</script>

<div class="stats shadow bg-primary text-primary-content">
  <div class="stat">
    <div class="stat-title text-primary-content/50">Clients</div>
    <div class="stat-value text-secondary">
      {clientCount}
    </div>
  </div>
  <div class="stat">
    <div class="stat-title text-primary-content/50">Systems</div>
    <div class="stat-value text-secondary">{systemCount}</div>
  </div>
  <div class="stat">
    <div class="stat-title text-primary-content/50">Responses</div>
    <div class="stat-value text-secondary">{responseCount}</div>
  </div>
  <div class="stat">
    <div class="stat-title text-primary-content/50">Practice Average</div>
    <div class="stat-value flex justify-center p-3">
      <Gauge
        hideLabels
        class="w-20"
        hideFullscreen
        thickness={1000}
        differential={average}
        scores={[[50, average]]}
      />
    </div>
  </div>
</div>

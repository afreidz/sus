<script lang="ts">
  import type { APIResponses } from "@/api/types";

  export let respondents: APIResponses["revisionId"]["GET"]["Respondent"] = [];
</script>

<h4 class="label">
  <span class="label-text">Respondents</span>
</h4>
<ul class="w-full max-w-lg">
  {#each respondents as respondent}
    <li class="bg-neutral-50 rounded-lg mb-1 p-3">{respondent.email}</li>
  {/each}
</ul>

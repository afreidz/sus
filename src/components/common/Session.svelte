<script lang="ts">
  import type { APIResponses } from "@/helpers/api";
  import CameraPair from "@/components/common/CameraPair.svelte";

  let sessionHostId: string;
  let participantURL: string;
  let type: "moderator" | "participant";
  let revision: APIResponses["revisionId"]["GET"];
  let respondent: APIResponses["respondentId"]["GET"];

  $: if (respondent.id && revision.id) {
    const url = new URL(window.location.origin);
    url.pathname = `/sessions/${revision.id}/${respondent.id}/participant`;
    participantURL = url.href;
    sessionHostId = `host${revision.id}host`;
  }

  export { type, revision, respondent };
</script>

<div class="flex flex-1">
  <div class="flex-1">
    <span>Screen share goes here</span>
  </div>
  <div class="flex-1 max-w-[35%]">
    {#if type === "moderator"}
      <CameraPair id={sessionHostId} type="host" />
    {:else}
      <CameraPair type="participant" hostId={sessionHostId} />
    {/if}
  </div>
</div>

{#if type === "moderator" && participantURL}
  <a target="_blank" class="flex-none" href={participantURL}>{participantURL}</a
  >
{/if}

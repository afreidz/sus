<script lang="ts">
  import type { APIResponses } from "@/helpers/api";
  import session, { connect } from "@/stores/session";
  import CameraPair from "@/components/common/CameraPair.svelte";
  import ScreenShare from "@/components/public/ScreenShare.svelte";

  let host: string;
  let participantURL: string;
  let type: "moderator" | "participant";
  let revision: APIResponses["revisionId"]["GET"];
  let respondent: APIResponses["respondentId"]["GET"];

  $: if (revision && !host) host = `host${revision.id}host`;

  $: if (!$session && host) connect(type === "moderator" ? host : undefined);

  $: if (respondent.id && revision.id) {
    const url = new URL(window.location.origin);
    url.pathname = `/sessions/${revision.id}/${respondent.id}/participant`;
    participantURL = url.href;
  }

  export { type, revision, respondent };
</script>

<div class="flex flex-1">
  <div class="flex-1">
    <ScreenShare
      {host}
      session={$session}
      type={type === "moderator" ? "host" : "participant"}
    />
  </div>
  <div class="flex-1 max-w-[35%]">
    <CameraPair
      {host}
      session={$session}
      type={type === "moderator" ? "host" : "participant"}
    />
  </div>
</div>

{#if type === "moderator" && participantURL}
  <a target="_blank" class="flex-none" href={participantURL}>{participantURL}</a
  >
{/if}

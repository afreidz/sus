<script lang="ts">
  import { onMount } from "svelte";
  import copy from "clipboard-copy";
  import type { APIResponses } from "@/helpers/api";
  import session, { connect } from "@/stores/session";
  import CameraPair from "@/components/common/CameraPair.svelte";
  import ScreenShare from "@/components/public/ScreenShare.svelte";

  let host: string;
  let size: number;
  let showLink = false;
  let showCopied = false;
  let container: HTMLElement;
  let participantURL: string;
  let type: "moderator" | "participant";
  let revision: APIResponses["revisionId"]["GET"];
  let respondent: APIResponses["respondentId"]["GET"];

  onMount(() => {
    if (type === "moderator") showLink = true;
  });

  $: if (revision && !host) host = `host${revision.id}host`;
  $: if (!$session) connect(type === "moderator" ? host : undefined);

  $: if (respondent.id && revision.id) {
    const url = new URL(window.location.origin);
    url.pathname = `/sessions/${revision.id}/${respondent.id}/participant`;
    participantURL = url.href;
  }

  $: if (container) size = container.getBoundingClientRect().height / 2;
  $: if (showCopied) setTimeout(() => (showCopied = false), 3000);

  export { type, revision, respondent };
</script>

<div
  bind:this={container}
  class={`flex-1 grid grid-rows-2 grid-cols-[auto,700px] ${type === "moderator" ? "max-h-[calc(100vh_-_64px)]" : "max-h-screen"} `}
>
  <div class="row-span-2 relative">
    {#if showLink}
      <div
        class="absolute z-10 top-1/2 left-1/2 -translate-x-1/2 flex items-end gap-2"
      >
        <label class="form-control w-full min-w-[500px]">
          <div class="label">
            <span class="label-text">Participant URL</span>
          </div>
          <input
            type="text"
            bind:value={participantURL}
            class="input input-bordered w-full"
          />
        </label>
        <div
          class:tooltip={showCopied}
          class:tooltip-open={showCopied}
          class="tooltip-secondary"
          data-tip="copied"
        >
          <button
            on:click={() => {
              copy(participantURL);
              showCopied = true;
            }}
            class="btn">Copy</button
          >
        </div>
      </div>
    {/if}
    <ScreenShare
      {host}
      session={$session}
      on:start={() => (showLink = false)}
      type={type === "moderator" ? "host" : "participant"}
    />
  </div>
  <CameraPair
    {size}
    {host}
    session={$session}
    type={type === "moderator" ? "host" : "participant"}
    peerName={type === "participant" ? revision.createdBy : undefined}
    name={type === "moderator" ? revision.createdBy : respondent.email}
  />
</div>

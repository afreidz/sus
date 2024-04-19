<script lang="ts">
  import { onMount } from "svelte";
  import copy from "clipboard-copy";
  import type { APIResponses } from "@/helpers/api";
  import Chat from "@/components/common/Chat.svelte";
  import session, { connect } from "@/stores/_session";
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
  let activeTab: "chat" | "camera" | "transcription" = "camera";

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
  class={`flex-1 grid grid-cols-[auto,700px] ${type === "moderator" ? "max-h-[calc(100vh_-_64px)]" : "max-h-screen"} `}
>
  <div class="relative">
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
  <div class="flex flex-col">
    <header class="flex-none">
      <div role="tablist" class="tabs tabs-boxed">
        <a
          role="tab"
          href="#chat"
          class:tab-active={activeTab === "chat"}
          on:click|preventDefault={() => (activeTab = "chat")}
          class="tab flex items-center justify-center gap-2"
        >
          <iconify-icon class="opacity-30" icon="mdi:chat"></iconify-icon> Chat
        </a>
        <a
          role="tab"
          href="#camera"
          class:tab-active={activeTab === "camera"}
          on:click|preventDefault={() => (activeTab = "camera")}
          class="tab flex items-center justify-center gap-2"
        >
          <iconify-icon class="opacity-30" icon="ph:video-camera-fill"
          ></iconify-icon> Camera
        </a>
        {#if type === "moderator"}
          <a
            role="tab"
            href="#transcription"
            class:tab-active={activeTab === "transcription"}
            on:click|preventDefault={() => (activeTab = "transcription")}
            class="tab flex items-center justify-center gap-2"
          >
            <iconify-icon class="opacity-30" icon="mdi:transcribe-close"
            ></iconify-icon> Transcription
          </a>
        {/if}
      </div>
    </header>
    <div bind:this={container} class="flex-1 flex flex-col bg-neutral-950">
      <div class="flex-1 flex flex-col" class:hidden={activeTab !== "camera"}>
        <CameraPair
          {size}
          {host}
          session={$session}
          type={type === "moderator" ? "host" : "participant"}
          name={type === "moderator" ? revision.createdBy : respondent.email}
          peerName={type === "participant"
            ? revision.createdBy
            : respondent.email}
        />
      </div>
      <div class="flex-1 flex flex-col" class:hidden={activeTab !== "chat"}>
        <Chat
          session={$session}
          {host}
          type={type === "moderator" ? "host" : "participant"}
          name={type === "moderator" ? revision.createdBy : respondent.email}
        />
      </div>
    </div>
  </div>
</div>

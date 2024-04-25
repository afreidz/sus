<script lang="ts">
  import session, {
    connect,
    startRecording,
    initTranscriber,
    initLocalCamera,
  } from "@/stores/session";
  import { onMount } from "svelte";
  import { mute } from "@/helpers/media";
  import type { APIResponses } from "@/helpers/api";
  import SessionTime from "@/components/sessions/Time.svelte";
  import CardHeader from "@/components/common/CardHeader.svelte";
  import HostTools from "@/components/sessions/HostTools.svelte";

  let id: string;
  let sidebar = 600;
  let push: string =
    "https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Fproto%2FAwLTIxmcDcwZVSQcs17uut%2FSafeMe%3Ftype%3Ddesign%26node-id%3D800-7332%26t%3DFms1LfDhexjAWirT-1%26scaling%3Dscale-down%26page-id%3D502%253A96%26starting-point-node-id%3D800%253A7332%26mode%3Ddesign";
  let name: string;
  let shareEnabled = false;
  let participantName: string;
  let localCamera: HTMLVideoElement;
  let screenshare: HTMLVideoElement;
  let remoteCamera: HTMLVideoElement;

  let respondent: APIResponses["respondentId"]["GET"];
  let revision: APIResponses["revisionSurveyType"]["GET"] | null = null;

  onMount(async () => {
    await initLocalCamera(500);

    localCamera.srcObject = $session.streams.cameras?.local
      ? mute($session.streams.cameras.local)
      : null;

    await connect(id, id);
    await initTranscriber();

    remoteCamera.srcObject = $session.streams.cameras?.remote || null;
    screenshare.srcObject = $session.streams.screen || null;
  });

  $: if (revision && respondent) {
    name = revision?.createdBy;
    id = `host${revision.id}host`;
    participantName = respondent.email;
  }

  function pushToParticipant() {
    $session.connections.data?.send({
      type: "push-url",
      url: push,
    });
  }

  export { revision, respondent };
</script>

<div
  class="flex-1 size-full grid grid-row-2 max-h-full grid-cols-[auto,{sidebar}px] p-4 gap-4 items-start"
>
  <header class="max-h-max flex items-center gap-4 h-[19rem]">
    <div class="rounded-box overflow-clip shadow aspect-[2/1] h-full flex">
      <div
        class="aspect-square relative h-full flex items-center justify-center bg-neutral/5"
      >
        <!-- svelte-ignore a11y-media-has-caption -->
        <video
          autoplay
          playsinline
          class="size-full"
          bind:this={remoteCamera}
          class:hidden={!$session.streams.cameras?.remote}
        />
        {#if !$session.streams.cameras?.remote}
          <strong class="uppercase text-neutral/30 font-semibold text-xs">
            Waiting for participant to connect...
          </strong>
        {/if}
        <div
          class="badge glass badge-xs text-neutral absolute bottom-3 right-3"
        >
          {participantName}
        </div>
      </div>
      <div
        class="aspect-square relative h-full flex items-center justify-center bg-neutral/5 border-l-2 border-neutral-950"
      >
        <!-- svelte-ignore a11y-media-has-caption -->
        <video
          muted
          autoplay
          playsinline
          bind:this={localCamera}
          class="size-full"
        />
        <div
          class="badge glass badge-xs text-neutral absolute bottom-3 right-3"
        >
          {name}
        </div>
      </div>
    </div>
  </header>
  <aside
    class="h-[calc(100vh_-_3rem)] card row-span-2 bg-neutral rounded-box shadow-sm flex flex-col"
  >
    <CardHeader class="p-4 flex-none">
      {revision?.system.title}: {revision?.title}
      <span slot="sub"
        >You are moderating a live session with <strong
          >{respondent.email}</strong
        ></span
      >
      <div slot="pull">
        {#if $session.recorder.status === "recording"}
          <SessionTime start={true} />
        {:else}
          <button
            on:click={startRecording}
            class="btn btn-error text-neutral flex items-center"
          >
            <iconify-icon class="text-neutral text-xl" icon="mdi:record"
            ></iconify-icon>
            <span>Start Recording</span>
          </button>
        {/if}
      </div>
    </CardHeader>
    <div class="flex-1 flex flex-col overflow-auto">
      <HostTools survey={revision?.surveys[0]} {respondent} />
    </div>
    <footer class="flex-none p-4">
      <form
        action="/"
        class="flex justify-center gap-4"
        on:submit|preventDefault={pushToParticipant}
      >
        <input
          type="text"
          bind:value={push}
          placeholder="Push url to participant..."
          class="input input-bordered flex-1"
        />
        <button
          disabled={!$session.connections.data}
          type="submit"
          class="btn btn-primary">Push</button
        >
      </form>
    </footer>
  </aside>
  <section
    class="w-full max-h-[70vh] min-h-[30vh] aspect-video relative text-center"
  >
    {#if !shareEnabled}
      <strong
        class:hidden={$session.streams.screen}
        class="relative z-0 top-1/2 m-auto w-1/4 uppercase text-neutral/30 font-semibold text-xl"
      >
        Waiting for participant to connect...
      </strong>
    {/if}
    <!-- svelte-ignore a11y-media-has-caption -->
    <video bind:this={screenshare} muted autoplay playsinline class="size-full"
    ></video>
  </section>
</div>

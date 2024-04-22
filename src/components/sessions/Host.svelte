<script lang="ts">
  import { onMount } from "svelte";
  import type { APIResponses } from "@/helpers/api";
  import { downloadSessionVideos } from "@/helpers/media";
  import CardHeader from "@/components/common/CardHeader.svelte";

  import session, {
    connect,
    stopRecording,
    startRecording,
  } from "@/stores/session";

  let id: string;
  let name: string;
  let recording: string;
  let downloading = false;
  let camsEnabled = false;
  let shareEnabled = false;
  let recordingReady = false;
  let participantName: string;
  let localCamera: HTMLVideoElement;
  let screenshare: HTMLVideoElement;
  let remoteCamera: HTMLVideoElement;
  let recordedVideo: HTMLVideoElement;

  let revision: APIResponses["revisionId"]["GET"];
  let respondent: APIResponses["respondentId"]["GET"];

  onMount(() => connect(id, id));

  $: name = revision.createdBy;
  $: id = `host${revision.id}host`;
  $: participantName = respondent.email;

  $: if ($session.cameras.muted && localCamera) {
    localCamera.srcObject = $session.cameras.muted;
  }

  $: if ($session.cameras.remote && remoteCamera) {
    remoteCamera.srcObject = $session.cameras.remote;
  }

  $: if ($session.cameras.remote && $session.cameras.muted && !camsEnabled) {
    camsEnabled = true;
  }

  $: if ($session.screen && screenshare && !shareEnabled) {
    screenshare.srcObject = $session.screen;
    shareEnabled = true;
  }

  $: if (shareEnabled && camsEnabled) recordingReady = true;

  function toggleRecording() {
    if ($session.recorder.status === "recording") return stopRecording();
    return startRecording();
  }

  async function download() {
    if (!$session.recorder.recordings?.length)
      throw new Error("No recordings to download");
    downloading = true;
    await downloadSessionVideos($session.recorder.recordings);
    downloading = false;
  }

  export { revision, respondent };
</script>

<div
  class="flex-1 size-full grid grid-row-2 grid-cols-[auto,600px] gap-4 p-4 items-end"
>
  <header class="max-h-max">
    <div
      class:hidden={!camsEnabled}
      class="rounded-box overflow-clip shadow aspect-[2/1] h-[19rem] flex"
    >
      <div class="aspect-square relative h-full">
        <!-- svelte-ignore a11y-media-has-caption -->
        <video autoplay bind:this={remoteCamera} class="size-full" />
        <div class="badge glass badge-lg text-neutral absolute top-3 left-3">
          {participantName}
        </div>
      </div>
      <div class="aspect-square relative h-full">
        <!-- svelte-ignore a11y-media-has-caption -->
        <video autoplay bind:this={localCamera} class="size-full" />
        <div class="badge glass badge-lg text-neutral absolute top-3 right-3">
          {name}
        </div>
      </div>
    </div>
  </header>
  <aside
    class="w-[600px] card row-span-2 bg-neutral rounded-box shadow-sm h-full flex flex-col"
  >
    <CardHeader class="p-4">
      {revision.system.title}: {revision.title}
      <span slot="sub"
        >You are moderating a live session with <strong
          >{respondent.email}</strong
        ></span
      >
      <button
        slot="pull"
        on:click={toggleRecording}
        disabled={!recordingReady}
        class="btn flex items-center justify-center gap-1"
      >
        {#if $session.recorder.status === "recording"}
          <div class="badge badge-error badge-sm aspect-square">
            <iconify-icon class="text-neutral" icon="mdi:stop"></iconify-icon>
          </div>
          <span>Timestamp</span>
        {:else}
          <div
            class:opacity-50={!$session.recorder.status ||
              $session.recorder.status === "inactive"}
            class="badge badge-error badge-sm aspect-square"
          >
            <iconify-icon class="text-neutral" icon="mdi:record"></iconify-icon>
          </div>
          <span>Start Recording</span>
        {/if}
      </button>
    </CardHeader>
    <div class="p-4">
      {#if $session.recorder.recordings?.length}
        <button
          on:click={download}
          disabled={downloading}
          class="btn btn-primary"
        >
          Download Session Videos
        </button>
      {/if}
    </div>
  </aside>
  <section
    class="w-full max-h-[70vh] min-h-[30vh] aspect-video relative text-center"
  >
    {#if !shareEnabled}
      <strong
        class="relative z-0 m-auto w-1/4 uppercase text-neutral/30 font-semibold text-xl"
      >
        Waiting for participant to connect...
      </strong>
    {/if}
    <!-- svelte-ignore a11y-media-has-caption -->
    {#if !recording}
      <video bind:this={screenshare} autoplay class="size-full"></video>
    {:else}
      <video
        controls
        bind:this={recordedVideo}
        src={recording}
        class="size-full"
      ></video>
    {/if}
  </section>
</div>

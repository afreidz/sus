<script lang="ts">
  import { onMount } from "svelte";
  import type { APIResponses } from "@/helpers/api";
  import CardHeader from "@/components/common/CardHeader.svelte";
  import session, { RECORDING_OPTS, connect } from "@/stores/session";
  import { combineAllStreams, combineCameraStreams } from "@/helpers/media";

  let id: string;
  let name: string;
  let recording: string;
  let camsEnabled = false;
  let shareEnabled = false;
  let participantName: string;
  let cameras: HTMLVideoElement;
  let screenshare: HTMLVideoElement;
  let recordedVideo: HTMLVideoElement;

  let revision: APIResponses["revisionId"]["GET"];
  let respondent: APIResponses["respondentId"]["GET"];

  onMount(() => connect(id, id));

  $: name = revision.createdBy;
  $: id = `host${revision.id}host`;
  $: participantName = respondent.email;

  $: if (
    cameras &&
    !camsEnabled &&
    $session.media.remote?.camera &&
    $session.media.local?.camera?.muted
  )
    initCameras();

  $: if ($session.media.remote?.screen && screenshare && !shareEnabled) {
    screenshare.srcObject = $session.media.remote.screen;
    shareEnabled = true;
  }

  $: if (
    !$session.record.ready &&
    $session.media.remote?.camera &&
    $session.media.remote?.screen &&
    $session.media.local?.camera?.unmuted
  )
    initRecording();

  async function initCameras() {
    if (
      !$session.media.remote?.camera ||
      !$session.media.local?.camera?.muted ||
      !cameras
    )
      throw new Error("Cameras initialize before all streams are ready.");

    const cameraStream = await combineCameraStreams(
      $session.media.remote.camera,
      $session.media.local.camera.muted,
      400
    );

    cameras.srcObject = cameraStream;
    camsEnabled = true;
  }

  async function initRecording() {
    if (
      !$session.media.remote?.camera ||
      !$session.media.remote.screen ||
      !$session.media.local?.camera?.unmuted
    )
      throw new Error("Recording initialized before all streams are ready");

    const compositeStream = await combineAllStreams(
      $session.media.remote.screen,
      $session.media.remote.camera,
      $session.media.local.camera.unmuted
    );

    session.setKey("media.composite", compositeStream);

    const recorder = new MediaRecorder(compositeStream, RECORDING_OPTS);
    session.setKey("record.recorder", recorder);
    session.setKey("record.ready", true);
  }

  export { revision, respondent };
</script>

<div
  class="flex-1 size-full grid grid-row-2 grid-cols-[auto,600px] gap-4 p-4 items-end"
>
  <header class="max-h-max">
    <div
      class:hidden={!camsEnabled}
      class="rounded-box overflow-clip shadow aspect-[2/1] h-[19rem] relative"
    >
      <!-- svelte-ignore a11y-media-has-caption -->
      <video autoplay bind:this={cameras} class="size-full" />
      <div class="badge glass badge-lg text-neutral absolute top-3 left-3">
        {participantName}
      </div>
      <div class="badge glass badge-lg text-neutral absolute top-3 right-3">
        {name}
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
        class="btn flex items-center justify-center gap-1"
        disabled={!$session.record.ready}
      >
        {#if $session.record.enabled}
          <div class="badge badge-error badge-sm aspect-square">
            <iconify-icon class="text-neutral" icon="mdi:stop"></iconify-icon>
          </div>
          <span>Timestamp</span>
        {:else}
          <div
            class:opacity-50={!$session.record.ready}
            class="badge badge-error badge-sm aspect-square"
          >
            <iconify-icon class="text-neutral" icon="mdi:record"></iconify-icon>
          </div>
          <span>Start Recording</span>
        {/if}
      </button>
    </CardHeader>
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

<script lang="ts">
  import { onMount } from "svelte";
  import session, { connect } from "@/stores/session";
  import {
    initLocalCamera,
    combineCameraStreams,
    combineAllStreams,
    recordStreamFor10Seconds,
  } from "@/helpers/media";

  let id: string;
  let name: string;
  let camsEnabled = false;
  let shareEnabled = false;
  let recorderReady = false;
  let participantName: string;
  let cameras: HTMLVideoElement;
  let screenshare: HTMLVideoElement;
  let recordedVideo: HTMLVideoElement;
  let recording: string;

  onMount(async () => {
    const cams = await initLocalCamera(500);
    if (cams.muted) session.setKey("media.local.camera.muted", cams.muted);
    if (cams.unmuted)
      session.setKey("media.local.camera.unmuted", cams.unmuted);
    await connect(id, id);
  });

  $: if (
    $session.media.remote?.camera &&
    $session.media.local?.camera?.muted &&
    cameras &&
    !camsEnabled
  ) {
    combineCameraStreams(
      $session.media.remote.camera,
      $session.media.local.camera.muted,
      400
    ).then((stream) => {
      cameras.srcObject = stream;
      camsEnabled = true;
    });
  }

  $: if ($session.media.remote?.screen && screenshare && !shareEnabled) {
    screenshare.srcObject = $session.media.remote.screen;
    shareEnabled = true;
  }

  $: if (
    $session.media.remote?.screen &&
    $session.media.remote.camera &&
    $session.media.local?.camera?.unmuted &&
    !recorderReady
  ) {
    combineAllStreams(
      $session.media.remote.screen,
      $session.media.remote.camera,
      $session.media.local.camera.unmuted
    ).then(async (stream: MediaStream) => {
      recorderReady = true;
      recording = await recordStreamFor10Seconds(
        new MediaRecorder(stream, {
          audioBitsPerSecond: 128000,
          videoBitsPerSecond: 2500000,
          mimeType: "video/webm",
        })
      );
    });
  }

  export { id, name, participantName };
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
    class="w-[600px] card row-span-2 bg-neutral rounded-box shadow-sm h-full"
  ></aside>
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

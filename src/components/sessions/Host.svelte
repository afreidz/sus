<script lang="ts">
  import { onMount } from "svelte";
  import type { APIResponses } from "@/helpers/api";
  import SessionTime from "@/components/sessions/Time.svelte";
  import { downloadSessionVideos, mute } from "@/helpers/media";
  import CardHeader from "@/components/common/CardHeader.svelte";
  import HostTools from "@/components/sessions/HostTools.svelte";

  import session, {
    connect,
    initTranscriber,
    initLocalCamera,
  } from "@/stores/session";

  let id: string;
  let push: string =
    "https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Fproto%2FAwLTIxmcDcwZVSQcs17uut%2FSafeMe%3Ftype%3Ddesign%26node-id%3D800-7332%26t%3DFms1LfDhexjAWirT-1%26scaling%3Dscale-down%26page-id%3D502%253A96%26starting-point-node-id%3D800%253A7332%26mode%3Ddesign";
  let name: string;
  let working = false;
  let shareEnabled = false;
  let participantName: string;
  let localCamera: HTMLVideoElement;
  let screenshare: HTMLVideoElement;
  let remoteCamera: HTMLVideoElement;

  let revision: APIResponses["revisionId"]["GET"];
  let respondent: APIResponses["respondentId"]["GET"];

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

  $: name = revision.createdBy;
  $: id = `host${revision.id}host`;
  $: participantName = respondent.email;

  async function download() {
    if (!$session.recorder.recordings?.length)
      throw new Error("No recordings to download");
    working = true;
    await downloadSessionVideos($session.recorder.recordings);
    working = false;
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
  class="flex-1 size-full grid grid-row-2 grid-cols-[auto,600px] gap-4 p-4 items-end"
>
  <header class="max-h-max">
    <div class="rounded-box overflow-clip shadow aspect-[2/1] h-[19rem] flex">
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
      <div class="aspect-square relative h-full">
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
    class="w-[600px] card row-span-2 bg-neutral rounded-box shadow-sm h-full flex flex-col"
  >
    <CardHeader class="p-4 flex-none">
      {revision.system.title}: {revision.title}
      <span slot="sub"
        >You are moderating a live session with <strong
          >{respondent.email}</strong
        ></span
      >
      <div slot="pull">
        <SessionTime start={$session.recorder.status === "recording"} />
      </div>
    </CardHeader>
    <div class="flex-1 flex flex-col">
      <HostTools />
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

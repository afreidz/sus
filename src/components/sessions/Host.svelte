<script lang="ts">
  import type { APIResponses } from "@/helpers/api";
  import Lobby from "@/components/sessions/Lobby.svelte";
  import SessionTime from "@/components/sessions/Time.svelte";
  import CardHeader from "@/components/common/CardHeader.svelte";
  import HostTools from "@/components/sessions/HostTools.svelte";
  import { VideoStreamRenderer } from "@azure/communication-calling";
  import session, { disconnect, stopRecording } from "@/stores/session";

  let lobby = true;
  let sidebar = 600;
  let push: string =
    "https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Fproto%2FAwLTIxmcDcwZVSQcs17uut%2FSafeMe%3Ftype%3Ddesign%26node-id%3D800-7332%26t%3DFms1LfDhexjAWirT-1%26scaling%3Dscale-down%26page-id%3D502%253A96%26starting-point-node-id%3D800%253A7332%26mode%3Ddesign";
  let participantURL: URL;
  let localCamera: HTMLElement;
  let screenshare: HTMLElement;
  let remoteCamera: HTMLElement;

  let localCamInitialized = false;
  let remoteCamInitialized = false;
  let remoteScreenInitialized = false;

  let respondent: APIResponses["respondentId"]["GET"];
  let revision: APIResponses["revisionSurveyType"]["GET"] | null = null;

  $: if (
    localCamera &&
    $session.local.streams?.camera &&
    !localCamInitialized
  ) {
    console.log($session.local.streams.camera);
    const camera = session.get().local.streams?.camera;

    if (camera) {
      const renderer = new VideoStreamRenderer(camera);
      renderer
        .createView({ isMirrored: false, scalingMode: "Crop" })
        .then((view) => {
          session.setKey("local.camera", view);
          localCamera.appendChild(view.target);
          localCamInitialized = true;
        });
    }
  }

  $: if (remoteCamera && $session.remote.camera && !remoteCamInitialized) {
    const camera = session.get().remote.camera?.target;
    if (camera) {
      remoteCamera.appendChild(camera);
      remoteCamInitialized = true;
    }
  }

  $: if (screenshare && $session.remote.screen && !remoteScreenInitialized) {
    const screen = session.get().remote.screen?.target;
    if (screen) {
      screenshare.appendChild(screen);
      remoteScreenInitialized = true;
    }
  }

  $: if ($session.id) {
    const { id } = session.get();
    participantURL = new URL(
      `/sessions/participant/${respondent.id}`,
      window.location.origin
    );
    participantURL.searchParams.set("session", id);
  }

  function pushToParticipant() {
    const messenger = session.get().local.messenger;

    if (!messenger) throw new Error("Unable to send message");

    messenger.send({
      type: "push-url",
      url: push,
    });
  }

  async function endSession() {
    const messenger = session.get().local.messenger;
    await stopRecording();
    lobby = true;
    messenger?.send({ type: "session-stop" });
    await disconnect();
  }

  export { revision, respondent };
</script>

{#if lobby}
  <Lobby
    role="host"
    {respondent}
    sessionId={$session.id}
    on:close={() => (lobby = false)}
    participantURL={participantURL.href}
  />
{:else}
  <div
    style="grid-template-columns: auto {sidebar}px;"
    class="flex-1 size-full grid grid-row-2 max-h-full p-4 gap-4 items-start"
  >
    <header class="max-h-max flex items-center gap-4 h-[19rem]">
      <div class="rounded-box overflow-clip shadow aspect-[2/1] h-full flex">
        <div
          class="aspect-square relative h-full flex items-center justify-center bg-neutral/5"
        >
          <div
            class="size-full"
            bind:this={remoteCamera}
            class:hidden={!$session.remote.camera}
          ></div>
          {#if !$session.remote.camera}
            <strong class="uppercase text-neutral/30 font-semibold text-xs">
              Waiting for participant to connect...
            </strong>
          {/if}
          <div
            class="badge glass badge-xs text-neutral absolute bottom-3 right-3"
          >
            {respondent.email}
          </div>
        </div>
        <div
          class="aspect-square relative h-full flex items-center justify-center bg-neutral/5 border-l-2 border-neutral-950"
        >
          <div bind:this={localCamera} class="size-full"></div>
          <div
            class="badge glass badge-xs text-neutral absolute bottom-3 right-3"
          >
            {revision?.createdBy}
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
          <SessionTime start={$session.recording.isRecording} />
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
          <button type="submit" class="btn btn-primary">Push</button>
        </form>
      </footer>
    </aside>
    <section
      class="w-full max-h-[70vh] min-h-[30vh] aspect-video relative text-center"
    >
      <strong
        class:hidden={$session.remote.screen}
        class="relative z-0 top-1/2 m-auto w-1/4 uppercase text-neutral/30 font-semibold text-xl"
      >
        Waiting for participant to connect...
      </strong>
      <div bind:this={screenshare} class="size-full"></div>
    </section>

    <div class="absolute bottom-4 left-4 z-10">
      <button
        on:click|preventDefault={() => endSession()}
        class="btn btn-error text-neutral flex items-center"
      >
        <iconify-icon class="text-neutral text-xl" icon="mdi:record"
        ></iconify-icon>
        <span>End Session</span>
      </button>
    </div>
  </div>
{/if}

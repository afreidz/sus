<script lang="ts">
  import session, {
    connectAsHost,
    stopRecording,
    startRecording,
    initTranscriber,
    initLocalCamera,
  } from "@/stores/session";
  import copy from "clipboard-copy";
  import { mute } from "@/helpers/media";
  import type { APIResponses } from "@/helpers/api";
  import SessionTime from "@/components/sessions/Time.svelte";
  import CardHeader from "@/components/common/CardHeader.svelte";
  import HostTools from "@/components/sessions/HostTools.svelte";
  import ConfirmDialog from "@/components/common/ConfirmDialog.svelte";

  let sidebar = 600;
  let push: string =
    "https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Fproto%2FAwLTIxmcDcwZVSQcs17uut%2FSafeMe%3Ftype%3Ddesign%26node-id%3D800-7332%26t%3DFms1LfDhexjAWirT-1%26scaling%3Dscale-down%26page-id%3D502%253A96%26starting-point-node-id%3D800%253A7332%26mode%3Ddesign";
  let copied = false;
  let confirmed = false;
  let shareEnabled = false;
  let localCamera: HTMLVideoElement;
  let screenshare: HTMLVideoElement;
  let remoteCamera: HTMLVideoElement;
  let confirmation: HTMLDialogElement;

  let respondent: APIResponses["respondentId"]["GET"];
  let revision: APIResponses["revisionSurveyType"]["GET"] | null = null;

  $: if (confirmed) initSession();

  async function initSession() {
    await initLocalCamera(500);

    localCamera.srcObject = $session.local.camera
      ? mute($session.local.camera)
      : null;

    await connectAsHost(respondent);
    await initTranscriber();

    remoteCamera.srcObject = $session.remote.camera || null;
    screenshare.srcObject = $session.remote.screen || null;
  }

  function pushToParticipant() {
    $session.connections.data?.send({
      type: "push-url",
      url: push,
    });
  }

  function handleConfirm() {
    console.log(confirmation.returnValue);
    confirmed = true;
  }

  async function showCopied() {
    copied = true;
    await new Promise((r) => setTimeout(r, 2000));
    copied = false;
  }

  export { revision, respondent };
</script>

{#if confirmed}
  <div
    style="grid-template-columns: auto {sidebar}px;"
    class="flex-1 size-full grid grid-row-2 max-h-full p-4 gap-4 items-start"
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
            class:hidden={!$session.remote.camera}
          />
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
          <SessionTime start={$session.status.recording} />
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
          class:hidden={$session.remote.screen}
          class="relative z-0 top-1/2 m-auto w-1/4 uppercase text-neutral/30 font-semibold text-xl"
        >
          Waiting for participant to connect...
        </strong>
      {/if}
      <!-- svelte-ignore a11y-media-has-caption -->
      <video
        bind:this={screenshare}
        muted
        autoplay
        playsinline
        class="size-full"
      ></video>

      <div class="absolute bottom-0 left-4">
        {#if $session.status.recording}
          <button
            on:click={stopRecording}
            class="btn btn-sm btn-error text-neutral flex items-center"
          >
            <iconify-icon class="text-neutral text-xl" icon="mdi:record"
            ></iconify-icon>
            <span>Stop Recording</span>
          </button>
        {:else}
          <button
            on:click={startRecording}
            class="btn btn-sm btn-error text-neutral flex items-center"
          >
            <iconify-icon class="text-neutral text-xl" icon="mdi:record"
            ></iconify-icon>
            <span>Start Recording</span>
          </button>
        {/if}
      </div>
    </section>
  </div>
{:else}
  <ConfirmDialog
    error={false}
    open={!confirmed}
    class="w-3/4 max-w-3xl"
    bind:elm={confirmation}
    on:close={handleConfirm}
    title={`Start a live testing session?`}
  >
    <p>
      You are about to initiate a live testing session with <strong
        >{respondent.email}</strong
      >
    </p>
    <p>
      As part of this session, you will be connected to the participant with
      both audio and video. The participant will also share the contents of
      their screen. The session will be recorded for later use when enabled.
    </p>
    <p>
      Once connected, push the url of the application to the tester and instruct
      them to perform any tasks that appear. Record the results of their tasks
      for each section before moving to the next.
    </p>
    <p>
      Be sure to also include "key moments" where applicable to help identify
      parts of the test that are insightful for Hitachi Solutions, or the
      stakeholders to know about. These key moments will be used to help
      generate clips from the recordings.
    </p>
    <footer class="py-4">
      <form
        action="/"
        class="flex justify-center items-center gap-4"
        on:submit|preventDefault={() =>
          copy(window.location.href.replace("/host", "/participant"))}
      >
        <span>Participant URL</span>
        <input
          readonly
          type="text"
          placeholder="Make a note.."
          class="input input-bordered flex-1"
          value={window.location.href.replace("/host", "/participant")}
        />
        <button
          data-tip="copied!"
          on:click={showCopied}
          class:tooltip={copied}
          type="submit"
          class="btn btn-primary tooltip-open tooltip-top tooltip-info"
        >
          <iconify-icon class="text-xl" icon="mdi:content-copy"></iconify-icon>
        </button>
      </form>
    </footer>
  </ConfirmDialog>
{/if}

<script lang="ts">
  import session, {
    callHost,
    initLocalCamera,
    initScreenShare,
    initTranscriber,
    type DataMessage,
    connectAsParticipant,
  } from "@/stores/session";
  import { mute } from "@/helpers/media";
  import SessionTime from "@/components/sessions/Time.svelte";
  import ConfirmDialog from "@/components/common/ConfirmDialog.svelte";
  import { type APIResponses } from "@/helpers/api";

  let url: string;
  let confirmed = false;
  let camsEnabled = false;
  let screen: HTMLIFrameElement;
  let cameras: HTMLVideoElement;
  let cameraToolTipDismissed = false;
  let confirmation: HTMLDialogElement;
  let respondent: APIResponses["respondentId"]["GET"];

  $: if (confirmed) initSession();

  async function initSession() {
    const screenShare = await initScreenShare();
    const cameraStream = await initLocalCamera(500);

    await connectAsParticipant(respondent);
    await callHost("data");

    if (cameraStream) await callHost("camera", cameraStream);
    if (screenShare) await callHost("screen", screenShare);

    await initTranscriber();

    if (cameraStream && cameras) {
      cameras.srcObject = mute(cameraStream);
      session.setKey("local.camera", cameraStream);
    }

    if ($session.connections.data) {
      $session.connections.data.on("data", (m) =>
        handleMessage(m as DataMessage)
      );
    }

    if ($session.local.composite && cameras && !camsEnabled) {
      cameras.srcObject = $session.local.composite;
      camsEnabled = true;
    }
  }

  function handleConfirm() {
    console.log(confirmation.returnValue);
    confirmed = true;
  }

  function handleMessage(msg: DataMessage) {
    if (msg.type === "push-url" && screen && msg.url) {
      console.log(`Updating stage url to ${msg.url}`);
      url = msg.url;
    } else if (msg.type === "recording-start") {
      console.log("Recording started");
      $session.connections.transcriber?.start();
      session.setKey("status.recording", true);
    } else if (msg.type === "recording-stop") {
      console.log("Recording stopped");
      $session.connections.transcriber?.stop();
      session.setKey("status.recording", false);
    }
  }

  export { respondent };
</script>

{#if confirmed}
  <div
    class="flex-1 flex flex-col mockup-browser border bg-neutral relative z-10"
  >
    <div class="mockup-browser-toolbar relative">
      <div class="input">
        {respondent.revision.system.title}: {respondent.revision.title}
      </div>
      <SessionTime bind:start={$session.status.recording} />
    </div>
    <div class="flex-1 bg-neutral flex flex-col items-center justify-center">
      {#if !url}
        <span class="uppercase text-xl opacity-30 font-semibold"
          >Waiting on the host to push the test application</span
        >
      {/if}
      <iframe
        src={url}
        frameborder="0"
        bind:this={screen}
        class:hidden={!url}
        class="flex-1 size-full"
        title="Host's shared content"
      />
    </div>
    {#if camsEnabled}
      <button
        on:click={() => {
          cameras.requestPictureInPicture();
          cameraToolTipDismissed = true;
        }}
        class:tooltip={!cameraToolTipDismissed}
        class:opacity-30={cameraToolTipDismissed}
        data-tip="The host has enabled cameras. Click here to show the camera feeds."
        class="btn rounded-full tooltip-primary tooltip-left tooltip-open shadow-md glass transition-opacity ease-in-out hover:opacity-75 btn-outline absolute right-3 bottom-3 aspect-square p-0"
      >
        <iconify-icon class="text-2xl" icon="mdi:video-outline"></iconify-icon>
      </button>
    {/if}
  </div>

  <aside
    class:hidden={!$session.local.composite}
    class="absolute right-4 top-4 height-50 rounded-box overflow-clip shadow"
  >
    <!-- svelte-ignore a11y-media-has-caption -->
    <video bind:this={cameras} autoplay class="size-full z-0" />
    <div class="badge glass badge-lg text-neutral absolute top-3 right-3">
      {respondent.email}
    </div>
  </aside>
{/if}

<ConfirmDialog
  class="w-3/4 max-w-2xl"
  error={false}
  open={!confirmed}
  bind:elm={confirmation}
  on:close={handleConfirm}
  confirmText={respondent.email}
  title={`Welcome ${respondent.email}`}
>
  <p>
    You are being asked to participate in a moderated user test for <strong
      >{respondent.revision.system.title}</strong
    >.
  </p>
  <p>
    As part of this test you will soon be connected to a moderator ({respondent
      .revision.createdBy}) who will assist you through the test. It is
    important to note that this test will require you to be on-camera, share the
    contents of your current tab, and to be recorded.
  </p>
  <p>
    Part or all of the recordings may be shared in a readout presentation with
    the stakeholders of this application. If you do not wish to continue, please
    close this tab and contact {respondent.revision.createdBy} to let them know you
    wish not to participate.
  </p>
  <p>
    If you agree to the above, please type: <strong>{respondent.email}</strong> in
    the field below to continue. You will be prompted by your browser to accept access
    to your camera and your current tab for screen share.
  </p>

  <p><strong>Thanks for your participation!</strong></p>
</ConfirmDialog>

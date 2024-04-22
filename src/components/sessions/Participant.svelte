<script lang="ts">
  import SessionTime from "@/components/sessions/Time.svelte";
  import session, { connect, callHost } from "@/stores/session";
  import { initLocalCamera, initScreenShare } from "@/helpers/media";
  import ConfirmDialog from "@/components/common/ConfirmDialog.svelte";

  type PushURLMessage = {
    type: "push-url";
    url: string;
  };

  type RecordingStartMessage = {
    type: "recording-start";
  };

  type RecordingStopMessage = {
    type: "recording-stop";
  };

  type Message = PushURLMessage | RecordingStartMessage | RecordingStopMessage;

  let id: string;
  let url: string;
  let name: string;
  let host: string;
  let title: string;
  let hostName: string;
  let confirmed = false;
  let recording = false;
  let camsEnabled = false;
  let screen: HTMLIFrameElement;
  let cameras: HTMLVideoElement;
  let confirmation: HTMLDialogElement;

  $: if (confirmed) initSession();

  $: if ($session.cameras.composite && cameras && !camsEnabled) {
    cameras.srcObject = $session.cameras.composite;
    camsEnabled = true;
  }

  async function initSession() {
    await connect(id, host);
    const screenShare = await initScreenShare();
    const cameraFeeds = await initLocalCamera(500);

    callHost("data");

    if (cameraFeeds.muted && cameras) {
      cameras.srcObject = cameraFeeds.muted;
      session.setKey("cameras.muted", cameraFeeds.muted);
    }

    if (cameraFeeds.unmuted)
      session.setKey("cameras.unmuted", cameraFeeds.unmuted);

    if (cameraFeeds.unmuted) callHost("camera", cameraFeeds.unmuted);
    if (screenShare) callHost("screen", screenShare);
  }

  $: $session.connections.data?.on("data", (m) => handleMessage(m as Message));

  function handleConfirm() {
    console.log(confirmation.returnValue);
    confirmed = true;
  }

  function handleMessage(msg: Message) {
    if (msg.type === "push-url" && screen && msg.url) {
      console.log(`Updating stage url to ${msg.url}`);
      url = msg.url;
    } else if (msg.type === "recording-start") {
      console.log("Recording started");
      recording = true;
    } else if (msg.type === "recording-stop") {
      console.log("Recording stopped");
      recording = false;
    }
  }

  export { id, host, title, name, hostName };
</script>

{#if confirmed}
  <div
    class="flex-1 flex flex-col mockup-browser border bg-neutral relative z-10"
  >
    <div class="mockup-browser-toolbar relative">
      <div class="input">{title}: {name}</div>
      <SessionTime bind:start={recording} />
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
        on:click={() => cameras.requestPictureInPicture()}
        class="btn rounded-full shadow-md glass opacity-30 transition-opacity ease-in-out hover:opacity-75 btn-outline absolute right-3 bottom-3 aspect-square p-0"
      >
        <iconify-icon class="text-2xl" icon="mdi:video-outline"></iconify-icon>
      </button>
    {/if}
  </div>

  <aside
    class:hidden={!$session.cameras.muted}
    class="absolute right-4 top-4 height-50 rounded-box overflow-clip shadow"
  >
    <!-- svelte-ignore a11y-media-has-caption -->
    <video bind:this={cameras} autoplay class="size-full z-0" />
    <div class="badge glass badge-lg text-neutral absolute top-3 right-3">
      {name}
    </div>
  </aside>
{/if}

<ConfirmDialog
  class="w-3/4 max-w-2xl"
  error={false}
  open={!confirmed}
  confirmText={name}
  bind:elm={confirmation}
  title={`Welcome ${name}`}
  on:close={handleConfirm}
>
  <p>
    You are being asked to participate in a moderated user test for <strong
      >{title}</strong
    >.
  </p>
  <p>
    As part of this test you will soon be connected to a moderator ({hostName})
    who will assist you through the test. It is important to note that this test
    will require you to be on-camera, share the contents of your current tab,
    and to be recorded.
  </p>
  <p>
    Part or all of the recordings may be shared in a readout presentation with
    the stakeholders of this application. If you do not wish to continue, please
    close this tab and contact {hostName} to let them know you wish not to participate.
  </p>
  <p>
    If you agree to the above, please type: <strong>{name}</strong> in the field
    below to continue. You will be prompted by your browser to accept access to your
    camera and your current tab for screen share.
  </p>

  <p><strong>Thanks for your participation!</strong></p>
</ConfirmDialog>

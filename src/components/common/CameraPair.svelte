<script lang="ts">
  import type Peer from "peerjs";
  import { onMount } from "svelte";
  import { MessageHandler } from "@/stores/messages";

  let container: HTMLElement;
  let localStream: MediaStream;
  let remoteStream: MediaStream;
  let type: "host" | "participant";
  let localCamera: HTMLVideoElement;
  let remoteCamera: HTMLVideoElement;
  let session: Readonly<Peer> | null;
  let host: string | undefined = undefined;
  let deviceId: string | undefined = undefined;
  let availableCameras: MediaDeviceInfo[] = [];

  async function getCameras() {
    await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    availableCameras = (await navigator.mediaDevices.enumerateDevices()).filter(
      (d) => d.kind === "videoinput"
    );
  }

  async function initLocalCamera() {
    const box = container.getBoundingClientRect();
    const width = box.width;
    const height = box.height / 2;
    const aspectRatio = height / width;

    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { deviceId, width, height, aspectRatio },
    });
  }

  async function initRemoteCamera() {
    if (!session) {
      MessageHandler({
        type: "error",
        message: "Unable to connect to session",
      });
      return;
    }

    await initLocalCamera();
    if (type === "host") {
      session.on("call", (call) => {
        if (call.metadata.type === "camera" && remoteCamera) {
          console.log(`Answering camera call from ${call.peer}`);
          call.answer(localStream);
          call.on("stream", (stream) => {
            remoteCamera.srcObject = stream;
          });
        }
      });
    } else if (type === "participant") {
      if (!host)
        return MessageHandler({
          type: "error",
          message: "Unable to connect to host",
        });
      console.log(`Calling host at ${host}`);
      const call = session.call(host, localStream, {
        metadata: { type: "camera" },
      });
      call.on("stream", (stream) => {
        remoteStream = stream;
      });
    }
  }

  onMount(getCameras);

  $: if (deviceId) initRemoteCamera();
  $: if (localStream && localCamera) localCamera.srcObject = localStream;
  $: if (remoteStream && remoteCamera) remoteCamera.srcObject = remoteStream;

  export { type, host, session };
</script>

<div
  bind:this={container}
  class="bg-neutral-950 grid grid-rows-2 w-full h-full"
>
  <div class="flex items-center justify-center relative">
    {#if !deviceId}
      <select
        bind:value={deviceId}
        class="select select-bordered border-neutral focus:border-sus-primary-40 bg-transparent text-neutral w-full max-w-xs"
      >
        <option disabled selected value={undefined}>Choose a camera...</option>
        {#each availableCameras as camera}
          <option value={camera.deviceId}>{camera.label}</option>
        {/each}
      </select>
    {:else}
      <!-- svelte-ignore a11y-media-has-caption -->
      <video autoplay bind:this={localCamera} class="w-full h-full" />
    {/if}
  </div>
  <div class="flex items-center justify-center relative">
    <!-- svelte-ignore a11y-media-has-caption -->
    <video autoplay bind:this={remoteCamera} class="w-full h-full" />
  </div>
</div>

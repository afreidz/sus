<script lang="ts">
  import { onMount } from "svelte";
  import { type PeerOptions } from "peerjs";
  import { MessageHandler } from "@/stores/messages";

  const PEER_OPTS: PeerOptions = {
    //host: "localhost",
    //port: 1999,
    //path: "/sessions"
  };

  let connection: any;
  let container: HTMLElement;
  let localStream: MediaStream;
  let remoteStream: MediaStream;
  let type: "host" | "participant";
  let localCamera: HTMLVideoElement;
  let remoteCamera: HTMLVideoElement;
  let id: string | undefined = undefined;
  let hostId: string | undefined = undefined;
  let deviceId: string | undefined = undefined;
  let availableCameras: MediaDeviceInfo[] = [];

  async function getCameras() {
    availableCameras = (await navigator.mediaDevices.enumerateDevices()).filter(
      (d) => d.kind === "videoinput"
    );
  }

  function connect() {
    // if (connection) return Promise.resolve(connection);
    // return new Promise((r) => {
    //   connection =
    //     type === "host" && id ? new Peer(id, PEER_OPTS) : new Peer(PEER_OPTS);
    //   connection.on("open", (id) => {
    //     console.log(`Connected as: ${id}`);
    //     r(connection);
    //   });
    // });
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
    await connect();
    await initLocalCamera();
    if (type === "host") {
      // connection.on("call", (call) => {
      //   console.log(`Answering`, call.peer);
      //   call.answer(localStream);
      //   call.on("stream", (stream) => {
      //     remoteStream = stream;
      //   });
      // });
    } else if (type === "participant") {
      if (!hostId)
        return MessageHandler({
          type: "error",
          message: "Unable to connect to host",
        });
      // console.log(`Calling host at ${hostId}`);
      // const call = connection.call(hostId, localStream);
      // call.on("stream", (stream) => {
      //   remoteStream = stream;
      // });
    }
  }

  onMount(getCameras);

  $: if (deviceId) initRemoteCamera();
  $: if (localStream && localCamera) localCamera.srcObject = localStream;
  $: if (remoteStream && remoteCamera) remoteCamera.srcObject = remoteStream;

  export { type, id, hostId };
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
      <video autoplay bind:this={localCamera} class="absolute inset-0" />
    {/if}
  </div>
  <div class="flex items-center justify-center relative">
    <!-- svelte-ignore a11y-media-has-caption -->
    <video autoplay bind:this={remoteCamera} class="w-full h-full" />
  </div>
</div>

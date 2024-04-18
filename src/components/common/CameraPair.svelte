<script lang="ts">
  import type Peer from "peerjs";
  import { MessageHandler } from "@/stores/messages";

  type Streams = {
    muted?: MediaStream;
    remote?: MediaStream;
    unmuted?: MediaStream;
  };

  type Elements = {
    localCamera?: HTMLVideoElement;
    remoteCamera?: HTMLVideoElement;
  };

  let name: string;
  let size: number;
  let streams: Streams = {};
  let elements: Elements = {};
  let type: "host" | "participant";
  let session: Readonly<Peer> | null;
  let host: string | undefined = undefined;
  let peerName: string | undefined = undefined;

  async function initLocalCamera() {
    const video = {
      height: size,
      aspectRatio: 1,
      facingMode: "user",
    };

    const muted = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video,
    });

    const unmuted = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video,
    });

    streams.muted = muted;
    streams.unmuted = unmuted;
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
        if (call.metadata.type === "camera") {
          console.log(`Answering camera call from ${call.peer}`);
          call.answer(streams.unmuted);
          call.on("stream", (stream) => {
            streams.remote = stream;
          });
        }
      });
    } else if (type === "participant") {
      if (!host)
        return MessageHandler({
          type: "error",
          message: "Unable to connect to host",
        });

      if (!streams.unmuted)
        return MessageHandler({
          type: "error",
          message: "Unable to send camera feed",
        });

      console.log(`Calling host at ${host} with camera`);
      const call = session.call(host, streams.unmuted, {
        metadata: { type: "camera" },
      });
      call.on("stream", (stream) => {
        streams.remote = stream;
      });
    }
  }

  $: if (session) {
    initRemoteCamera();
  }

  $: if (streams.muted && elements.localCamera) {
    elements.localCamera.srcObject = streams.muted;
  }

  $: if (streams.remote && elements.remoteCamera) {
    elements.remoteCamera.srcObject = streams.remote;
  }

  export { type, host, session, name, size, peerName };
</script>

<div
  class="flex-1 w-full bg-neutral-950 flex items-center justify-center overflow-hidden"
>
  <!-- svelte-ignore a11y-media-has-caption -->
  {#if streams.muted}
    <div
      class="aspect-square max-w-[700px] relative"
      style="max-height: {size}px;"
    >
      <video
        autoplay
        bind:this={elements.localCamera}
        class="aspect-square max-w-[700px]"
      />
      {#if name}
        <div class="badge glass badge-lg text-neutral absolute top-6 right-3">
          {name}
        </div>
      {/if}
    </div>
  {/if}
</div>
<div
  class="flex-1 w-full bg-neutral-950 flex items-center justify-center overflow-hidden"
>
  <!-- svelte-ignore a11y-media-has-caption -->
  <div
    class="aspect-square max-w-[700px] relative"
    style="max-height: {size}px;"
  >
    <video autoplay bind:this={elements.remoteCamera} class="w-full h-full" />
    {#if peerName && streams.remote}
      <div class="badge glass badge-lg text-neutral absolute top-6 right-3">
        {peerName}
      </div>
    {/if}
  </div>
</div>

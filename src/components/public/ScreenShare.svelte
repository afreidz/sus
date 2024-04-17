<script lang="ts">
  import type Peer from "peerjs";
  import { onMount } from "svelte";
  import { MessageHandler } from "@/stores/messages";

  let frame: HTMLElement;
  let aspectRatio: number;
  let stage: HTMLIFrameElement;
  let screen: HTMLVideoElement;
  let type: "host" | "participant";
  let session: Readonly<Peer> | null;
  let host: string | undefined = undefined;

  onMount(async () => {
    await initScreenShare();
  });

  async function initScreenShare() {
    if (!session) {
      MessageHandler({
        type: "error",
        message: "Unable to connect to session",
      });
      return;
    }

    if (type === "host") {
      session.on("call", (call) => {
        if (call.metadata.type === "screen" && screen) {
          console.log(`Answering screen call from ${call.peer}`);
          call.answer();
          call.on("stream", (stream) => {
            console.log(call.metadata);
            // streamToCanvas(stream, call.metadata.dimensions, screen);
            screen.srcObject = stream;
            aspectRatio =
              call.metadata.dimensions.width / call.metadata.dimensions.height;
          });
        }
      });
    } else if (type === "participant") {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: false,
        video: true,
        preferCurrentTab: true,
      } as any);

      if (!host)
        return MessageHandler({
          type: "error",
          message: "Unable to connect to host",
        });

      console.log(`Calling host at ${host}`);
      session.call(host, stream, {
        metadata: {
          type: "screen",
          dimensions: frame.getBoundingClientRect(),
        },
      });
    }
  }

  export { host, type, session };
</script>

<div bind:this={frame} class="h-full w-full flex-1 p-8 grid">
  {#if type === "host"}
    <!-- svelte-ignore a11y-media-has-caption -->
    <!-- <canvas bind:this={screen} class="w-full h-full" /> -->
    <video
      autoplay
      bind:this={screen}
      class="object-cover"
      style="clip-path: inset(0 35.2% 0.2% 0);"
    />
  {:else}
    <div
      class="flex flex-col h-full w-full mockup-browser border bg-sus-primary-60"
    >
      <div class="flex-none mockup-browser-toolbar">
        <div class="input border-neutral/30 !bg-transparent text-neutral/30">
          User Test
        </div>
      </div>
      <div class="flex-1 grid bg-base-200">
        <!-- svelte-ignore a11y-missing-attribute -->
        <iframe bind:this={stage} src="" class="w-full h-full" frameborder="0"
        ></iframe>
      </div>
    </div>
  {/if}
</div>

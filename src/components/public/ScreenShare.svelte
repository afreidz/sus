<script lang="ts">
  import type Peer from "peerjs";
  import { onMount } from "svelte";
  import { MessageHandler } from "@/stores/messages";

  let container: HTMLElement;
  let share: HTMLVideoElement;
  let frame: HTMLIFrameElement;
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
        if (call.metadata.type === "screen" && share) {
          console.log(`Answering screen call from ${call.peer}`);
          call.answer();
          call.on("stream", (stream) => {
            console.log(call.metadata.box);
            share.srcObject = stream;
          });
        }
      });
    } else {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
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
          box: container.getBoundingClientRect(),
        },
      });
    }
  }

  export { host, type, session };
</script>

<div bind:this={container} class="w-full h-full flex flex-1 p-8">
  {#if type === "host"}
    <!-- svelte-ignore a11y-media-has-caption -->
    <video bind:this={share} autoplay class="w-full h-full" />
  {:else}
    <div class="flex flex-1 flex-col mockup-browser border bg-sus-primary-60">
      <div class="flex-none mockup-browser-toolbar">
        <div class="input border-neutral/30 !bg-transparent text-neutral/30">
          User Test
        </div>
      </div>
      <div class="flex flex-1 justify-center px-4 py-16 bg-base-200">
        <!-- svelte-ignore a11y-missing-attribute -->
        <iframe bind:this={frame} src="" class="w-full h-full" frameborder="0"
        ></iframe>
      </div>
    </div>
  {/if}
</div>

<script lang="ts">
  import type Peer from "peerjs";
  import type { DataConnection } from "peerjs";
  import { createEventDispatcher } from "svelte";
  import { MessageHandler } from "@/stores/messages";

  type PushURLMessage = {
    type: "push-url";
    url: string;
  };

  type Message = PushURLMessage;

  let started = false;
  let urlToPush: string;
  let frame: HTMLElement;
  let stage: HTMLIFrameElement;
  let screen: HTMLVideoElement;
  let type: "host" | "participant";
  let handler: (d: unknown) => void;
  let session: Readonly<Peer> | null;
  let host: string | undefined = undefined;
  let dataConnection: DataConnection | undefined = undefined;

  const dispatch = createEventDispatcher();

  $: if (session) initScreenShare();

  async function initScreenShare() {
    if (!session) {
      MessageHandler({
        type: "error",
        message: "Unable to connect to session",
      });
      return;
    }

    if (type === "host") {
      session.on("connection", (con) => {
        con.on("open", () => {
          console.log("Data connection started");
          con.on("data", (m) => handleDataMessage(m as Message));
          dataConnection = con;
        });
      });
      session.on("call", (call) => {
        if (call.metadata.type === "screen" && screen) {
          console.log(`Answering screen call from ${call.peer}`);
          call.answer();
          call.on("stream", (stream) => {
            console.log(call.metadata);
            started = true;
            dispatch("start");
            // streamToCanvas(stream, call.metadata.dimensions, screen);
            screen.srcObject = stream;
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

      console.log(`Calling host at ${host} with screen`);
      session.call(host, stream, {
        metadata: {
          type: "screen",
          dimensions: frame.getBoundingClientRect(),
        },
      });

      const con = session.connect(host);
      con.on("open", () => {
        console.log("Data connection started");
        con.on("data", (m) => handleDataMessage(m as Message));
        dataConnection = con;
      });
    }
  }

  function handleDataMessage(msg: Message) {
    console.log(`Message received: `, msg);
    if (msg.type === "push-url" && stage && msg.url) {
      console.log(`Updating stage url to ${msg.url}`);
      stage.src = msg.url;
    }
  }

  function pushUrl() {
    console.log(`Pushing url ${urlToPush} to paricipant`);
    if (!dataConnection)
      return MessageHandler({
        type: "error",
        message: "Unable to establish data connection",
      });
    dataConnection.send({ type: "push-url", url: urlToPush });
  }

  export { host, type, session };
</script>

<div bind:this={frame} class="h-full w-full flex-1 p-8 flex flex-col">
  {#if type === "host"}
    <!-- svelte-ignore a11y-media-has-caption -->
    <!-- <canvas bind:this={screen} class="w-full h-full" /> -->
    <div class="w-full flex-1 overflow-hidden">
      <video
        autoplay
        bind:this={screen}
        class="w-[calc(100%_+_700px)] max-w-none -ml-8 -mt-8"
        style="clip-path: inset(32px 701px 1px 32px);"
      />
    </div>
    <div
      class="navbar bg-neutral-900/20 glass rounded-box shadow-sm absolute bottom-3 left-3 right-3 px-3"
    >
      <div class="flex-1">
        <div
          class:badge-success={started}
          class:badge-warning={!started}
          class="badge badge-xs mr-2"
        ></div>
        <span
          >{#if started}Connected to participant screen share{:else}Waiting for
            participant to initate share{/if}</span
        >
      </div>
      <form
        on:submit|preventDefault={pushUrl}
        class="flex-none w-1/3 flex gap-2"
      >
        <div class="form-control flex-1">
          <input
            type="text"
            bind:value={urlToPush}
            class="input input-bordered w-full"
            placeholder="Push url to participant"
          />
        </div>
        <button type="submit" class="btn btn-primary flex-none">Send</button>
      </form>
    </div>
  {:else if type === "participant"}
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

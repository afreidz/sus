<script lang="ts">
  import session, {
    init,
    connect,
    type Session,
    startSession,
    captureParticipantImage,
  } from "@/stores/session";

  import { onMount } from "svelte";
  import copy from "clipboard-copy";
  import { createEventDispatcher } from "svelte";
  import type { APIResponses } from "@/helpers/api";

  const dispatch = createEventDispatcher();

  let copied = false;
  let loading = false;
  let connecting = false;
  let localCamera: HTMLElement;
  let remoteCamera: HTMLElement;
  let localCamInitialized = false;
  let remoteCamInitialized = false;
  let role: Session["local"]["role"];
  let sessionId: string | null = null;
  let participantURL: string | undefined = undefined;
  let respondent: APIResponses["respondentId"]["GET"];

  $: if (localCamera && $session.local.camera && !localCamInitialized) {
    const camera = session.get().local.camera?.target;
    if (camera) {
      localCamera.appendChild(camera);
      const video = camera.querySelector("video");
      if (video) video.muted = true;
      localCamInitialized = true;
    }
  }

  $: if (remoteCamera && $session.remote.camera && !remoteCamInitialized) {
    const camera = session.get().remote.camera?.target;
    if (camera) {
      remoteCamera.appendChild(camera);
      remoteCamInitialized = true;
    }
  }

  onMount(async () => {
    if ($session.ended) return;
    loading = true;
    if (!$session.isConnected) await init(role, respondent);
    if (role === "host") await connectToCall();
    loading = false;
  });

  async function showCopied() {
    copied = true;
    await new Promise((r) => setTimeout(r, 2000));
    copied = false;
  }

  async function connectToCall() {
    if (!sessionId) throw new Error("Unable to find session id");

    connecting = true;
    await connect(sessionId);
    connecting = false;
    dispatch("connected");
  }

  export { role, respondent, participantURL, sessionId };
</script>

<dialog open class="modal text-neutral-950">
  <div class="modal-box w-3/4 max-w-6xl">
    <h3 class="font-bold text-lg">
      {$session.ended
        ? "Thanks for your participation!"
        : "Let's connect first..."}"
    </h3>
    <div class="max-w-none flex flex-col items-center justify-center">
      {#if loading}
        <span class="loading loading-spinner loading-lg my-52"></span>
      {:else if $session.ended}
        <strong
          class="uppercase text-neutral-950/30 font-semibold text-xl my-40"
        >
          You may now close this window/tab.
        </strong>
      {:else}
        <header
          class="w-full max-h-max flex items-center justify-center gap-4 h-[19rem] my-8"
        >
          <div
            class="rounded-box overflow-clip shadow aspect-[2/1] h-full flex bg-neutral-950"
          >
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
                  Waiting for {role === "host" ? "participant" : "host"} to connect...
                </strong>
              {/if}
              <div
                class="badge glass badge-xs text-neutral absolute bottom-3 right-3"
              >
                {role === "host"
                  ? respondent.email
                  : respondent.revision.createdBy}
              </div>
            </div>
            <div
              class="aspect-square relative h-full flex items-center justify-center bg-neutral/5 border-l-2 border-neutral-950"
            >
              <div bind:this={localCamera} class="size-full"></div>
              <div
                class="badge glass badge-xs text-neutral absolute bottom-3 right-3"
              >
                {role === "host"
                  ? respondent.revision?.createdBy
                  : respondent.email}
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-4 justify-center h-full flex-1">
            {#if role === "host"}
              {@const participant = remoteCamera?.querySelector("video")}
              <button
                on:click={async () => {
                  loading = true;
                  if (participant) await captureParticipantImage(participant);
                  await startSession();
                  dispatch("close");
                  loading = false;
                }}
                disabled={!$session.local.streams?.mic ||
                  !$session.remote.camera ||
                  !$session.remote.screen}
                class="btn btn-lg btn-error w-full">Start Session</button
              >
            {:else if !$session.remote.camera}
              <h4>Everything look good?</h4>
              <button
                on:click={connectToCall}
                disabled={!$session.local.streams?.mic ||
                  !!$session.remote.camera ||
                  connecting}
                class="btn btn-lg btn-primary w-full"
              >
                {#if connecting}
                  <span class="loading loading-spinner"></span>
                {:else}
                  Connect to host
                {/if}
              </button>
            {:else}
              <span
                class="text-center uppercase text-neutral-950/30 font-semibold text-xs"
                >The host will start the session soon.</span
              >
            {/if}
          </div>
        </header>
        {#if role === "host" && participantURL}
          <form
            action="/"
            class="flex justify-center items-center gap-4"
            on:submit|preventDefault={() => copy(participantURL)}
          >
            <span>Participant URL</span>
            <input
              readonly
              type="text"
              value={participantURL}
              placeholder="Participant URL"
              class="input input-bordered flex-1 bg-neutral"
            />
            <button
              data-tip="copied!"
              on:click={showCopied}
              class:tooltip={copied}
              type="submit"
              class="btn btn-primary tooltip-open tooltip-top tooltip-info"
            >
              <iconify-icon class="text-xl" icon="mdi:content-copy"
              ></iconify-icon>
            </button>
          </form>
        {/if}
      {/if}
    </div>
  </div>
</dialog>

<script lang="ts">
  import Transcription from "./Transcription.svelte";
  import KeyMoments from "@/components/sessions/Moments.svelte";
  import Downloads from "@/components/sessions/Downloads.svelte";
  import session, { startRecording, stopRecording } from "@/stores/session";

  function toggleRecording() {
    if ($session.recorder.status === "recording") {
      stopRecording();
      $session.transcriber?.stop();
    } else {
      startRecording();
      $session.transcriber?.start();
    }
  }

  let active: "transcription" | "checklist" | "downloads" = "checklist";
</script>

<div role="tablist" class="tabs tabs-boxed bg-neutral p-3 shadow">
  <a
    role="tab"
    href="#transcription"
    class="tab flex items-center gap-2"
    on:click|preventDefault={() => (active = "transcription")}
    class:tab-active={active === "transcription"}
  >
    <iconify-icon class="text-xl" icon="mdi:transcribe"></iconify-icon>
    <span>Transcription</span>
  </a>
  <a
    role="tab"
    href="#checklist"
    class="tab flex items-center gap-2"
    on:click|preventDefault={() => (active = "checklist")}
    class:tab-active={active === "checklist"}
  >
    <iconify-icon class="text-xl" icon="mdi:list-box"></iconify-icon>
    <span>Checklist</span>
  </a>
  <a
    role="tab"
    class="tab flex items-center gap-2"
    href="#downloads"
    on:click|preventDefault={() => (active = "downloads")}
    class:tab-active={active === "downloads"}
  >
    <iconify-icon class="text-xl" icon="mdi:download"></iconify-icon>
    <span>Downloads</span>
  </a>
</div>

<div
  id="transcription"
  class="bg-sus-surface-10 flex-1"
  class:hidden={active !== "transcription"}
>
  <Transcription transcript={$session.recorder.current?.transcript} />
</div>
<div
  id="checklist"
  class="bg-sus-surface-10 flex-1 p-4 flex flex-col gap-4"
  class:hidden={active !== "checklist"}
>
  <KeyMoments />
  <button on:click={toggleRecording} class="btn btn-error"
    >{$session.recorder.status === "recording" ? "Stop" : "Start"} Recording</button
  >
</div>
<div
  id="downloads"
  class="bg-sus-surface-10 flex-1"
  class:hidden={active !== "downloads"}
>
  <Downloads downloads={$session.recorder.recordings} />
</div>

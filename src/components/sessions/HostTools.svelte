<script lang="ts">
  import session from "@/stores/session";
  import type { APIResponses } from "@/helpers/api";
  import Transcription from "./Transcription.svelte";
  import TaskList from "@/components/sessions/TaskList.svelte";
  import KeyMoments from "@/components/sessions/Moments.svelte";

  let respondent: APIResponses["respondentBySurveyId"]["GET"];
  let active: "transcription" | "checklist" | "moments" = "checklist";

  let survey:
    | APIResponses["revisionSurveyType"]["GET"]["surveys"][number]
    | undefined = undefined;

  function updateMoments(e: CustomEvent) {
    session.setKey("moments", e.detail);
  }

  export { survey, respondent };
</script>

<div
  role="tablist"
  class="tabs tabs-boxed bg-neutral p-3 shadow sticky top-0 z-10"
>
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
    href="#moments"
    on:click|preventDefault={() => (active = "moments")}
    class:tab-active={active === "moments"}
  >
    <iconify-icon class="text-xl" icon="mdi:lightbulb-on-outline"
    ></iconify-icon>
    <span>Key Moments</span>
  </a>
</div>

<div
  id="transcription"
  class="bg-sus-surface-10 flex-1 p-4 flex flex-col"
  class:hidden={active !== "transcription"}
>
  <Transcription
    live={true}
    class="flex-1"
    transcript={$session.transcript}
    enabled={$session.status.recording}
  />
</div>
<div
  id="checklist"
  class="bg-sus-surface-10 flex-1 p-4 flex flex-col"
  class:hidden={active !== "checklist"}
>
  <TaskList {survey} {respondent} enabled={$session.status.recording} />
</div>
<div
  id="moments"
  class="bg-sus-surface-10 flex-1 p-4 flex flex-col"
  class:hidden={active !== "moments"}
>
  <KeyMoments
    class="flex-1"
    on:update={updateMoments}
    start={$session.recordingStart}
    moments={$session.moments ?? []}
    enabled={$session.status.recording}
  />
</div>

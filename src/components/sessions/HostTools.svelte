<script lang="ts">
  import session from "@/stores/session";
  import type { APIResponses } from "@/helpers/api";
  import Transcription from "./Transcription.svelte";
  import TaskList from "@/components/sessions/TaskList.svelte";
  import KeyMoments from "@/components/sessions/Moments.svelte";
  import Downloads from "@/components/sessions/Downloads.svelte";

  let respondent: APIResponses["respondentBySurveyId"]["GET"];
  let active: "transcription" | "checklist" | "downloads" = "checklist";
  let survey:
    | APIResponses["revisionSurveyType"]["GET"]["surveys"][number]
    | undefined = undefined;

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
  <KeyMoments class="flex-none h-60" />
  <TaskList {survey} {respondent} />
</div>
<div
  id="downloads"
  class="bg-sus-surface-10 flex-1"
  class:hidden={active !== "downloads"}
>
  <Downloads downloads={$session.recorder.recordings} />
</div>

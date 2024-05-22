<script lang="ts">
  import Gauge from "@/components/common/Gauge.svelte";
  import api, { type APIResponses } from "@/helpers/api";
  import { generateRespondentSlide } from "@/helpers/ppt";
  import Moments from "@/components/sessions/Moments.svelte";
  import { calculateSUSScoreFromRespondent } from "@/helpers/score";
  import Transcription from "@/components/sessions/Transcription.svelte";
  import type { Transcription as TranscriptionType } from "@/helpers/transcribe";

  const formatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  });

  let dateTime: Date;
  let loading = false;
  let susScore: number;
  let gauge: SVGSVGElement;
  let transcripts: TranscriptionType[] = [];
  let session:
    | APIResponses["sessionId"]["GET"]
    | APIResponses["summarizeSession"]["GET"];

  $: if (session) transcripts = session.transcripts as TranscriptionType[];

  $: if (transcripts[0]?.time) {
    dateTime = new Date(transcripts[0].time);
  }

  $: if (session.respondent)
    susScore = calculateSUSScoreFromRespondent(session.respondent);

  function resultsForDisplay() {
    const passed = session.respondent.responses.reduce((num, resp) => {
      if (resp.curratedResponse?.value === "pass") num += 1;
      return num;
    }, 0);
    const delayed = session.respondent.responses.reduce((num, resp) => {
      if (resp.curratedResponse?.value === "delayed") num += 1;
      return num;
    }, 0);
    const prompted = session.respondent.responses.reduce((num, resp) => {
      if (resp.curratedResponse?.value === "prompted") num += 1;
      return num;
    }, 0);
    const failed = session.respondent.responses.reduce((num, resp) => {
      if (resp.curratedResponse?.value === "failed") num += 1;
      return num;
    }, 0);

    return `${passed} Passed / ${delayed} Delayed / ${prompted} Prompted / ${failed} Failed`;
  }

  async function summarize() {
    loading = true;
    session = await api({
      method: "GET",
      endpoint: "summarizeSession",
      substitutions: { sessionId: session.id },
    });
    loading = false;
  }

  async function generatePowerPoint() {
    if (!session.summarized) await summarize();
    await generateRespondentSlide(session, undefined, gauge);
  }

  export { session };
</script>

<div class="p-4 h-full grid grid-cols-[auto_600px] grid-rows-2 gap-4">
  <div class="row-span-2 flex flex-col justify-start items-center gap-4">
    {#if session.summarized}
      <header class="w-full flex gap-4">
        <div class="card card-side bg-neutral shadow-xl flex-1">
          <figure>
            <img
              class="h-60 w-60"
              src={session.respondent.imageURL}
              alt={`Picture of ${session.respondent.name ?? session.respondent.email}`}
            />
          </figure>
          <div class="card-body">
            <h2 class="card-title">
              {session.respondent.name ?? session.respondent.email}
            </h2>
            <ul class="flex-1">
              <li><strong>Title:</strong> {session.respondent.title}</li>
              <li><strong>Profile:</strong> {session.respondent.profile}</li>
              <li class="mt-4">
                <strong>Session date:</strong>
                {formatter.format(dateTime)}
              </li>
              <li>
                <strong>Revision:</strong>
                {session.respondent.revision.system.title}: {session.respondent
                  .revision.title}
              </li>
              <li><strong>User Test Results:</strong> {resultsForDisplay()}</li>
            </ul>
            <!-- <strong>Details</strong>
          <ul>
            {#each session.suggestions as result}
              <li>{result.text}</li>
            {/each}
          </ul> -->
          </div>
        </div>
        {#if session.respondent.complete}
          <div class="flex-none w-72 bg-neutral rounded-box shadow-xl p-4">
            <Gauge
              bind:svg={gauge}
              differential={susScore - 50}
              scores={[[50, susScore], [50]]}
              keys={[session.respondent.revision.title, "Benchmark"]}
              differentialSubtitle="to industry benchmark"
            />
          </div>
        {/if}
      </header>
    {/if}
    {#if session.videoURL}
      <!-- svelte-ignore a11y-media-has-caption -->
      <video
        controls
        class="flex-2 aspect-video w-full rounded-lg overflow-hidden bg-neutral-950"
      >
        <source src={session.videoURL} />
      </video>
    {/if}
  </div>
  <Transcription transcript={transcripts} />
  <div class="flex flex-col gap-4">
    <Moments
      class="h-[calc(100%_-_7rem)]"
      moments={session.moments}
      start={new Date(transcripts?.[0]?.time)}
    />
    <button
      disabled={loading}
      on:click={generatePowerPoint}
      class="btn btn-lg btn-primary w-full"
    >
      {#if loading}
        <span class="loading loading-spinner loading-sm"></span>
      {:else}
        <iconify-icon icon="simple-icons:openai"></iconify-icon>
      {/if}
      Generate Readout
    </button>
  </div>
</div>

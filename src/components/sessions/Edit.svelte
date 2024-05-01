<script lang="ts">
  import type { APIResponses } from "@/helpers/api";
  import Moments from "@/components/sessions/Moments.svelte";
  import Transcription from "@/components/sessions/Transcription.svelte";
  import type { Transcription as TranscriptionType } from "@/stores/session";

  let transcripts: TranscriptionType[] = [];
  let session: APIResponses["sessionId"]["GET"];

  $: if (session) transcripts = session.transcripts as TranscriptionType[];

  export { session };
</script>

<div class="p-4 h-full grid grid-cols-[auto_600px] grid-rows-2 gap-4">
  {#if session.videoURL}
    <!-- svelte-ignore a11y-media-has-caption -->
    <div class="row-span-2 flex justify-center items-center">
      <video
        controls
        class="flex-1 aspect-video w-full rounded-lg overflow-hidden bg-neutral-950"
      >
        <source src={session.videoURL} />
      </video>
    </div>
  {/if}
  <Transcription transcript={transcripts} />
  <Moments
    class="flex-1"
    start={new Date(session.createdAt)}
    moments={session.moments}
  />
</div>

<script lang="ts">
  import { onMount } from "svelte";
  import type { APIResponses } from "@/helpers/api";
  import { activeRevisionsBySystem as actives } from "@/stores/actives";

  export let system: APIResponses["systemId"]["GET"];

  $: if ($actives[system.id])
    history.replaceState(null, "", `#${$actives[system.id]}`);

  onMount(() => {
    if (system.revisions.length && !window.location.hash) {
      actives.setKey(system.id, system.revisions[0].id);
    } else if (window.location.hash) {
      actives.setKey(system.id, window.location.hash.replace("#", ""));
    }
  });
</script>

<div role="tablist" class="w-full">
  <ul class="timeline">
    {#each system.revisions as revision, i}
      <li>
        {#if i !== 0}<hr />{/if}
        <a
          href={`#${revision.id}`}
          class="timeline-start timeline-box"
          class:text-neutral={$actives[system.id] === revision.id}
          class:bg-neutral-900={$actives[system.id] === revision.id}
          class:text-neutral-300={$actives[system.id] !== revision.id}
          class:border-neutral-300={$actives[system.id] !== revision.id}
          class:border-neutral-900={$actives[system.id] === revision.id}
          on:click|preventDefault={() => actives.setKey(system.id, revision.id)}
        >
          {revision.title}
        </a>
        <div class="timeline-middle">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            class="w-5 h-5"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        {#if i !== system.revisions.length - 1}
          <hr />{/if}
      </li>
    {/each}
  </ul>
</div>

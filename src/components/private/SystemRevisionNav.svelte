<script lang="ts">
  import { onMount } from "svelte";
  import type { APIResponses } from "@/api/types";

  export let system: APIResponses["systemId"]["GET"];

  let active: (typeof system)["Revision"][number];
  let tabs: HTMLAnchorElement[] = [];

  onMount(() => {
    if (tabs[0] && !window.location.hash) tabs[0].click();
    if (window.location.hash) {
      const tabidx = system.Revision.findIndex((rev) =>
        window.location.hash.includes(rev.id)
      );
      if (tabs[tabidx]) tabs[tabidx].click();
    }
  });
</script>

<div role="tablist" class="w-full">
  <ul class="timeline">
    {#each system.Revision as revision, i}
      <li>
        {#if i !== 0}<hr />{/if}
        <a
          bind:this={tabs[i]}
          href={`#rev_${revision.id}`}
          class="timeline-start timeline-box"
          on:click={() => (active = revision)}
          class:text-neutral={active === revision}
          class:bg-neutral-900={active === revision}
          class:text-neutral-300={active !== revision}
          class:border-neutral-300={active !== revision}
          class:border-neutral-900={active === revision}
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
        {#if i !== system.Revision.length - 1}
          <hr />{/if}
      </li>
    {/each}
  </ul>
  <slot />
</div>

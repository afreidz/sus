<script lang="ts">
  import api from "@/helpers/api";
  import { createEventDispatcher } from "svelte";
  import type { APIResponses } from "@/helpers/api";
  import { activeRevisionsBySystem } from "@/stores/actives";
  import RevisionMeta from "@/components/private/RevisionMeta.svelte";
  import SystemRevisionNav from "@/components/private/SystemRevisionNav.svelte";

  let loading: boolean = false;
  let hasTasklist: boolean = false;
  let system: APIResponses["systemId"]["GET"];

  const dispatch = createEventDispatcher();

  export { system, hasTasklist };
</script>

<div class="flex-none w-80">
  {#if loading}
    <span class="loading loading-spinner loading-lg"></span>
  {:else}
    <SystemRevisionNav
      vertical
      bind:system
      class="flex-none"
      linkType="anchor"
      on:update={() => dispatch("update")}
      on:activate={(e) => activeRevisionsBySystem.setKey(system.id, e.detail)}
    />

    {#if system}
      {@const revision = system.revisions.find(
        (r) => r.id === $activeRevisionsBySystem[system.id]
      )}
      {#if revision}
        <RevisionMeta
          {revision}
          {hasTasklist}
          on:update={() => dispatch("update")}
        />
      {/if}
    {/if}
  {/if}
</div>

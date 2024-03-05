<script lang="ts">
  import clients from "@/stores/clients";
  import ClientCard from "./ClientCard.svelte";
</script>

<section class="p-10 flex flex-wrap gap-4 justify-evenly">
  {#if $clients === null}
    <ClientCard loading />
    <ClientCard loading />
    <ClientCard loading />
    <ClientCard loading />
    <ClientCard loading />
  {:else}
    <ClientCard />
    {#each $clients as client}
      <ClientCard {client} />
    {/each}
  {/if}
</section>

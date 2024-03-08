<script lang="ts">
  import type { APIResponses } from "@/helpers/api";
  import Invite from "@/components/private/Invite.svelte";
  import { activeRevisionsBySystem } from "@/stores/actives";

  export let revision: APIResponses["systemId"]["GET"]["revisions"][number];
</script>

<div
  role="tabpanel"
  id={revision.id}
  class:flex={$activeRevisionsBySystem[revision.systemId] === revision.id}
  class:hidden={$activeRevisionsBySystem[revision.systemId] !== revision.id}
  class="flex-col"
>
  <Invite revision={revision.id} />
</div>

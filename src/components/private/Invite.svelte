<script lang="ts">
  import z from "zod";
  import api from "@/helpers/api";
  import type { APIResponses } from "@/api/types";
  import RespondentList from "@/components/private/RespondentList.svelte";

  let newInviteList = "";
  let revision: APIResponses["revisionId"]["GET"];
  let system: APIResponses["systemId"]["GET"] | undefined;
  let revisionId: APIResponses["systemId"]["GET"]["Revision"][number]["id"];

  $: if (revisionId) refreshRevision();
  $: if (revision) refreshSystem();

  async function refreshSystem() {
    system = await api({
      endpoint: "systemId",
      method: "GET",
      substitutions: { SYSTEM_ID: revision.systemId },
    });
  }

  async function refreshRevision() {
    revision = await api({
      endpoint: "revisionId",
      method: "GET",
      substitutions: { REVISION_ID: revisionId },
    });
  }

  async function invite() {
    const isEmail = z.string().email();
    const list = newInviteList.split(",");

    if (!list.every((s) => isEmail.safeParse(s.trim()).success)) return;

    await Promise.all(
      list.map((email) => {
        return api({
          endpoint: "respondentAll",
          method: "POST",
          body: JSON.stringify({ email, revisionId }),
        });
      })
    );

    newInviteList = "";
    await refreshRevision();
  }

  export { revisionId as revision };
</script>

<div
  class:skeleton={!system || !revision}
  class="card bg-neutral rounded-lg shadow-sm p-4 w-full max-w-lg"
>
  {#if system && revision}
    <header class="flex gap-2 pb-4 border-b border-neutral-100">
      <iconify-icon class="text-2xl mt-1" icon="mdi:invite"></iconify-icon>
      <div class="prose">
        <h3 class="mb-1">Invite a new respondent</h3>
        <p class="text-sm text-neutral-400">
          Fill in an email address to invite someone to take the SUS Survey for <span
            class="font-semibold text-neutral-950"
            >"{system.title}:
            {revision.title}."</span
          > Use comma-separated list for multiple.
        </p>
      </div>
    </header>
    <form on:submit|preventDefault={invite} class="flex gap-2 items-end mb-4">
      <label class="form-control w-full">
        <div class="label">
          <span class="label-text">Invite email</span>
        </div>
        <input
          type="text"
          required
          bind:value={newInviteList}
          class="input input-bordered bg-neutral w-full"
        />
      </label>
      <button class="btn btn-primary">Invite</button>
    </form>
    <div class="pb-4 border-b border-neutral-100 mb-4">
      <RespondentList respondents={revision.Respondent} />
    </div>
    <form on:submit|preventDefault={invite} class="flex gap-2 items-end mb-4">
      <label class="form-control w-full">
        <div class="label">
          <span class="label-text">Invite link</span>
        </div>
        <input
          disabled
          type="text"
          value={`${window.location.origin}/survey/${revision.id}`}
          class="input input-bordered !bg-neutral-100 w-full"
        />
      </label>
      <button class="btn btn-outline">Copy</button>
    </form>
  {/if}
</div>

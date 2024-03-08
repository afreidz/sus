<script lang="ts">
  import z from "zod";
  import { onMount } from "svelte";
  import copy from "clipboard-copy";
  import api, { type APIResponses } from "@/helpers/api";
  import RespondentList from "@/components/private/RespondentList.svelte";

  let inviteLink = "";
  let newInviteList = "";
  let revision: APIResponses["revisionId"]["GET"];
  let system: APIResponses["systemId"]["GET"] | undefined;
  let revisionId: APIResponses["systemId"]["GET"]["revisions"][number]["id"];

  onMount(refreshRevision);

  $: if (revision) refreshSystem();
  $: if (revision)
    inviteLink = `${window.location.origin}/surveys/sus/${revision.id}`;

  async function refreshSystem() {
    system = await api({
      method: "GET",
      endpoint: "systemId",
      substitutions: { systemId: revision.systemId },
    });
  }

  async function refreshRevision() {
    revision = await api({
      method: "GET",
      endpoint: "revisionId",
      substitutions: { revisionId: revisionId },
    });
  }

  async function invite() {
    const isEmail = z.string().email();
    const list = newInviteList.split(",").map((l) => l.trim());

    const validEmails = list.filter((email) => {
      return isEmail.safeParse(email).success;
    });

    const invalidEmails = list.filter((email) => {
      return !isEmail.safeParse(email).success;
    });

    await Promise.all(
      validEmails.map((email) => {
        return api({
          endpoint: "respondents",
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
      <RespondentList respondents={revision.respondents} />
    </div>
    <div class="flex gap-2 items-end mb-4">
      <label class="form-control w-full">
        <div class="label">
          <span class="label-text">Invite link</span>
        </div>
        <div class="flex">
          <a class="btn btn-outline me-2" href={inviteLink} target="_blank">
            <iconify-icon class="text-xl" icon="carbon:view"></iconify-icon>
          </a>
          <input
            disabled
            type="text"
            bind:value={inviteLink}
            class="input input-bordered !bg-neutral-100 w-full"
          />
        </div>
      </label>
      <button on:click={() => copy(inviteLink)} class="btn btn-outline"
        >Copy</button
      >
    </div>
  {/if}
</div>

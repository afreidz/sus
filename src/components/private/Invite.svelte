<script lang="ts">
  import z from "zod";
  import { onMount } from "svelte";
  import api, { type APIResponses } from "@/helpers/api";
  import CardHeader from "@/components/common/CardHeader.svelte";
  import RespondentList from "@/components/private/RespondentList.svelte";

  let surveyId: string;
  let newInviteList = "";
  let revision: APIResponses["revisionId"]["GET"];
  let system: APIResponses["systemId"]["GET"] | undefined;
  let revisionId: APIResponses["systemId"]["GET"]["revisions"][number]["id"];

  onMount(refreshRevision);

  $: if (revision) refreshSystem();

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
          body: JSON.stringify({ email, revisionId, surveyId }),
        });
      })
    );

    newInviteList = "";
    await refreshRevision();
  }

  export { revisionId as revision, surveyId as survey };
</script>

<div
  class:skeleton={!system || !revision}
  class="card bg-neutral rounded-lg shadow-sm p-4 w-full"
>
  {#if system && revision}
    <CardHeader icon="mdi:invite" class="mb-4">
      <span>Invite a new respondent</span>
      <span slot="sub">
        Fill in an email address to invite someone to take the SUS Survey for <span
          class="font-semibold text-neutral-950"
          >"{system.title}:
          {revision.title}."</span
        > Use comma-separated list for multiple.
      </span>
    </CardHeader>
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
    <div class="mb-4 max-h-96 overflow-auto">
      <RespondentList respondents={revision.respondents} />
    </div>
  {/if}
</div>

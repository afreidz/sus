<script lang="ts">
  import z from "zod";
  import { createEventDispatcher } from "svelte";
  import { MessageHandler } from "@/stores/messages";
  import api, { type APIResponses } from "@/helpers/api";
  import CardHeader from "@/components/common/CardHeader.svelte";
  import RespondentList from "@/components/private/RespondentList.svelte";

  let loading = false;
  let surveyId: string;
  let newInviteList = "";
  let hasChecklist: boolean;
  let revision: APIResponses["systemId"]["GET"]["revisions"][number];

  const dispatch = createEventDispatcher();

  async function invite() {
    const isEmail = z.string().email();
    const list = newInviteList.split(",").map((l) => l.trim());

    const validEmails = list.filter((email) => {
      return isEmail.safeParse(email).success;
    });

    const invalidEmails = list.filter((email) => {
      return !isEmail.safeParse(email).success;
    });

    loading = true;
    await Promise.all(
      validEmails.map((email) => {
        return api({
          endpoint: "respondents",
          method: "POST",
          body: JSON.stringify({ email, revisionId: revision.id, surveyId }),
        });
      })
    );

    loading = false;
    newInviteList = "";

    if (validEmails.length) {
      MessageHandler({
        type: "success",
        message: "Respondents have been added to the survey",
      });
      dispatch("update");
    }

    if (invalidEmails.length)
      MessageHandler({
        type: "error",
        message: "Some of the email addresses could not be added",
        detail:
          `The following:\n${invalidEmails.join("\n")}\nare not valid.\n`.trimStart(),
      });
  }

  export { revision, surveyId as survey, hasChecklist };
</script>

<div
  class:skeleton={loading}
  class="card bg-neutral rounded-lg shadow-sm p-4 w-full"
>
  <CardHeader icon="mdi:invite" class="mb-4">
    <span>Add a new respondent</span>
    <span slot="sub">
      Fill in an email address to add a respondent to the SUS Survey for <span
        class="font-semibold text-neutral-950"
        >"{revision.system.title}:
        {revision.title}."</span
      > Use comma-separated list for multiple.
    </span>
  </CardHeader>
  <form on:submit|preventDefault={invite} class="flex gap-2 items-end mb-4">
    <label class="form-control w-full">
      <div class="label">
        <span class="label-text">Respondent email</span>
      </div>
      <input
        type="text"
        required
        bind:value={newInviteList}
        class="input input-bordered bg-neutral w-full"
      />
    </label>
    <button class="btn btn-primary">Add</button>
  </form>
  <div
    class:h-80={revision.respondents.length}
    class:h-32={!revision.respondents.length}
    class="mb-4 overflow-auto flex flex-col"
  >
    {#if revision.respondents.length}
      <RespondentList {hasChecklist} respondents={revision.respondents} />
    {:else}
      <strong
        class="uppercase flex-1 flex items-center text-center font-semibold opacity-30 text-balance px-4"
        >There are no repsondents for this revision yet. Survey links are unique
        to each respondent, and will only be available once a respondent is
        created.</strong
      >
    {/if}
  </div>
</div>

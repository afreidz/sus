<script lang="ts">
  import api from "@/helpers/api";
  import { onMount } from "svelte";
  import me, { refreshMe } from "@/stores/me";
  import type { APIResponses } from "@/helpers/api";
  import { taskType, refreshTypes } from "@/stores/types";
  import CardHeader from "@/components/common/CardHeader.svelte";
  import ConfirmDialog from "@/components/common/ConfirmDialog.svelte";
  import { groupByDataUri, fileToResizedDataURI } from "@/helpers/image";

  type Section = {
    media?: string;
    mime?: string;
    tasks: {
      id?: string;
      text: string;
    }[];
  };

  let existing = false;
  let showConfirmDelete = false;
  let deleteDialog: HTMLDialogElement;
  let removedQuestions: string[] = [];
  let placeholder = "Do something...";
  let revision: APIResponses["revisionId"]["GET"];
  let sections: Section[] = [{ tasks: [{ text: "" }] }];
  let survey: (typeof revision)["surveys"][number] | undefined;
  let responses: APIResponses["curratedResponsesByType"]["GET"] = [];

  onMount(refreshMe);

  onMount(async () => {
    if (!taskType.get()) await refreshTypes();
    survey = revision.surveys.find((s) => s.scoreTypeId === $taskType?.id);
    if (survey && survey.questions) {
      existing = true;
      sections = groupByDataUri(survey.questions);
    }
  });

  $: if ($taskType?.id) {
    api({
      method: "GET",
      endpoint: "curratedResponsesByType",
      substitutions: { scoreType: $taskType.id },
    }).then((r) => (responses = r));
  }

  type ImageSelectEvent = Event & {
    currentTarget: EventTarget & HTMLInputElement;
  };

  async function handleImage(e: ImageSelectEvent, section: Section) {
    if (!e.currentTarget?.files?.[0]) return;
    const imageFile = e.currentTarget.files[0];

    const data = await fileToResizedDataURI(imageFile);

    section.media = data;
    section.mime = imageFile.type;

    sections = [...sections];
  }

  function addSection() {
    const updated = [...sections];
    updated.push({ tasks: [{ text: "" }] });
    sections = updated;
  }

  function addTask(s: Section) {
    s.tasks.push({ text: "" });
    sections = [...sections];
  }

  function removeSection(s: Section) {
    if (s.tasks.some((t) => t.id))
      s.tasks.forEach((t) => t.id && removedQuestions.push(t.id));
    const updated = [...sections.filter((section) => section !== s)];
    sections = [...updated];
  }

  function removeTask(s: Section, i: number) {
    const task = s.tasks[i];
    if (task.id) removedQuestions.push(task.id);
    s.tasks.splice(i, 1);
    sections = [...sections];
  }

  async function createTasklist() {
    if (!revision?.id) return;

    const questions = sections
      .map((section) =>
        section.tasks.map((task) => ({
          id: task.id,
          text: task.text,
          media: section.media,
          mediaMIME: section.mime,
          createdBy: $me?.user?.email,
          curratedResponses: {
            connect: responses.map(({ id }) => ({ id })),
          },
        }))
      )
      .flat();

    if (existing && survey) {
      await api({
        method: "PUT",
        endpoint: "surveyId",
        body: JSON.stringify({
          questions,
          removedQuestions,
        }),
        substitutions: { surveyId: survey.id },
      });
    } else {
      await api({
        endpoint: "surveys",
        method: "POST",
        body: JSON.stringify({
          questions,
          revisionId: revision.id,
          scoreTypeId: taskType.get()?.id,
          label: `tasklist_${revision.id}`,
        }),
      });
    }

    window.history.back();
  }

  async function deleteTasklist() {
    if (deleteDialog.returnValue !== "Delete Tasklist" || !survey) {
      return;
    }

    await api({
      method: "DELETE",
      endpoint: "surveyId",
      substitutions: { surveyId: survey.id },
    });

    window.history.back();
  }

  export { revision };
</script>

<form
  on:submit|preventDefault={createTasklist}
  class="flex gap-4 w-full max-w-screen-2xl items-start"
>
  <aside
    class="card bg-neutral rounded-lg shadow-sm flex-none w-80 sticky top-32"
  >
    {#if revision}
      <div class="card-body">
        <header class="prose">
          <h2
            class="border-b mb-2 pb-2 border-sus-surface-30 text-sus-primary-60"
          >
            {revision.system.client.name}
          </h2>
        </header>
        <div class="flex flex-col gap-1 mb-4">
          <p class="flex justify-between m-0">
            <strong class="flex-1">System:</strong>
            <span class="text-sm text-sus-surface-0-fg/50"
              >{revision.system.title}</span
            >
          </p>
          <p class="flex justify-between m-0">
            <strong class="flex-1">Revision:</strong>
            <span class="text-sm text-sus-surface-0-fg/50"
              >{revision.title}</span
            >
          </p>
        </div>
        <button type="submit" class="btn btn-primary text-neutral"
          >{existing ? "Update" : "Create"} Task List</button
        >
        <button
          type="button"
          on:click={() => window.history.back()}
          class="btn btn-outline">Cancel</button
        >
        <div class="divider">
          <span>Danger Zone</span>
        </div>

        <button
          type="button"
          on:click={() => (showConfirmDelete = true)}
          class="btn btn-error btn-outline hover:!text-neutral"
          >Delete Tasklist</button
        >
      </div>
    {/if}
  </aside>
  <div class="flex-1 card bg-neutral rounded-lg shadow-sm p-4 w-full">
    <CardHeader icon="mdi:list-status" class="mb-4 flex-none">
      <span
        >{existing ? "Update user" : "Create a new user"} test task list</span
      >

      <span slot="sub"
        >Task lists provide the ability to proctor and track the completion of
        certain tasks during a prototype user test.</span
      >
    </CardHeader>
    {#each sections as section, s}
      <table
        class="table mb-8 rounded-lg ring-4 ring-base-300/50 border-base-200"
      >
        <thead>
          <tr>
            <th class="w-[30%] border-r border-base-200 p-0">
              <div class="mockup-window bg-sus-primary-40 m-4">
                <div class="flex justify-center bg-sus-surface-20">
                  {#if section.media}
                    <img
                      src={section.media}
                      class="w-full max-w-80"
                      alt="section tasklist screenshot"
                    />
                  {:else}
                    <label class="px-4 py-16">
                      <span class="btn btn-primary btn-outline"
                        >Click to choose and image</span
                      >
                      <input
                        type="file"
                        class="hidden"
                        accept="image/*"
                        on:change={(e) => handleImage(e, section)}
                      />
                    </label>
                  {/if}
                </div>
              </div>
              <span
                class="block text-base p-4 text-center border-t border-base-200"
                >Tasks</span
              >
            </th>
            {#each responses as response}
              <th
                class="w-[15%] last-of-type:rounded-tr-lg overflow-clip align-top text-center border-r border-base-200 last-of-type:border-r-0 text-base bg-sus-surface-10 p-0"
              >
                <span class="block p-4 border-b border-base-200 bg-neutral"
                  >{response.label}</span
                >
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each section.tasks as _, t}
            <tr>
              <td
                class="border-r border-base-200 text-center flex items-center gap-2"
              >
                <button
                  type="button"
                  class="btn btn-outline btn-error"
                  on:click={() => removeTask(section, t)}
                >
                  <span class="sr-only">remove task</span>
                  <iconify-icon icon="mdi:close"></iconify-icon>
                </button>
                <input
                  required
                  type="text"
                  class="input w-full"
                  placeholder={`${placeholder}`}
                  bind:value={sections[s].tasks[t].text}
                />
              </td>
              {#each responses as _}
                <th class="border-r border-base-200 last-of-type:border-r-0"
                ></th>
              {/each}
            </tr>
          {/each}
          <tr>
            <td class="text-center">
              <button
                type="button"
                on:click={() => addTask(section)}
                class="btn btn-outline">Add Task</button
              >
            </td>
            <td colspan="3"></td>
            <td>
              <button
                type="button"
                on:click={() => removeSection(section)}
                class="btn btn-error btn-outline">Remove Section</button
              >
            </td>
          </tr>
        </tbody>
      </table>
    {/each}
    <div class="flex justify-center">
      <button
        type="button"
        on:click={addSection}
        class="btn btn-secondary text-neutral">Add Section</button
      >
    </div>
  </div>
</form>
{#if showConfirmDelete}
  <ConfirmDialog
    open
    bind:elm={deleteDialog}
    on:close={deleteTasklist}
    confirmText="Delete Tasklist"
  >
    Deleting the tasklist will also delete any responses recorded on this
    tasklist.
  </ConfirmDialog>
{/if}

<script lang="ts" context="module">
  export type ChecklistSection = {
    imageURL?: string;
    group?: string;
    tasks: {
      id?: string;
      text: string;
    }[];
  };
</script>

<script lang="ts">
  import {
    uploadImageToStorage,
    convertImageToResizedBlob,
  } from "@/helpers/media";

  import api from "@/helpers/api";
  import { onMount } from "svelte";
  import me, { refreshMe } from "@/stores/me";
  import { createEventDispatcher } from "svelte";
  import type { APIResponses } from "@/helpers/api";
  import { safeTextRegEx } from "@/helpers/strings";
  import { MessageHandler } from "@/stores/messages";
  import { refreshTypes, checklistType } from "@/stores/types";
  import { groupChecklistSection } from "@/helpers/order";
  import CardHeader from "@/components/common/CardHeader.svelte";
  import { orderResponseByNumericalValue } from "@/helpers/order";
  import ConfirmDialog from "@/components/common/ConfirmDialog.svelte";

  const dispatch = createEventDispatcher();

  let loading = false;
  let existing = false;
  let showConfirmDelete = false;
  let deleteDialog: HTMLDialogElement;
  let removedQuestions: string[] = [];
  let placeholder = "Do something...";
  let survey: (typeof revision)["surveys"][number] | undefined;
  let responses: APIResponses["curratedResponsesByType"]["GET"] = [];
  let sections: ChecklistSection[] = [
    { tasks: [{ text: "" }], group: `section_${+new Date()}` },
  ];
  let revision:
    | APIResponses["systemId"]["GET"]["revisions"][number]
    | APIResponses["revisionId"]["GET"];

  onMount(async () => {
    await refreshTypes();

    const id = checklistType.get()?.id as string;

    survey = revision.surveys.find((s) => s.scoreTypeId === id);
    if (survey && survey.questions) {
      existing = true;
      sections = groupChecklistSection(survey.questions);
    }

    const allResponses = await api({
      method: "GET",
      endpoint: "curratedResponsesByType",
      substitutions: { scoreType: id },
    });

    responses =
      orderResponseByNumericalValue<(typeof responses)[number]>(allResponses);
  });

  type ImageSelectEvent = Event & {
    currentTarget: EventTarget & HTMLInputElement;
  };

  async function handleImage(
    e: ImageSelectEvent | null,
    section: ChecklistSection
  ) {
    const imageFile = e?.currentTarget?.files?.[0];

    if (!imageFile) {
      section.imageURL = undefined;
      sections = [...sections];
      return;
    }

    const ext = imageFile.name.split(".").slice(-1);
    const blob = await convertImageToResizedBlob(imageFile);
    const url = await uploadImageToStorage(
      blob,
      "checklist-images",
      `checklist-image-${+new Date()}.${ext}`,
      imageFile.type
    );

    section.imageURL = url;

    sections = [...sections];
  }

  function addSection() {
    const updated = [...sections];
    updated.push({ tasks: [{ text: "" }], group: `section_${+new Date()}` });
    sections = updated;
  }

  function addTask(s: ChecklistSection) {
    s.tasks.push({ text: "" });
    sections = [...sections];
  }

  function removeSection(s: ChecklistSection) {
    if (s.tasks.some((t) => t.id))
      s.tasks.forEach((t) => t.id && removedQuestions.push(t.id));
    const updated = [...sections.filter((section) => section !== s)];
    sections = [...updated];
  }

  function removeTask(s: ChecklistSection, i: number) {
    const task = s.tasks[i];
    if (task.id) removedQuestions.push(task.id);
    s.tasks.splice(i, 1);
    sections = [...sections];
  }

  async function createChecklist() {
    if (!revision?.id || !$checklistType?.id) return;

    const taskId = checklistType.get()?.id as string;

    await refreshMe();
    const questions = sections
      .map((section) =>
        section.tasks.map((task) => ({
          id: task.id,
          text: task.text,
          group: section.group,
          imageURL: section.imageURL,
          createdBy: $me?.user?.email,
          curratedResponses: {
            connect:
              orderResponseByNumericalValue<(typeof responses)[number]>(
                responses
              ),
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
          scoreTypeId: taskId,
          revisionId: revision.id,
          label: `checklist_${revision.id}`,
        }),
      });
    }

    dispatch("update");
    MessageHandler({ type: "success", message: "Checklist has been updated" });
  }

  async function deleteChecklist() {
    if (deleteDialog.returnValue !== "Delete Checklist" || !survey) {
      return;
    }

    await api({
      method: "DELETE",
      endpoint: "surveyId",
      substitutions: { surveyId: survey.id },
    });

    dispatch("update");
    MessageHandler({ type: "success", message: "Checklist has been deleted" });
  }

  export { revision };
</script>

<form
  on:submit|preventDefault={createChecklist}
  class="flex flex-1 gap-4 w-full max-w-screen-lg items-start"
>
  <div class="flex-1 p-4 w-full">
    <CardHeader icon="mdi:list-status" class="mb-4 flex-none">
      <span
        >{existing ? "Update user" : "Create a new user"} test checklist</span
      >

      <span slot="sub"
        >Checklists provide the ability to proctor and track the completion of
        certain tasks during a moderated system user test.</span
      >
    </CardHeader>
    {#each sections as section, s}
      <table
        class:skeleton={loading}
        class="bg-neutral table mb-8 rounded-lg ring-4 ring-base-300/50 border-base-200"
      >
        <thead>
          <tr>
            <th>
              <label class="flex items-center gap-4">
                <span class="text-lg">Section Title:</span>
                <input
                  required
                  type="text"
                  bind:value={section.group}
                  title="Invalid section title"
                  placeholder={`${placeholder}`}
                  pattern={safeTextRegEx.source}
                  class="input w-full font-normal"
                />
                <button
                  type="button"
                  on:click={() => removeSection(section)}
                  class="btn btn-error btn-outline"
                >
                  <span class="sr-only">remove section</span>
                  <iconify-icon icon="mdi:close"></iconify-icon>
                </button>
              </label>
            </th>
          </tr>
          <tr>
            <th class="w-[30%] border-r border-base-200 p-0">
              <div class="mockup-window bg-sus-primary-40 m-4 relative">
                {#if section.imageURL}
                  <button
                    on:click={() => handleImage(null, section)}
                    class="absolute p-0 right-2 top-3 btn btn-xs btn-ghost"
                  >
                    <iconify-icon icon="mdi:close"></iconify-icon>
                  </button>
                {/if}
                <div class="flex justify-center bg-sus-surface-20">
                  {#if section.imageURL}
                    <img
                      src={section.imageURL}
                      class="w-full max-w-80"
                      alt="section checklist screenshot"
                    />
                  {:else}
                    <label class="px-4 py-16">
                      <span class="btn btn-primary btn-outline"
                        >Click to choose and image</span
                      >
                      <input
                        type="file"
                        class="hidden"
                        accept="image/png"
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
                  title="Invalid task text"
                  placeholder={`${placeholder}`}
                  pattern={safeTextRegEx.source}
                  bind:value={sections[s].tasks[t].text}
                />
              </td>
            </tr>
          {/each}
          <tr>
            <td class="text-center">
              <button
                type="button"
                on:click={() => addTask(section)}
                class="btn btn-outline">Add Task</button
              >
              <button
                type="button"
                on:click={addSection}
                class="btn btn-primary btn-outline">Add Section</button
              >
            </td>
          </tr>
        </tbody>
      </table>
    {/each}
    <footer class="flex justify-between">
      <button
        on:click={() => dispatch("cancel")}
        type="button"
        class="btn btn-ghost btn-lg">Cancel</button
      >
      <button type="submit" class="btn btn-primary btn-lg">Save</button>
    </footer>
  </div>
</form>
{#if showConfirmDelete}
  <ConfirmDialog
    open
    bind:elm={deleteDialog}
    on:close={deleteChecklist}
    confirmText="Delete Checklist"
  >
    Deleting the checklist will also delete any responses recorded on this
    checklist.
  </ConfirmDialog>
{/if}

<script lang="ts">
  import api from "@/helpers/api";
  import { onMount } from "svelte";
  import type { APIResponses } from "@/helpers/api";
  import { taskType, refreshTypes } from "@/stores/types";
  import CardHeader from "@/components/common/CardHeader.svelte";

  type Section = {
    media?: string;
    tasks: string[];
  };

  let placeholder = "Do something...";
  let defaultSection = { tasks: [`${placeholder}`] };
  let sections: Section[] = [{ ...defaultSection }];
  let responses: APIResponses["curratedResponsesByType"]["GET"] = [];

  onMount(refreshTypes);

  $: if ($taskType?.id) {
    api({
      method: "GET",
      endpoint: "curratedResponsesByType",
      substitutions: { scoreType: $taskType.id },
    }).then((r) => (responses = r));
  }

  $: console.log(sections);
</script>

<div class="card bg-neutral rounded-lg shadow-sm p-4 w-full">
  <CardHeader icon="mdi:list-status" class="mb-4">
    <span>Create a new user test task list</span>
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
              <div class="flex justify-center px-4 py-16 bg-sus-surface-20">
                Click to add image
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
        {#each section.tasks as task, t}
          <tr>
            <td class="border-r border-base-200 text-center"
              ><input
                type="text"
                placeholder={`${task}`}
                bind:value={task}
                class="input w-full"
              />
            </td>
            {#each responses as _}
              <th class="border-r border-base-200 last-of-type:border-r-0"></th>
            {/each}
          </tr>
          {#if t === section.tasks.length - 1}
            <tr>
              <td class="text-center">
                <button
                  on:click={() => {
                    let updated = [...section.tasks];
                    updated.push(`${placeholder}`);
                    section.tasks = updated;
                  }}
                  class="btn btn-outline">Add Task</button
                >
              </td>
              <td colspan="8"></td>
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
  {/each}
  <div class="flex justify-center">
    <button
      on:click={() => {
        const updated = [...sections];
        updated.push({ ...defaultSection });
        sections = updated;
      }}
      class="btn btn-secondary max-w-xs text-neutral">Add Section</button
    >
  </div>
</div>

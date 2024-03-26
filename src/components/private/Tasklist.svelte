<script lang="ts">
  import { groupByDataUri } from "@/helpers/image";
  import type { APIResponses } from "@/helpers/api";
  import CardHeader from "@/components/common/CardHeader.svelte";

  let sections: ReturnType<typeof groupByDataUri>;
  let respondent: APIResponses["respondentBySurveyId"]["GET"];
  let survey: APIResponses["revisionId"]["GET"]["surveys"][number];

  $: if (survey.questions) sections = groupByDataUri(survey.questions);

  export { respondent, survey };
</script>

<div
  class="flex-1 card bg-neutral rounded-lg shadow-sm px-4 w-full max-w-screen-lg overflow-clip"
>
  <CardHeader
    icon="mdi:list-status"
    class="mb-4 flex-none !sticky top-[60px] bg-neutral left-0 right-0 z-10 -mx-4 px-4 pt-4"
  >
    <span>{respondent.email}</span>

    <span slot="sub"
      >Ask the candidate to perform the following tasks and record their results
      below</span
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
                {#if section.media && section.mime}
                  <img alt="section tasklist screenshot" src={section.media} />
                {/if}
              </div>
            </div>
          </th>
          <th class="border-r border-base-200 text-base bg-sus-surface-10 p-0"
          ></th>
          <th class="border-r border-base-200 text-base bg-sus-surface-10 p-0"
          ></th>
          <th class="border-r border-base-200 text-base bg-sus-surface-10 p-0"
          ></th>
          <th class="border-r border-base-200 text-base bg-sus-surface-10 p-0"
          ></th>
          <th class="border-r border-base-200 text-base bg-sus-surface-10 p-0"
          ></th>
        </tr>
        <tr class="sticky top-36">
          <th
            class="border-r border-base-200 text-center text-base bg-neutral p-0"
          >
            <span class="border-b border-base-200 p-4 block w-full">Tasks</span>
          </th>
          {#each survey.questions[0].curratedResponses as response}
            <th
              class="w-[15%] text-center text-base bg-neutral p-0 border-r border-base-200"
            >
              <span class="border-b border-base-200 p-4 block w-full"
                >{response.label}</span
              >
            </th>
          {/each}
          <th
            class="w-[15%] rounded-tr-lg overflow-clip text-center bg-neutral text-base p-0"
          >
            <span class="border-b border-base-200 p-4 block w-full">Notes</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {#each section.tasks as _, t}
          <tr>
            <td class="border-r border-base-200">
              {t + 1}. {sections[s].tasks[t].text}
            </td>
            {#each survey.questions[0].curratedResponses as resp}
              <td class="border-r border-base-200 !p-0">
                <label class="p-4 w-full h-full flex justify-center">
                  <input
                    class="radio radio-primary"
                    name={`section_${s}_task_${t}`}
                    value={resp.id}
                    type="radio"
                  />
                </label>
              </td>
            {/each}
            <td class="border-base-200">
              <textarea name={`section_${s}_task_${t}_notes`}></textarea>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/each}
</div>

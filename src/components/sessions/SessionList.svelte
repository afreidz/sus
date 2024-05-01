<script lang="ts">
  import type { APIResponses } from "@/helpers/api";
  import CardHeader from "@/components/common/CardHeader.svelte";

  let sessions: APIResponses["sessions"]["GET"];

  const date = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: true,
    minute: "2-digit",
  });

  export { sessions };
</script>

<div class="card bg-neutral rounded-box shadow-sm m-4">
  <table class="table">
    <!-- head -->
    <thead>
      <tr>
        <th>Session Name</th>
        <th>System/Revision</th>
        <th>Client</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each sessions as session}
        <tr>
          <td>
            <div class="flex items-center gap-3">
              <div class="avatar placeholder">
                <div
                  class="bg-secondary text-secondary-content rounded-full w-10"
                >
                  <span class="text-xl"
                    >{session.respondent.email.charAt(0)}</span
                  >
                </div>
              </div>
              <div>
                <div class="font-bold">
                  Session with: {session.respondent.email}
                </div>
                <div class="text-sm opacity-50">
                  {date.format(new Date(session.createdAt))} @ {time.format(
                    new Date(session.createdAt)
                  )}
                </div>
              </div>
            </div>
          </td>
          <td>
            {session.respondent.revision.system.title}
            <br />
            <span class="badge badge-ghost badge-sm"
              >{session.respondent.revision.title}</span
            >
          </td>
          <td>{session.respondent.revision.system.client.name}</td>
          <th>
            <a href={`/sessions/${session.id}`} class="btn btn-ghost btn-xs"
              >details</a
            >
          </th>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

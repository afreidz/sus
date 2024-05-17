<script lang="ts">
  import api from "@/helpers/api";
  import type { APIResponses } from "@/helpers/api";
  import { MessageHandler } from "@/stores/messages";
  import ConfirmDialog from "@/components/common/ConfirmDialog.svelte";

  let loading = false;
  let expanded: string[] = [];
  let confirmText = "delete session";
  let confirmElement: HTMLDialogElement;
  let sessionToDelete: string | null = null;
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

  async function deleteSession() {
    if (confirmElement.returnValue !== confirmText || !sessionToDelete) {
      sessionToDelete = null;
      return;
    }

    loading = true;
    await api({
      endpoint: "sessionId",
      method: "DELETE",
      substitutions: { sessionId: sessionToDelete },
    });

    MessageHandler({
      type: "success",
      message: "The session has been deleted.",
    });

    sessions = await api({ endpoint: "sessions", method: "GET" });
    sessionToDelete = null;
    loading = false;
  }

  function toggle(id: string) {
    const updated = new Set([...expanded]);

    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }

    expanded = [...updated];
  }

  export { sessions };
</script>

<div class="card bg-neutral rounded-box shadow-sm m-4">
  <table class:skeleton={loading} class="table">
    <!-- head -->
    <thead>
      <tr>
        <th>Respondent</th>
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
              <button
                on:click={() => toggle(session.respondentId)}
                class:placeholder={!session.respondent.imageURL}
                class="avatar text-left"
              >
                <div
                  class="bg-secondary text-secondary-content rounded-full w-10"
                >
                  {#if session.respondent.imageURL}
                    <img
                      src={session.respondent.imageURL}
                      alt={session.respondent.email}
                    />
                  {:else}
                    <span class="text-xl"
                      >{session.respondent.email.charAt(0)}</span
                    >
                  {/if}
                </div>
              </button>
              <button
                class="text-sm text-left"
                on:click={() => toggle(session.respondentId)}
              >
                <div class="font-bold">
                  {session.respondent.email}
                </div>
                <div class="text-xs opacity-50">
                  {session.sessions.length} session{session.sessions.length ===
                  1
                    ? ""
                    : "s"}
                </div>
              </button>
            </div>
          </td>
          <td>
            <a
              href={`/systems/${session.respondent.revision.systemId}#${session.respondent.revisionId}`}
            >
              <span>{session.respondent.revision.system.title}</span>
              <br />
              <span class="badge badge-ghost badge-sm"
                >{session.respondent.revision.title}</span
              >
            </a>
          </td>
          <td>
            <a href={`/clients/${session.respondent.revision.system.clientId}`}
              >{session.respondent.revision.system.client.name}</a
            >
          </td>

          <td class="text-right">
            <button on:click={() => toggle(session.respondentId)} class="mr-4">
              <iconify-icon
                class:rotate-180={expanded.includes(session.respondentId)}
                class="text-2xl transition-all duration-300 ease-in-out origin-center"
                icon="mdi:chevron-down"
              ></iconify-icon>
            </button>
          </td>
        </tr>
        {#if expanded.includes(session.respondentId)}
          <tr>
            <td
              class="bg-sus-surface-20 text-sus-surface-20-fg p-3"
              colspan="4"
            >
              <ul class="mx-6">
                {#each session.sessions as s, i}
                  {@const isLast = i === session.sessions.length - 1}
                  <li
                    class="flex items-center gap-2 px-3 bg-neutral-50 rounded-md shadow-sm mb-3 last:mb-0"
                  >
                    <iconify-icon
                      class="text-2xl opacity-30"
                      icon="tabler:live-photo"
                    ></iconify-icon>

                    <a href={`/sessions/${s.id}`} class="text-xs flex-1 py-4">
                      Session on:
                      <strong class="font-bold">
                        {date.format(new Date(s.createdAt))} @ {time.format(
                          new Date(s.createdAt)
                        )}
                      </strong>
                    </a>
                    <div class="flex gap-2">
                      <div class="badge badge-primary text-xs">
                        {s.moments.length} moments
                      </div>
                      <div class="badge badge-secondary text-xs">
                        {s.clips.length} clips
                      </div>
                      {#if s.summarized}
                        <div class="badge badge-accent text-xs">summarized</div>
                      {/if}
                      {#if s.videoURL}
                        <div class="badge badge-ghost text-xs">
                          <iconify-icon icon="carbon:video-filled"
                          ></iconify-icon>
                        </div>
                      {/if}
                    </div>
                    <div class="dropdown dropdown-left rounded-box">
                      <div
                        role="button"
                        tabindex="0"
                        class="btn btn-square btn-ghost btn-sm m-1"
                      >
                        <iconify-icon icon="iconamoon:menu-kebab-vertical-fill"
                        ></iconify-icon>
                      </div>
                      <ul
                        class="dropdown-content menu w-56 bg-neutral rounded-box z-10 shadow"
                      >
                        <li class="text-error">
                          <button on:click={() => (sessionToDelete = s.id)}>
                            Delete!
                          </button>
                        </li>
                      </ul>
                    </div>
                  </li>
                {/each}
              </ul>
            </td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
</div>
<ConfirmDialog
  {confirmText}
  open={!!sessionToDelete}
  on:close={deleteSession}
  bind:elm={confirmElement}
>
  Deleting the client will also delete the related systems/revisions/responses.
</ConfirmDialog>

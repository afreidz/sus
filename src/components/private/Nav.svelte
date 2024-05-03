<script lang="ts">
  let classList: string = "";

  export { classList as class };
</script>

<nav
  class="flex flex-col items-center gap-2 bg-neutral border-r border-neutral-200 p-3 {classList ??
    ''}"
>
  <a
    href="/clients"
    data-tip="Clients and Systems"
    class="btn btn-ghost tooltip tooltip-right tooltip-info flex items-center justify-center group"
  >
    <iconify-icon
      icon="material-symbols:handshake-outline"
      class="text-2xl opacity-30 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
    ></iconify-icon>
  </a>
  <a
    href="/surveys"
    data-tip="Surveys and Checklists"
    class="btn btn-ghost tooltip tooltip-right tooltip-info flex items-center justify-center group"
  >
    <iconify-icon
      icon="ri:survey-line"
      class="text-2xl opacity-30 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
    ></iconify-icon>
  </a>
  <a
    href="/sessions"
    data-tip="Sessions"
    class="btn btn-ghost tooltip tooltip-right tooltip-info flex items-center justify-center group"
  >
    <iconify-icon
      icon="tabler:live-photo"
      class="text-2xl opacity-30 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
    ></iconify-icon>
  </a>
  <a
    href="/analytics"
    data-tip="Practice Analytics"
    class="btn btn-ghost tooltip tooltip-right tooltip-info flex items-center justify-center group"
  >
    <iconify-icon
      icon="material-symbols:analytics-outline"
      class="text-2xl opacity-30 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
    ></iconify-icon>
  </a>
</nav>

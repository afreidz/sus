<script lang="ts">
  import Logo from "@/components/public/Logo.svelte";

  export let system = "";
</script>

<header class="flex-1 flex flex-col justify-center gap-2 -mt-[100%]">
  <Logo />
  <p class="text-sus-surface-40 w-full font-light">
    This survey is designed to help understand the usability of <strong
      class="font-semibold text-neutral-900">{system}</strong
    >. Respondent email addresses are kept confidential and only used internally
    for identification purposes.
  </p>
</header>

<script lang="ts">
  import me from "@/stores/me";
  import { signOut } from "auth-astro/client";

  async function handleSignOut() {
    await signOut();
    window.location.reload();
  }
</script>

{#if $me?.user?.image}
  <div class="flex gap-1 items-center">
    <div class="avatar flex-none w-10 h-10">
      <div class="w-full aspect-square rounded-full">
        <img src={$me.user.image} alt={`Picture of ${$me.user.name}`} />
      </div>
    </div>
    <div
      role="button"
      tabindex="0"
      class="dropdown dropdown-bottom dropdown-end flex-1"
    >
      <div class="btn btn-ghost flex text-left">
        <span class="w-24">{$me?.user?.name}</span>
        <iconify-icon class="opacity-50 text-lg" icon="dashicons:arrow-down"
        ></iconify-icon>
      </div>
      <ul
        class="p-2 shadow menu dropdown-content z-[1] bg-neutral rounded-box w-52"
      >
        <li>
          <button on:click={handleSignOut}>Logout</button>
        </li>
      </ul>
    </div>
  </div>
{/if}

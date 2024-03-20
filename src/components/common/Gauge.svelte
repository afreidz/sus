<script lang="ts">
  let gap = 100;
  let vbw = 10000;
  let vbh = vbw / 2;
  let radius = 4500;
  let className = "";
  let thickness = 800;
  let fullscreen = false;
  let gauge: HTMLDivElement;
  let fullscreenContent: HTMLDivElement;
  let fullscreenDialog: HTMLDialogElement;
  let differential: number | undefined = undefined;
  let differentialSubtitle: string | undefined = undefined;

  function circumference(rad: number) {
    return 2 * Math.PI * rad;
  }

  let scores:
    | [[number, number?]]
    | [[number, number?], [number, number?]]
    | [[number, number?], [number, number?], [number, number?]];

  let keys: [string?, string?, string?] = [];

  const strokes = [
    "stroke-sus-primary-40",
    "stroke-sus-primary-45",
    "stroke-sus-primary-60",
  ];

  const fills = ["bg-sus-primary-40", "bg-sus-primary-45", "bg-sus-primary-60"];

  const bgs = ["bg-bg-neutral", "bg-neutral-100"];
  let activeBg = bgs[0];

  $: if (fullscreenDialog) fullscreenDialog.showModal();

  $: if (fullscreen && fullscreenContent && gauge) {
    fullscreenContent.innerHTML = "";
    fullscreenContent.appendChild(gauge.cloneNode(true));
  }

  $: if (!fullscreen && fullscreenContent) {
    fullscreenContent.innerHTML = "";
  }

  export {
    vbh,
    vbw,
    gap,
    keys,
    radius,
    scores,
    thickness,
    differential,
    className as class,
    differentialSubtitle,
  };
</script>

<div class={`relative ${className ?? ""}`} bind:this={gauge}>
  {#if !fullscreen}
    <button
      on:click={() => (fullscreen = true)}
      class="btn btn-sm btn-outline absolute top-1 right-1 border-current text-current"
    >
      <iconify-icon icon="mdi:arrow-expand-all"></iconify-icon>
    </button>
  {/if}
  <ul class="">
    {#each keys as key, i}
      <li class="flex gap-2 items-center text-[1.1cqh]">
        <i class="w-4 h-4 rounded {fills[i]}"></i>
        {key}
      </li>
    {/each}
  </ul>
  <svg class="w-full !rotate-180" viewBox="0 0 {vbw} {vbh}">
    {#each scores as scoreset, i}
      {#if scoreset}
        {@const sorted = [...scoreset]
          .sort()
          .reverse()
          .filter((s) => s !== undefined)}
        <g>
          <circle
            r={radius - (thickness + gap) * i}
            cx="50%"
            cy="0%"
            fill="none"
            stroke-dasharray={`${circumference(radius - (thickness + gap) * i) / 2}, ${circumference(radius - (thickness + gap) * i)}`}
            class="stroke-sus-primary-20"
            stroke-width={thickness}
          ></circle>
          {#each sorted as score, z}
            {#if score !== undefined}
              <circle
                r={radius - (thickness + gap) * i}
                cx="50%"
                cy="0%"
                fill="none"
                class={strokes[i]}
                class:!stroke-sus-positive-40={z === 0 &&
                  scoreset[1] !== undefined &&
                  scoreset[1] > scoreset[0]}
                class:!stroke-sus-negative-40={z === 0 &&
                  scoreset[1] !== undefined &&
                  scoreset[1] < scoreset[0]}
                stroke-dasharray={`${(score / 100) * (circumference(radius - (thickness + gap) * i) / 2)}, ${circumference(radius - (thickness + gap) * i)}`}
                stroke-width={thickness}
              ></circle>
            {/if}
          {/each}
        </g>
      {/if}
    {/each}
  </svg>
  {#if differential}
    <main
      style={`top: ${(thickness / vbh) * scores.length * 100 + (gap / vbh) * (scores.length + 1) * 100}%; margin-top: ${keys.length * 10}px;`}
      class="flex flex-col items-center justify-center absolute bottom-2 left-1/2 -translate-x-1/2"
    >
      <span class="font-light text-[1.25cqh]">Differential</span>
      {#if differential < 0}
        <strong
          class="text-sus-negative-40 leading-none font-black flex items-center -ml-5"
        >
          <iconify-icon icon="mdi:arrow-down-bold" class="text-xl"
          ></iconify-icon>
          <span class="text-[5cqh]">{Math.abs(differential)}</span>
        </strong>
      {:else}
        <strong
          class="text-sus-positive-40 leading-none font-black flex items-center -ml-5"
        >
          <iconify-icon icon="mdi:arrow-up-bold" class="text-xl"></iconify-icon>
          <span class="text-[5cqh]">{Math.abs(differential)}</span>
        </strong>
      {/if}
      {#if differentialSubtitle}
        <span class="text-[1.25cqh] font-light">{differentialSubtitle}</span>
      {/if}
    </main>
  {/if}
  <footer>
    <ul class="flex">
      {#each scores as scoreset}
        <li
          class="text-[1.1cqh] font-light text-center"
          style={`width: ${100 / (vbw / (gap + thickness))}%;`}
        >
          {scoreset[1] !== undefined
            ? scoreset[1].toFixed(2)
            : scoreset[0].toFixed(2)}
        </li>
      {/each}
    </ul>
  </footer>
</div>
{#if fullscreen}
  <dialog
    class="modal"
    bind:this={fullscreenDialog}
    on:close={() => (fullscreen = false)}
  >
    <div class="modal-box bg-neutral w-full max-w-3xl text-neutral-950">
      <div class="modal-actions flex justify-between items-center mb-4">
        <div class="flex flex-1 gap-2">
          <strong class="inline-block mr-2">Background Color: </strong>
          {#each bgs as bg}
            <button
              class:ring-2={bg === activeBg}
              class="rounded-sm border border-neutral-400 ring-sus-primary-60 ring-offset-1 ring-offset-neutral !w-6 !h-6 !aspect-square {bg}"
              on:click={() => (activeBg = bg)}
            ></button>
          {/each}
        </div>
        <form method="dialog" class="flex-none">
          <button class="btn btn-sm btn-ghost">
            <iconify-icon icon="mdi:close"></iconify-icon>
          </button>
        </form>
      </div>
      <div bind:this={fullscreenContent} class="p-10 rounded {activeBg}"></div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
{/if}

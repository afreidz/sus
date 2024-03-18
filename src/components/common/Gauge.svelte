<script lang="ts">
  let gap = 100;
  let vbw = 10000;
  let vbh = vbw / 2;
  let radius = 4500;
  let thickness = 800;
  let labelClass = "";
  let className = "h-64";
  let revision: string | undefined = undefined;
  let differential: number | undefined = undefined;

  function circumference(rad: number) {
    return 2 * Math.PI * rad;
  }

  let scores:
    | [[number, number?]]
    | [[number, number?], [number, number?]]
    | [[number, number?], [number, number?], [number, number?]];

  const strokes = [
    "stroke-sus-primary-40",
    "stroke-sus-primary-45",
    "stroke-sus-primary-60",
  ];

  export {
    vbh,
    vbw,
    gap,
    radius,
    scores,
    revision,
    thickness,
    labelClass,
    differential,
    className as class,
  };
</script>

<div class="card bg-neutral rounded-lg shadow-sm p-4 w-full max-w-lg">
  <header class="flex gap-2 pb-4 border-b border-neutral-100 mb-4">
    <iconify-icon class="text-2xl mt-1" icon="mdi:speedometer"></iconify-icon>
    <div class="prose">
      <h3 class="mb-1">Score for revision</h3>
      <p class="text-sm text-neutral-400">
        The raw SUS score based on completed respondents for {#if revision}<span
            class="font-semibold text-neutral-950">"{revision}"</span
          >{:else}this revision{/if}.
      </p>
    </div>
  </header>
  <div class={`relative ${className ?? ""}`}>
    <svg class="w-full !rotate-180" viewBox="0 0 {vbw} {vbh}">
      {#each scores as scoreset, i}
        {#if scoreset}
          {@const sorted = [...scoreset].sort().reverse().filter(Boolean)}
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
              {#if score}
                <circle
                  r={radius - (thickness + gap) * i}
                  cx="50%"
                  cy="0%"
                  fill="none"
                  class={strokes[i]}
                  class:!stroke-sus-positive-40={z === 0 &&
                    scoreset[1] &&
                    scoreset[1] > scoreset[0]}
                  class:!stroke-sus-negative-40={z === 0 &&
                    scoreset[1] &&
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
        style={`top: ${(thickness / vbh) * scores.length * 100 + (gap / vbh) * (scores.length + 1) * 100}%`}
        class="flex flex-col items-center justify-center absolute bottom-4 left-1/2 -translate-x-1/2"
      >
        <span>Differential</span>
        {#if differential < 0}
          <strong
            class="text-sus-negative-40 leading-none font-black flex items-center"
          >
            <iconify-icon icon="mdi:arrow-down-bold" class="text-xl"
            ></iconify-icon>
            <span class="text-[5cqh]">{Math.abs(differential)}</span>
          </strong>
        {:else}
          <strong
            class="text-sus-positive-40 leading-none font-black flex items-center"
          >
            <iconify-icon icon="mdi:arrow-up-bold" class="text-xl"
            ></iconify-icon>
            <span class="text-[5cqh]">{Math.abs(differential)}</span>
          </strong>
        {/if}
      </main>
    {/if}
    <footer>
      <ul class="flex">
        {#each scores as scoreset}
          <li class="text-xs font-semibold text-center {labelClass ?? ''}">
            {scoreset[1] ? scoreset[1].toFixed(2) : scoreset[0].toFixed(2)}
          </li>
        {/each}
      </ul>
    </footer>
  </div>
</div>

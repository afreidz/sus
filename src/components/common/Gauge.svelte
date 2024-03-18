<script lang="ts">
  const gap = 50;
  const rad = 4500;
  const thickness = 600;

  function circumference(rad: number) {
    return 2 * Math.PI * rad;
  }

  const score1 = 0.86;
  const score2 = 0.02;

  let canvas: HTMLCanvasElement;
  let svg: HTMLOrSVGElement;

  $: if (canvas && svg) {
    const xml = new XMLSerializer().serializeToString(svg as unknown as Node);
    const svg64 = btoa(xml);
    const img = new Image();

    img.width = 10000;
    img.height = 5000;
    img.src = `data:image/svg+xml;base64,${svg64}`;

    img.onload = () => canvas.getContext("2d")?.drawImage(img, 0, 0);
  }
</script>

<div>
  <svg bind:this={svg} class="h-64 rotate-180" viewBox="0 0 10000 5000">
    <g>
      <circle
        r={rad}
        cx="50%"
        cy="0%"
        fill="none"
        stroke-dasharray={`${circumference(rad) / 2}, ${circumference(rad)}`}
        stroke="#999"
        class="stroke-sus-primary-20"
        stroke-width={thickness}
      ></circle>
      <circle
        r={rad}
        cx="50%"
        cy="0%"
        stroke="#000"
        fill="none"
        stroke-dasharray={`${score1 * (circumference(rad) / 2)}, ${circumference(rad)}`}
        class="stroke-sus-primary-40/60"
        stroke-width={thickness}
      ></circle>
    </g>
    <g>
      <circle
        r={rad - (thickness + gap)}
        cx="50%"
        cy="0%"
        fill="none"
        stroke-dasharray={`${circumference(rad - (thickness + gap)) / 2}, ${circumference(rad - (thickness + gap))}`}
        class="stroke-sus-primary-20"
        stroke="#999"
        stroke-width={thickness}
      ></circle>
      <circle
        r={rad - (thickness + gap)}
        cx="50%"
        cy="0%"
        stroke="#000"
        fill="none"
        stroke-dasharray={`${score1 * (circumference(rad - (thickness + gap)) / 2)}, ${circumference(rad - (thickness + gap))}`}
        class="stroke-sus-positive-30"
        stroke-width={thickness}
      ></circle>
      <circle
        r={rad - (thickness + gap)}
        cx="50%"
        cy="0%"
        fill="none"
        stroke="#777"
        stroke-dasharray={`${score2 * (circumference(rad - (thickness + gap)) / 2)}, ${circumference(rad - (thickness + gap))}`}
        class="stroke-sus-primary-40"
        stroke-width={thickness}
      ></circle>
    </g>
    <g>
      <circle
        r={rad - (thickness + gap) * 2}
        cx="50%"
        cy="0%"
        fill="none"
        stroke-dasharray={`${circumference(rad - (thickness + gap) * 2) / 2}, ${circumference(rad - (thickness + gap) * 2)}`}
        stroke="#999"
        class="stroke-sus-primary-20"
        stroke-width={thickness}
      ></circle>
      <circle
        r={rad - (thickness + gap) * 2}
        cx="50%"
        cy="0%"
        stroke="#000"
        fill="none"
        stroke-dasharray={`${0.5 * (circumference(rad - (thickness + gap) * 2) / 2)}, ${circumference(rad - (thickness + gap) * 2)}`}
        class="stroke-sus-primary-60"
        stroke-width={thickness}
      ></circle>
    </g>
  </svg>
  <!-- <canvas class="rotate-180 h-64" bind:this={canvas}></canvas> -->
</div>

import daisyUI from "daisyui";
import typography from "@tailwindcss/typography";
import defaultTheme from "tailwindcss/defaultTheme";
import containerQuery from "@tailwindcss/container-queries";

const surface_bg = {
  0: "#FFFFFF",
  10: "#F2F5F7",
  20: "#DCE3E8",
  30: "#C1CCD6",
  40: "#9FB1BD",
  60: "#5B7282",
  70: "#3E5463",
  80: "#2A3F4D",
  90: "#1C2B36",
  100: "#000000",
};
const surface_fg = {
  0: surface_bg[90],
  10: surface_bg[90],
  20: surface_bg[90],
  30: surface_bg[90],
  40: surface_bg[90],
  60: surface_bg[10],
  70: surface_bg[10],
  80: surface_bg[10],
  90: surface_bg[10],
  100: surface_bg[0],
};

const positive_bg = {
  0: "#FFFFFF",
  10: "#EBF7ED",
  20: "#C7EBD1",
  30: "#88DBA8",
  40: "#43C478",
  50: "#16A163",
  60: "#077D55",
  70: "#075E45",
  80: "#094536",
  90: "#092E25",
  100: "#081A15",
};
const positive_fg = {
  0: surface_bg[90],
  10: surface_bg[90],
  20: surface_bg[90],
  30: surface_bg[90],
  40: surface_bg[90],
  50: surface_bg[90],
  60: surface_bg[10],
  70: surface_bg[10],
  80: surface_bg[10],
  90: surface_bg[10],
  100: surface_bg[10],
};

const negative_bg = {
  0: "#FFFFFF",
  10: "#fde7ea",
  20: "#f9b8c1",
  30: "#f47183",
  40: "#f04259",
  50: "#ec1330",
  60: "#d4112b",
  70: "#a50d22",
  80: "#760a18",
  90: "#47060e",
  100: "#180205",
};
const negative_fg = {
  0: surface_bg[90],
  10: surface_bg[90],
  20: surface_bg[90],
  30: surface_bg[90],
  40: surface_bg[90],
  50: surface_bg[90],
  60: surface_bg[10],
  70: surface_bg[10],
  80: surface_bg[10],
  90: surface_bg[10],
  100: surface_bg[10],
};

const warm_bg = {
  0: "#ffffff",
  10: "#fef9c3",
  20: "#fef08a",
  30: "#fde047",
  40: "#facc15",
  50: "#eab308",
  60: "#ca8a04",
  70: "#a16207",
  80: "#854d0e",
  90: "#713f12",
  100: "#422006",
};

const warm_fg = {
  0: surface_bg[90],
  10: surface_bg[90],
  20: surface_bg[90],
  30: surface_bg[90],
  40: surface_bg[90],
  50: surface_bg[90],
  60: surface_bg[90],
  70: surface_bg[10],
  80: surface_bg[10],
  90: surface_bg[10],
  100: surface_bg[10],
};

const primary_bg = {
  0: "#ffffff",
  20: "#d0effb",
  40: "#67ACB6",
  60: "#0A506A",
  80: "#04232f",
};
const primary_fg = {
  0: surface_bg[90],
  20: surface_bg[90],
  40: surface_bg[90],
  60: surface_bg[10],
  80: surface_bg[10],
};

type TailwindColorPalette = Record<
  number | string,
  { fg: string, bg: string, DEFAULT: string }
>;
type RawColorPalette = Record<number | string, string>;

function colorMap(bgPalette: RawColorPalette, fgPalette: RawColorPalette) {
  const colors: TailwindColorPalette = {};

  Object.keys(bgPalette).forEach((k) => {
    colors[k] = {
      DEFAULT: bgPalette[k],
      fg: fgPalette[k],
      bg: bgPalette[k],
    };
  });

  return colors;
}

export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    fontFamily: {
      sans: [
        "ui-sans-serif",
        "system-ui",
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI,Roboto",
        "Helvetica Neue",
        "Arial",
        "Noto Sans",
        "sans-serif",
        "Apple Color Emoji",
        "Segoe UI Emoji",
        "Segoe UI Symbol",
        "Noto Color Emoji",
      ],
      mono: ["IBM Plex Mono", ...defaultTheme.fontFamily.mono],
    },
    colors: {
      sus: {
        warm: colorMap(warm_bg, warm_fg),
        primary: colorMap(primary_bg, primary_fg),
        surface: colorMap(surface_bg, surface_fg),
        positive: colorMap(positive_bg, positive_fg),
        negative: colorMap(negative_bg, negative_fg),
      },
    },
    extend: {},
  },
  daisyui: {
    themes: [
      {
        base: {
          info: surface_bg[60],
          warning: warm_bg[50],
          accent: primary_bg[20],
          neutral: surface_bg[0],
          error: negative_bg[50],
          primary: primary_bg[60],
          success: positive_bg[50],
          secondary: primary_bg[40],
          "base-100": surface_bg[10],
          "--rounded-box": "0.5rem",
          "--rounded-btn": "0.25rem",
          "--rounded-badge": "1rem",
          "--tab-radius": "0.5rem",
        },
      },
    ],
  },
  plugins: [typography, containerQuery, daisyUI],
};

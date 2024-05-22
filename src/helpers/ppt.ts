import powerpoint from "pptxgenjs";
import type { APIResponses } from "@/helpers/api";
import { generateBase64FromSVG } from "@/helpers/media";
import { calculateSUSScoreFromRespondent } from "./score";

type Revision = APIResponses["summarizeRevision"]["GET"];

type Session =
  | APIResponses["sessionId"]["GET"]
  | APIResponses["summarizeSession"]["GET"];

type Respondent =
  | APIResponses["sessionId"]["GET"]["respondent"]
  | APIResponses["summarizeRevision"]["GET"]["respondents"][number];

export enum SchemeColor {
  "brand" = "#D90E2B",
  "base-100" = "#F5F5F5",
  "primary" = "#0A506A",
  "positive" = "#43C478",
  "negative" = "#ec1330",
  "subtle" = "#2D2D2D",
}

const LEFT_EDGE = 0.25;
const IMAGE_SIZE = 1;

const MASTER: powerpoint.SlideMasterProps = {
  title: "MASTER_SLIDE",
  background: { color: "FFFFFF" },
  objects: [
    {
      rect: {
        x: 0,
        y: 0,
        w: "100%",
        h: 0.1,
        fill: { color: SchemeColor.brand },
      },
    },
    {
      text: {
        text: "© Hitachi Solutions",
        options: {
          y: "96%",
          w: "100%",
          fontSize: 8,
          x: LEFT_EDGE,
          align: "center",
          color: SchemeColor.subtle,
          fontFace: "Segoe UI Light",
        },
      },
    },
  ],
};

function addSectionTitle(t: string, slide: powerpoint.Slide) {
  slide.addText(t, {
    shape: "rect",
    y: 0.4,
    h: 0.3,
    w: "30%",
    bold: true,
    x: LEFT_EDGE,
    fontSize: 11,
    charSpacing: 3,
    indentLevel: 2,
    valign: "middle",
    color: SchemeColor.primary,
    fill: { color: SchemeColor["base-100"] },
  });
}

function addRespondentImage(r: Respondent, slide: powerpoint.Slide) {
  if (r.imageURL) {
    slide.addImage({
      path: r.imageURL,
      y: 0.8,
      x: LEFT_EDGE,
      h: IMAGE_SIZE,
      w: IMAGE_SIZE,
      rounding: true,
    });
  }
}

function addRespondentName(r: Respondent, slide: powerpoint.Slide) {
  slide.addText(r.name ?? r.email, {
    y: 1.2,
    bold: true,
    fontSize: 29,
    x: LEFT_EDGE + IMAGE_SIZE + 0.05,
  });
}

function addRespondentTitle(r: Respondent, slide: powerpoint.Slide) {
  if (!r.title) return;

  slide.addText(r.title, {
    y: 1.6,
    fontSize: 14,
    x: LEFT_EDGE + IMAGE_SIZE + 0.05,
  });
}

function bulletedText(t: string) {
  return [
    {
      text: " ",
      options: {
        color: SchemeColor.brand,
        bullet: { characterCode: "007C", indent: 6 },
      },
    },
    {
      text: t,
      options: { bold: true },
    },
  ];
}

function addRespondentProfile(r: Respondent, slide: powerpoint.Slide) {
  if (!r.profile) return;

  slide.addText(bulletedText("Profile"), {
    y: 2.125,
    w: "50%",
    fontSize: 14,
    x: LEFT_EDGE - 0.12,
  });

  slide.addText(r.profile, {
    y: 2.3,
    w: "45%",
    fontSize: 12,
    x: LEFT_EDGE,
    valign: "top",
  });
}

function addRevisionSummary(r: Revision, slide: powerpoint.Slide) {
  if (!r.summary) return;

  slide.addText(bulletedText("Summary"), {
    y: 2.125,
    w: "50%",
    fontSize: 14,
    x: LEFT_EDGE - 0.12,
  });

  slide.addText(r.summary.text, {
    y: 2.3,
    w: "45%",
    fontSize: 12,
    x: LEFT_EDGE,
    valign: "top",
  });
}

const BOTTOM_SECTION_Y = 3.5;
function addFeedbackSummary(s: Session, slide: powerpoint.Slide) {
  if (!s.feedback.length) return;

  slide.addText(bulletedText("Feedback"), {
    y: BOTTOM_SECTION_Y,
    w: "33%",
    fontSize: 14,
    x: LEFT_EDGE - 0.12,
  });

  slide.addText(
    s.feedback.map((f) => ({
      text: f.text,
      options: { bullet: { indent: 8 } },
    })),
    {
      w: "33%",
      fontSize: 10,
      x: LEFT_EDGE,
      valign: "top",
      lineSpacing: 14,
      y: BOTTOM_SECTION_Y + 0.2,
    }
  );
}

function addResultsSummary(s: Session, slide: powerpoint.Slide) {
  if (!s.results.length) return;

  slide.addText(bulletedText("User Test Results"), {
    y: BOTTOM_SECTION_Y,
    w: "33%",
    x: "34%",
    fontSize: 14,
  });

  slide.addText(
    s.results.map((f) => ({
      text: f.text,
      options: { bullet: { indent: 8 } },
    })),
    {
      w: "30%",
      x: "35.5%",
      fontSize: 10,
      valign: "top",
      lineSpacing: 14,
      y: BOTTOM_SECTION_Y + 0.2,
    }
  );
}

function addSuggestionsSummary(s: Session, slide: powerpoint.Slide) {
  if (!s.suggestions.length) return;

  slide.addText(bulletedText("Suggestions"), {
    y: BOTTOM_SECTION_Y,
    w: "30%",
    x: "66%",
    fontSize: 14,
  });

  slide.addText(
    s.suggestions.map((f) => ({
      text: f.text,
      options: { bullet: { indent: 8 } },
    })),
    {
      w: "30%",
      x: "67.5%",
      fontSize: 10,
      valign: "top",
      lineSpacing: 14,
      y: BOTTOM_SECTION_Y + 0.2,
    }
  );
}

function addSUSResults(
  chart: SVGSVGElement,
  slide: powerpoint.Slide,
  scores: [number, number],
  label: string
) {
  const { data, aspect } = generateBase64FromSVG(chart);

  slide.addShape("rect", {
    w: 4.5,
    y: 0.4,
    x: "50%",
    h: 4 * aspect + 0.5,
    fill: { color: SchemeColor["base-100"] },
  });

  slide.addText("SUS Score", {
    y: 0.625,
    x: 5.125,
    bold: true,
    fontSize: 11,
  });

  slide.addImage({
    data,
    w: 4,
    y: 0.6,
    x: 5.25,
    rotate: 180,
    h: 4 * aspect,
  });

  const score = scores[0] - scores[1];
  slide.addText(`${score}`, {
    w: 4,
    y: 2,
    x: 5.25,
    bold: true,
    fontSize: 50,
    align: "center",
    color: score > 0 ? SchemeColor.positive : SchemeColor.negative,
  });

  slide.addText(label, {
    w: 4,
    y: 2.5,
    x: 5.25,
    fontSize: 12,
    align: "center",
    fontFace: "Segoe UI Light",
  });

  slide.addText(` ${scores[0]}    ${scores[1]}`, {
    y: 2.7,
    x: 5.25,
    fontSize: 11,
    fontFace: "Segoe UI Light",
  });
}

export async function generateRespondentSlide(
  session: Session,
  presentation?: powerpoint,
  chart?: SVGSVGElement,
  skipSave?: boolean
) {
  const pres = presentation || new powerpoint();

  if (!presentation) {
    pres.defineSlideMaster(MASTER);
    pres.layout = "LAYOUT_16x9";
    pres.theme = { headFontFace: "Segoe UI", bodyFontFace: "Segoe UI" };
  }

  const slide = pres.addSlide({ masterName: "MASTER_SLIDE" });
  const resp = session.respondent;

  addSectionTitle("PARTICIPANTS", slide);
  addRespondentName(resp, slide);
  addRespondentImage(resp, slide);
  addRespondentTitle(resp, slide);
  addRespondentProfile(resp, slide);

  addResultsSummary(session, slide);
  addFeedbackSummary(session, slide);
  addSuggestionsSummary(session, slide);

  if (chart && resp) {
    addSUSResults(
      chart,
      slide,
      [calculateSUSScoreFromRespondent(resp), 50],
      "Differential to Benchmark"
    );
  }

  if (!skipSave) pres.writeFile({ fileName: `session_${session.id}.ppt` });
}

export async function generateRevisionPresentation(
  revision: APIResponses["summarizeRevision"]["GET"],
  charts?: {
    respondent: APIResponses["summarizeRevision"]["GET"]["respondents"][number];
    chart?: SVGSVGElement;
  }[]
) {
  const pres = new powerpoint();

  pres.layout = "LAYOUT_16x9";
  pres.theme = { headFontFace: "Segoe UI", bodyFontFace: "Segoe UI" };
  pres.defineSlideMaster(MASTER);

  const sessions = revision.respondents
    .map((r) => r.sessions.filter((s) => s.summarized))
    .flat();

  await Promise.all(
    sessions.map((s) => {
      const respondentChart = charts?.find(
        (c) => s.respondentId === c.respondent.id
      );
      return generateRespondentSlide(s, pres, respondentChart?.chart, true);
    })
  );

  const slide = pres.addSlide({ masterName: "MASTER_SLIDE" });
  addSectionTitle("FINDINGS", slide);
  addRevisionSummary(revision, slide);

  pres.writeFile({
    fileName: `${revision.system.client.name}-${revision.system.title}-${revision.title}-readout.ppt`,
  });
}

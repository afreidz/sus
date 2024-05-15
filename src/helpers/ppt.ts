import powerpoint from "pptxgenjs";
import type { APIResponses } from "@/helpers/api";
import { generateBase64FromSVG } from "@/helpers/media";

type Session =
  | APIResponses["sessionId"]["GET"]
  | APIResponses["summarizeSession"]["GET"];

export enum SchemeColor {
  "brand" = "#D90E2B",
  "base-100" = "#F5F5F5",
  "primary" = "#0A506A",
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
  ],
};

function addSectionTitle(t: string, slide: powerpoint.Slide) {
  slide.addText("PARTICIPANTS", {
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

function addRespondentImage(r: Session["respondent"], slide: powerpoint.Slide) {
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

function addRespondentName(r: Session["respondent"], slide: powerpoint.Slide) {
  slide.addText(r.name ?? r.email, {
    y: 1.2,
    bold: true,
    fontSize: 29,
    x: LEFT_EDGE + IMAGE_SIZE + 0.05,
  });
}

function addRespondentTitle(r: Session["respondent"], slide: powerpoint.Slide) {
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

function addRespondentProfile(
  r: Session["respondent"],
  slide: powerpoint.Slide
) {
  if (!r.profile) return;

  slide.addText(bulletedText("Profile"), {
    y: 2.125,
    w: "50%",
    fontSize: 14,
    x: LEFT_EDGE - 0.12,
  });

  slide.addText(r.profile, {
    y: 2.6,
    w: "50%",
    fontSize: 14,
    x: LEFT_EDGE,
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
      fontSize: 11,
      x: LEFT_EDGE,
      valign: "top",
      lineSpacing: 18,
      y: BOTTOM_SECTION_Y + 0.2,
    }
  );
}

function addResultsSummary(s: Session, slide: powerpoint.Slide) {
  if (!s.results.length) return;

  slide.addText(bulletedText("Task Results"), {
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
      fontSize: 11,
      valign: "top",
      lineSpacing: 18,
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
      fontSize: 11,
      valign: "top",
      lineSpacing: 18,
      y: BOTTOM_SECTION_Y + 0.2,
    }
  );
}

async function addSUSResults(chart: SVGSVGElement, slide: powerpoint.Slide) {
  const { data, aspect } = generateBase64FromSVG(chart);
  slide.addImage({
    data,
    w: 4,
    y: 0.4,
    x: "50%",
    rotate: 180,
    h: 4 * aspect,
  });
}

export async function generateRespondentSlide(
  session: Session,
  chart?: SVGSVGElement
) {
  const pres = new powerpoint();
  pres.defineSlideMaster(MASTER);

  pres.layout = "LAYOUT_16x9";
  pres.theme = { headFontFace: "Segoe UI", bodyFontFace: "Segoe UI" };

  const slide = pres.addSlide({ masterName: "MASTER_SLIDE" });

  addSectionTitle("PARTICIPANTS", slide);
  addRespondentName(session.respondent, slide);
  addRespondentImage(session.respondent, slide);
  addRespondentTitle(session.respondent, slide);
  addRespondentProfile(session.respondent, slide);

  addResultsSummary(session, slide);
  addFeedbackSummary(session, slide);
  addSuggestionsSummary(session, slide);

  if (chart) await addSUSResults(chart, slide);

  pres.writeFile({ fileName: `session_${session.id}.ppt` });
}

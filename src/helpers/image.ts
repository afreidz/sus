import { Buffer } from "buffer";

const maxWidth = import.meta.env.PUBLIC_IMG_MAX_WIDTH || 300;

export function fileToResizedDataURI(imageFile: File) {
  return new Promise<string>((r, x) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target?.result) return x();

      const img = document.createElement("img");
      img.onload = function () {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) return x();

        const aspect =
          img.width > img.height
            ? img.height / img.width
            : img.width / img.height;
        const w = Math.min(maxWidth, img.width);
        const h = w * aspect;

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        r(canvas.toDataURL(imageFile.type));
      };
      img.src = e.target.result as string;
    };
    reader.readAsDataURL(imageFile);
  });
}

export function dataURItoBuffer(dataURI?: string): Buffer | null {
  if (!dataURI) return null;

  const base64 = dataURI.split(",")[1];
  return Buffer.from(base64, "base64");
}

export function bufferToDataUri(
  mimeType: string,
  array: ArrayBufferLike
): string {
  const buffer = Buffer.from(array);
  let base64 = buffer.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

type QuestionGroup = {
  media?: string;
  mime?: string;
  tasks: { id?: string; text: string }[];
};

export function groupByDataUri(
  arr: {
    media: Buffer | null;
    mediaMIME: string | null;
    text: string;
    [k: string]: any;
  }[]
): QuestionGroup[] {
  return arr.reduce((current, question) => {
    const key =
      question.media && question.mediaMIME
        ? bufferToDataUri(question.mediaMIME, question.media)
        : undefined;
    const exists = current.find((i) => i.media === key);

    if (!exists)
      current.push({
        media: key,
        tasks: [],
        mime: question.mediaMIME ?? undefined,
      });

    current.find((i) => i.media === key)?.tasks.push({ ...question });

    return current;
  }, [] as QuestionGroup[]);
}

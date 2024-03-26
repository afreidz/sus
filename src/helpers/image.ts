import { Buffer } from "buffer";

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

import { bufferToDataUri } from "./media";
import type { APIResponses } from "./api";
import type { TasklistSection } from "@/components/private/TasklistCreate.svelte";

export function orderByKey<
  K extends string,
  T extends {
    [P in K]: string;
  } & Record<string, unknown>,
>(order: T[K][], array: T[], key: K) {
  const map = new Map(array.map((obj) => [obj[key], obj]));
  const ordered = order.map((id) => map.get(id)).filter(Boolean) as T[];
  const remaining = array.filter((obj) => !ordered.includes(obj));
  return [...ordered, ...remaining];
}

export function orderResponseByNumericalValue<
  T extends { numericalValue: number | null },
>(r: T[]) {
  return r.some((r) => r.numericalValue === null)
    ? r
    : r.sort((a, b) => {
        return (b.numericalValue as number) - (a.numericalValue as number);
      });
}

export function groupTasklistSectionByDataUri(
  arr: APIResponses["revisionId"]["GET"]["surveys"][number]["questions"]
): TasklistSection[] {
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
  }, [] as TasklistSection[]);
}

export function groupTaskListSection(
  arr: APIResponses["revisionId"]["GET"]["surveys"][number]["questions"]
): TasklistSection[] {
  return arr.reduce((current, question) => {
    const group = question.group || undefined;
    const exists = current.find((i) => i.group === group);

    const media =
      question.media && question.mediaMIME
        ? bufferToDataUri(question.mediaMIME, question.media)
        : undefined;

    if (!exists)
      current.push({
        group,
        media,
        tasks: [],
        mime: question.mediaMIME ?? undefined,
      });

    current.find((i) => i.group === group)?.tasks.push({ ...question });

    return current;
  }, [] as TasklistSection[]);
}

export function removeDuplicatesById<
  T extends { id: string; [key: string]: any },
>(arr: T[]) {
  const uniqueArray = arr.filter(
    (item, index, self) =>
      index === self.findIndex((t: (typeof arr)[number]) => t.id === item.id)
  );
  return uniqueArray;
}

type DateOrderable = {
  timestamp: Date;
  [key: string]: any;
};
export function orderByDate<T extends DateOrderable[]>(array: T) {
  return array.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export function reorderArray<T>(array: T[], index: number) {
  if (index < 0 || index >= array.length) {
    throw new Error("Index out of bounds");
  }

  // If the index is already the first element, return a copy of the array.
  if (index === 0) {
    return array.slice();
  }

  // Create a new array with the item at `index` at the first position,
  // followed by the items before and after it.
  return [array[index], ...array.slice(0, index), ...array.slice(index + 1)];
}

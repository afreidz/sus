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

export function groupTaskListSection(
  arr: APIResponses["revisionId"]["GET"]["surveys"][number]["questions"]
): TasklistSection[] {
  return arr.reduce((current, question) => {
    const group = question.group || undefined;
    const imageURL = question.imageURL ?? undefined;
    const exists = current.find((i) => i.group === group);

    if (!exists)
      current.push({
        group,
        imageURL,
        tasks: [],
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
  time: Date;
  [key: string]: any;
};

export function orderByDate<T extends DateOrderable[]>(array: T) {
  return array.sort((a, b) => {
    const atime = new Date(a.time);
    const btime = new Date(b.time);
    return atime.getTime() - btime.getTime();
  });
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

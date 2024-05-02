export const safeTextRegEx = new RegExp(
  `[A-Za-z0-9\x22\.\\-\\s\\{\\}\\(\\)\\[\\],_']*`
);

export function getAverageResponseLabel<
  T extends { numericalValue: number | null },
>(responses: T[], possible: { label: string; value: number }[]): string {
  // Check if the array is not empty
  if (responses.length === 0) return "none";

  const filteredResponses = responses.filter(
    (r) => r.numericalValue !== null
  ) as { numericalValue: number }[];

  // Sum all the response values
  let sum = filteredResponses.reduce(
    (total, response) => total + response.numericalValue,
    0
  );

  // Calculate the average
  let average = Math.round(sum / responses.length);

  // Find and return the corresponding label
  let label = possible.find((response) => response.value === average);

  if (label) {
    return label.label;
  } else {
    throw new Error("Average value does not correspond to any label");
  }
}

export function averageOccurringString(arr: string[]): string | null {
  let frequencyMap: { [key: string]: number } = {};

  for (let str of arr) {
    if (str in frequencyMap) {
      frequencyMap[str]++;
    } else {
      frequencyMap[str] = 1;
    }
  }

  let totalFrequency: number = 0;
  let totalStrings: number = 0;
  for (let str in frequencyMap) {
    totalFrequency += frequencyMap[str];
    totalStrings++;
  }
  let averageFrequency: number = totalFrequency / totalStrings;

  let closestString: string | null = null;
  let closestDifference = Number.MAX_VALUE;
  for (let str in frequencyMap) {
    let difference = Math.abs(frequencyMap[str] - averageFrequency);
    if (difference < closestDifference) {
      closestDifference = difference;
      closestString = str;
    }
  }

  return closestString;
}

export const safeTextRegEx = /^[\w\.\- ]+$/;

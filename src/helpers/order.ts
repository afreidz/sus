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

type StrData = Record<string, (string|undefined)[]>;

export function transform(data: StrData) {
  const res: Record<string, number[]> = {};
  for (const col in data) {
    res[col] = data[col].map(x => Number(x));
  }
  return res;
}

export type CsvOptions = {
  delimiter?: string,
  rows?: number,
}
export type Schema = { header: string, values: ColumnSchema }[];
export type ColumnSchema = () => string;

function generateValue(schema: ColumnSchema) {
  return schema();
}

function generateHeader(schema: Schema, opts?: CsvOptions) {
  const headers = schema.map(def => def.header);
  return headers.join(opts?.delimiter ?? ',');
}


function generateRow(schema: Schema, opts?: CsvOptions) {
  const rowValues = [];
  for (const def of schema) {
    rowValues.push(generateValue(def.values));
  }
  return rowValues.join(opts?.delimiter ?? ',');
}

export function generateCsv(schema: Schema, opts?: CsvOptions) {
  const header = generateHeader(schema, opts);
  const rows = Array.from({ length: opts?.rows ?? 10 }).map(_ => generateRow(schema, opts));
  const allRows = [header, ...rows];
  return allRows.join("\n");
}

export function genBigCsv() {
  const vals = [234, 3.41347, 0, 10000, 239214, 34];
  const genCol = (i: number): Schema[0] => {
    const name = Bun.hash(i.toString()).toString();
    const val = () => vals[Math.floor(i % vals.length)].toString();
    return { header: name, values: val };
  };
  const schema = Array.from({ length: 278 }).map((_, i) => genCol(i));
  return generateCsv(schema, { rows: 3600 });
}


export function parseCsvString(csv: string) {
  const [headerStr, ...rowsStr] = csv.trim().split('\n'); 
  const header = headerStr.split(',').map(head => head.trim());
  const rows = rowsStr.map(rowStr => rowStr.split(',').map(val => val.trim()));
  const columns: Record<string, (undefined|string)[]> = {};
  header.forEach(x => { columns[x] = []; });
  for (const row of rows) {
    const maxLen = Math.min(row.length, header.length);
    for (let i = 0; i < maxLen; i++) {
      columns[header[i]].push(row[i]);
    }
    for (let i = rows.length; i < header.length; i++) {
      columns[header[i]].push(undefined);
    }
  }
  return columns;
}

import { expect, it } from "bun:test";
import { Schema, genBigCsv, generateCsv, parseCsvString } from "./csv";
import path from "path";

const exampleSchema: Schema = [
  { header: 'idx', values: () => 'x' },
  { header: 'num', values: () => Number(1).toString() },
]; 

const csvStr = `idx,num
x,1
x,1`;

const rootPath = path.join(import.meta.dir, '..');
const csvDir = path.join(rootPath, 'test/exampleCsvs');
const big = Bun.file(path.join(csvDir, 'big.csv'));

it('should generate csv', () => {
  const csv = generateCsv(exampleSchema, { rows: 2 });
  expect(csv).toEqual(csvStr);
});

it('should parse big csv', async () => {
  const csv = await big.text();
  const columns =parseCsvString(csv);  
  expect(columns).toBeDefined();
  expect(Object.keys(columns)).toHaveLength(278);
  for (const col in columns) {
    expect(columns[col]).toHaveLength(3600);
  }
});

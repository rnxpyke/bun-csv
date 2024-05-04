import path from "path";
import { parseCsvString } from "./csv";
import { expect, it } from "bun:test";
import { transform } from "./columnTransform";

const rootPath = path.join(import.meta.dir, '..');
const csvDir = path.join(rootPath, 'test/exampleCsvs');
const big = Bun.file(path.join(csvDir, 'big.csv'));

const data = parseCsvString(await big.text());

it('should transform big csv', async () => {
  const transformed = transform(data);   
  expect(transformed).toBeDefined();
});


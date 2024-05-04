import path from "path";
import { CsvConsumer, CsvStuff } from "..";
import { describe, expect, it } from "bun:test";
import { parseCsvString } from "../src/csv";
import { transform } from "../src/columnTransform";

async function netStoreCsv(url: URL | string, name: string) {
  const dest = path.join(import.meta.dir, 'exampleCsvs', name);
  await Bun.write(dest, await fetch(url));
}


const examples = ['mcu.csv', 'big.csv'].map(name => path.join(import.meta.dir, 'exampleCsvs', name));
// console.log(examples);

describe('StreamParser', () => {
  it('should parse example csv', async () => {
    const columns = {};
    await Bun.file(examples[0]).stream().pipeThrough(new CsvStuff()).pipeTo(new CsvConsumer(columns));  
    expect(columns).toMatchSnapshot();
  });

  it('should parse big csv', async () => {
    const columns = {};
    await Bun.file(examples[1]).stream(1023).pipeThrough(new CsvStuff()).pipeTo(new CsvConsumer(columns));  
    console.log('parsed');
  });

  it('should match events', async () => {
    const transform = new CsvStuff();
    const res = Bun.file(examples[0]).stream().pipeThrough(transform);
    const reader = transform.readable.getReader();
    const chunks = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) { break; }
      chunks.push(value);
    }

    expect(chunks).toMatchSnapshot();
  });


  it('should match fast parser', async () => {
    const columns = {};
    await Bun.file(examples[0]).stream().pipeThrough(new CsvStuff()).pipeTo(new CsvConsumer(columns));  
    const text = await Bun.file(examples[0]).text();
    expect(columns).toEqual(parseCsvString(text));
  });
})


describe('FastParser', () => {
  it('should parse example csv', async () => {
    const text = await Bun.file(examples[0]).text()
    const columns = parseCsvString(text);
    expect(columns).toMatchSnapshot();
  });
});


describe('process', () => {
  it('should parse and transform big file', async () => {
    const text = await Bun.file(examples[1]).text();
    const columns = parseCsvString(text);
    const transformed = transform(columns);
    expect(transformed).toBeDefined();
  });
});

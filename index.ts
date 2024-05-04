
const Newline = Symbol('newline');

export class TakeStream extends TransformStream {
  pulls = 0;
  constructor(public maxPulls: number) {
    super({
      transform: (chunk, controller) => {
        if (this.pulls >= this.maxPulls) {
          controller.terminate();
          return;
        }
        this.pulls += 1;
        controller.enqueue(chunk);
      }
    })
  }
}

export class CsvStuff extends TransformStream<Uint8Array, Uint8Array | typeof Newline> {
  last: Uint8Array|undefined = undefined;
  nextIdx(chunk) {
    const comma = chunk.indexOf(0x2c);
    const newline =  chunk.indexOf(0x0a);
    if (comma === -1) {
      return newline;
    }
    if (newline === -1) {
      return comma;
    }
    if (comma < newline) {
      return comma;
    } else {
      return newline;
    }
  }
  constructor() {
    super({
      transform: (chunk, controller) => {
        let cur = chunk;
        if (this.last !== undefined) {
          const next = this.nextIdx(cur);
          if (next !== -1) {
            const merged = new Uint8Array(this.last.length + next);
            merged.set(this.last);
            merged.set(cur.subarray(0, next), this.last.length);
            //console.log(merged, this.last, cur.slice(0, next));
            controller.enqueue(merged);
            if (cur[next] == 0x0a) {
              controller.enqueue(Newline);
            }
            this.last = undefined;
            cur = cur.slice(next + 1);
          } else {
            throw 'shouldnt happen';
            // TODO: this is a memory leak
            const merged = new Uint8Array(this.last.length + cur.length);
            merged.set(this.last);
            merged.set(cur, this.last.length);
            return;
          }
        }
        for (;;) {
          const next = this.nextIdx(cur);
          if (next === -1) { break; }
          controller.enqueue(cur.slice(0, next));
          if (cur[next] === 0x0a) { controller.enqueue(Newline); }
          // this should be a shallow copy, so don't use slice here
          cur = cur.subarray(next+1);
        }
        this.last = cur;
      },
    }, 
      new ByteLengthQueuingStrategy({ highWaterMark: 1024, })
    )
  }
}

export class CsvConsumer extends WritableStream {
  headers: string[] = [];
  columns: Record<string, (undefined|string)[]> = {};
  decoder = new TextDecoder();
  row = 0;
  col = 0;
  constructor(output: Record<string, (undefined|string)[]>) {
    super({
      write: (chunk, controller) => {
        if (chunk === Newline) {
          if (this.col !== 0) {
            // fill all columns: 
            for (let i = this.col; i < this.headers.length; i++) {
              this.columns[this.headers[i]].push(undefined);
            }
            this.row += 1;
            this.col = 0;
            return;
          }
        }
        const text = this.decoder.decode(chunk).trim();
        
        if (this.row === 0) {
          this.headers.push(text);
        } else if (this.col < this.headers.length) {
          this.columns[this.headers[this.col]] ??= [];
          this.columns[this.headers[this.col]].push(text);
        }
        this.col += 1;
      },
      close: () => {
        Object.assign(output, this.columns);
      }
    })
  }
}

async function csvDownload(url) {
  const res: Response = await fetch(url);
  const cols = {};
  const pipe = await res.body!.pipeThrough(new CsvStuff()).pipeTo(new CsvConsumer(cols));
  return cols;
}

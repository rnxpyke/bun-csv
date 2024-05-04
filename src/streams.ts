export function chain(...readers: ReadableStream[]) {
  const { readable, writable } = new TransformStream();
  const pipe = readers.reduce((a, read, i, arr) => 
    a.then(() => read.pipeTo(writable, { preventClose: i + 1 != arr.length })),
    Promise.resolve()
  );
  return { readable, pipe };
}



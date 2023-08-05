export async function download(uri: string, path: string) {
  console.log("downloading", uri, "to", path);
  const fs = require("fs");
  const { Readable } = require("stream");
  const { finished } = require("stream/promises");

  const stream = fs.createWriteStream(path);
  const { body } = await fetch(uri);
  await finished(Readable.fromWeb(body).pipe(stream));
}

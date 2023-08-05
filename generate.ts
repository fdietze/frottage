import "dotenv/config";
import { Midjourney } from "midjourney";
import fs from "fs";
async function main() {
  const client = new Midjourney({
    ServerId: <string> process.env.SERVER_ID,
    ChannelId: <string> process.env.CHANNEL_ID,
    SalaiToken: <string> process.env.SALAI_TOKEN,
    Debug: true,
    Ws: true, //enable ws is required for remix mode (and custom zoom)
  });

  // synchronously read all files in prompts folder into an Array[{filename: string, prompt: string}]
  const prompts = fs.readdirSync("./prompts").map((filename) => ({
    filename,
    prompt: fs.readFileSync(`prompts/${filename}`, "utf8"),
  }));
  console.log(prompts);

  // schedule imagines for prompts
  // and wait for all to finish
  await client.init();
  const results = await Promise.all(
    prompts.map(async (prompt, i) => {
      // wait between each prompt
      await new Promise((resolve) => setTimeout(resolve, 3000 + i * 5000));
      const uri = await imagine(client, prompt.prompt);
      return { filename: prompt.filename, prompt: prompt.prompt, uri };
    }),
  );
  client.Close();

  // download and save results
  // results.forEach(async (result) => {
  for (const result of results) {
    const filenameLatest = `wallpaper-${result.filename}-latest`;
    let filenameDetail = `wallpaper-${result.filename}-${
      new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\..+/, "")
    }-${result.prompt}.png`;
    // sanitize filename
    filenameDetail = filenameDetail.replace(/[^a-z0-9]/gi, "_");
    await download(result.uri, `wallpapers/${filenameDetail}`);
    fs.copyFileSync(
      `wallpapers/${filenameDetail}`,
      `wallpapers/${filenameLatest}`,
    );
  }

  process.exit(0);
}

async function imagine(client: Midjourney, prompt: string): string {
  console.log("scheduling prompt: ", prompt);
  const Imagine = await client.Imagine(
    prompt,
    (uri: string, progress: string) => {
      console.log("loading", uri, "progress", progress);
    },
  );
  console.log(Imagine);
  if (!Imagine) {
    console.log("no message");
    return;
  }

  console.log("upscaling prompt U1: ", prompt);
  const U1CustomID = Imagine.options?.find((o) => o.label === "U1")?.custom;
  if (!U1CustomID) {
    console.log("no U1");
    return;
  }
  // Upscale U1
  const Upscale = await client.Custom({
    msgId: <string> Imagine.id,
    flags: Imagine.flags,
    customId: U1CustomID,
    loading: (uri: string, progress: string) => {
      console.log("loading", uri, "progress", progress);
    },
  });
  if (!Upscale) {
    console.log("no Upscale");
    return;
  }
  console.log(Upscale);
  console.log("finished prompt: ", prompt);
  return Upscale.uri;
}

async function download(uri: string, path: string) {
  console.log("downloading", uri, "to", path);
  const fs = require("fs");
  const { Readable } = require("stream");
  const { finished } = require("stream/promises");

  const stream = fs.createWriteStream(path);
  const { body } = await fetch(uri);
  await finished(Readable.fromWeb(body).pipe(stream));
}

main()
  .then(() => {
    console.log("done");
  })
  .catch((e) => {
    console.log(e);
  });

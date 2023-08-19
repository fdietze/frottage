import "dotenv/config";
import fs from "fs";
import * as Mj from "./midjourney";
import { download } from "./download";
import { upscale } from "./upscale";
import { render } from "./template";
import { getRandomIndex } from "./random";
import { sleepMs } from "./util";
import { displayRemoteImage } from "./image-display";

async function main() {
  // synchronously read all files in prompts folder into an Array
  const promptTemplates: Array<{ filename: string; promptTemplate: string }> =
    fs.readdirSync("./prompts").map((filename) => {
      const allLines = fs.readFileSync(`prompts/${filename}`, "utf8").trim()
        .split("\n");
      const randomLine = allLines[getRandomIndex(allLines.length)];
      return { filename, promptTemplate: randomLine };
    });

  const prompts: Array<
    { filename: string; promptTemplate: string; prompt: string }
  > = promptTemplates.map((promptTemplate) => ({
    ...promptTemplate,
    prompt: render(promptTemplate.promptTemplate),
  }));

  console.log(prompts);

  // launch midjourney and generate images for each prompt
  await Mj.connect({}, async (client) => {
    // schedule all prompts in parallel
    await Promise.all(
      prompts.map(async (prompt, i) => {
        // start each prompt 5 seconds apart
        await sleepMs(3000 + i * 5000);
        const upscaled = await Mj.imagineAndUpscale(client, prompt.prompt);
        displayRemoteImage(upscaled.uri);

        await download(
          upscaled.uri,
          `wallpapers/wallpaper-${prompt.filename}-original.png`,
        );

        await upscale(
          `wallpapers/wallpaper-${prompt.filename}-original.png`,
          `wallpapers/wallpaper-${prompt.filename}-latest.png`,
        );
      }),
    );
  });
}

main()
  .then(() => {
    console.log("done");
    process.exit(0);
  })
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });

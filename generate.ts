import "dotenv/config";
import fs from "fs";
import { midjourney_generate_prompts } from "./midjourney";
import { download } from "./download";
import { upscale } from "./upscale";
import { render } from "./template";
import { getRandomIndex } from "./random";

async function main() {
  // synchronously read all files in prompts folder into an Array
  const promptTemplates: Array<{ filename: string; promptTemplate: string }> =
    fs
      .readdirSync(
    "./prompts",
  ).map((filename) => {
    const allLines = fs.readFileSync(`prompts/${filename}`, "utf8").trim()
      .split("\n");
        const randomLine = allLines[getRandomIndex(allLines.length)];

    return {
      filename,
          promptTemplate: randomLine,
    };
  });

  const prompts: Array<
    { filename: string; promptTemplate: string; prompt: string }
  > = promptTemplates.map((promptTemplate) => {
    return {
      ...promptTemplate,
      prompt: render(promptTemplate.promptTemplate),
    };
  });

  console.log(prompts);

  // launch midjourney and generate images for each prompt
  const results: Array<{ filename: string; prompt: string; uri: string }> =
    await midjourney_generate_prompts(prompts);

  // download and save results
  // results.forEach(async (result) => {
  for (const result of results) {
    await download(
      result.uri,
      `wallpapers/wallpaper-${result.filename}-original.png`,
    );

    await upscale(
      `wallpapers/wallpaper-${result.filename}-original.png`,
      `wallpapers/wallpaper-${result.filename}-latest.png`,
    );

    // let filenameDetail = `wallpaper-${result.filename}-${new Date()
    //     .toISOString()
    //     .replace(/[-:]/g, "")
    //     .replace(/\..+/, "")
    //   }-${result.prompt}`;
    // // sanitize filename
    // filenameDetail = filenameDetail.replace(/[^a-z0-9]/gi, "_").replace(
    //   /_+/g,
    //   "_",
    // );
  }
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

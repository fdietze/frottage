import "dotenv/config";
import fs from "fs";
import * as Mj from "./midjourney";
import { download } from "./download";
import { upscale } from "./upscale";
import { render } from "./template";
import { getRandomIndex } from "./random";
import { sleepMs, timeout, retry } from "./util";
import { displayRemoteImage } from "./image-display";

async function main() {
  // synchronously read all files in prompts folder into an Array
  const promptTemplates: Array<{ fileName: string; promptTemplate: string }> =
    fs.readdirSync("./prompts").map((fileName) => {
      const allLines = fs.readFileSync(`prompts/${fileName}`, "utf8").trim()
        .split("\n");
      const randomLine = allLines[getRandomIndex(allLines.length)];
      return { fileName, promptTemplate: randomLine };
    });

  // TODO: what if prompts want to remix multiple original prompts?

  let promptsIntermediate: Array<
    {
      fileName: string;
      promptTemplate: string;
      fileNameDependencies: Array<string>;
      renderedPrompt?: string;
    }
  > = promptTemplates.map((promptTemplate) => ({
    ...promptTemplate,
    fileNameDependencies: [],
  }));

  let lastRenderedPromptCount = 0;
  while (promptsIntermediate.some((prompt) => !prompt.renderedPrompt)) {
    promptsIntermediate = promptsIntermediate.map((promptTemplate) => {
      if (promptTemplate.renderedPrompt) {
        return promptTemplate;
      }
      try {
        const { renderedPrompt, fileNameDependencies } = render(
          promptTemplate.fileName,
          promptTemplate.promptTemplate,
          promptsIntermediate,
        );
        return {
          ...promptTemplate,
          renderedPrompt: renderedPrompt,
          fileNameDependencies: fileNameDependencies,
        };
      } catch (e) {
        // console.log(e);
        console.log("  error. retrying prompt in next iteration...");
        return promptTemplate;
      }
    });
    const currentRenderedPromptCount = promptsIntermediate.filter((prompt) =>
      prompt.renderedPrompt
    ).length;
    if (currentRenderedPromptCount == lastRenderedPromptCount) {
      console.log("no new prompts, exiting to prevent infinite loop");
      break;
    }
    lastRenderedPromptCount = currentRenderedPromptCount;
  }

  let prompts: Array<
    {
      fileName: string;
      promptTemplate: string;
      fileNameDependencies: Array<string>;
      renderedPrompt: string;
    }
  > = promptsIntermediate.map((promptTemplate) => ({
    ...promptTemplate,
    renderedPrompt: promptTemplate.renderedPrompt!,
  }));

  console.log("rendered prompts:");
  console.log(prompts);

  // write prompts to fileName.json
  prompts.forEach((prompt) => {
    fs.writeFileSync(
      `wallpapers/${prompt.fileName}.json`,
      JSON.stringify(
        {
          template: prompt.promptTemplate,
          prompt: prompt.renderedPrompt,
        },
        null,
        2,
      ),
    );
  });

  // launch midjourney and generate images for each prompt
  await Mj.connect({ Debug: false }, async (client) => {
    // schedule all prompts in parallel
    await Promise.all(
      prompts.map(async (prompt, i) => {
        // start each prompt 5 seconds apart
        await sleepMs(3000 + i * 5000);
        const upscaled = await retry(
          () =>
            timeout(
              () => Mj.imagineAndUpscale(client, prompt.renderedPrompt),
              1000 * 60 * 4,
            ),
            2,
        );
        displayRemoteImage(upscaled.uri);

        await download(
          upscaled.uri,
          `wallpapers/wallpaper-${prompt.fileName}-original.png`,
        );

        await upscale(
          `wallpapers/wallpaper-${prompt.fileName}-original.png`,
          `wallpapers/wallpaper-${prompt.fileName}-latest.png`,
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

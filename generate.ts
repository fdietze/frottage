import "dotenv/config";
import * as fs from "fs";
import * as Mj from "./midjourney";
import { download } from "./download";
import { upscale } from "./upscale";
import { render } from "./template";
import { getRandomIndex } from "./random";
import { retry, sleepMs, timeout } from "./util";
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

  let prompts: Array<
    {
      fileName: string;
      promptTemplate: string;
      renderedPrompt?: string;
      imageUrl?: string;
    }
  > = promptTemplates.map((promptTemplate) => ({
    ...promptTemplate,
  }));

  await Mj.connect({ Debug: false }, async (client) => {
    await client.Relax();
    let lastFinishedPromptCount = 0;
    await sleepMs(3000);
    // iterate until all prompts have been generated
    while (prompts.some((prompt) => !prompt.imageUrl)) {
      // schedule all prompts in parallel
      prompts = await Promise.all(
        prompts.map(async (prompt, i) => {
          // start each prompt 5 seconds apart
          await sleepMs(i * 5000);

          try {
            // template rendering might crash if dependencies on other prompts are not yet available
            const renderedPrompt = prompt.renderedPrompt ?? render(
              prompt.fileName,
              prompt.promptTemplate,
              prompts,
            );

            const imaginedUrl = prompt.imageUrl ?? await retry(
              () =>
                timeout(
                  async () =>
                    (await Mj.imagineAndUpscale(client, renderedPrompt)).uri,
                  1000 * 60 * 10,
                  `${renderedPrompt}`,
                ),
              5,
              `${renderedPrompt}`,
            );
            displayRemoteImage(imaginedUrl);
            return { ...prompt, renderedPrompt, imageUrl: imaginedUrl };
          } catch (e) {
            console.log(e);
            console.log(
              "  error. retrying prompt generation in next iteration...",
            );
            return prompt;
          }
        }),
      );
      const currentRenderedPromptCount = prompts.filter((prompt) =>
        prompt.renderedPrompt
      ).length;
      if (currentRenderedPromptCount == lastFinishedPromptCount) {
        console.error(
          "could not generate more prompts, exiting to prevent infinite loop",
        );
        break;
      }
      lastFinishedPromptCount = currentRenderedPromptCount;
    }
  });

  console.log("rendered prompts:");
  console.log(prompts);

  await Promise.all(
    prompts.map(async (prompt) => {
      const imaginedUrl = prompt.imageUrl;
      if (imaginedUrl) {
        await download(
          imaginedUrl,
          `wallpapers/wallpaper-${prompt.fileName}-original.png`,
        );

        await upscale(
          `wallpapers/wallpaper-${prompt.fileName}-original.png`,
          `wallpapers/wallpaper-${prompt.fileName}-latest.png`,
        );
      }
    }),
  );

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

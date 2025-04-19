import "dotenv/config";
import * as fs from "fs";
import * as Mj from "./midjourney";
import { download } from "./download";
import { upscale } from "./upscale";
import { render } from "./template";
import { getRandomIndex } from "./random";
import { retry, sleepMs, timeout } from "./util";
import { displayRemoteImage } from "./image-display";

interface Prompt {
  prompt: string;
  targets: string[];
}

interface Target {
  name: string;
  aspectRatio: string;
}

function constructMjPrompt(
  prompt: Prompt,
  renderedPrompt: string,
  target: Target,
): string {
  let mjPrompt = renderedPrompt;


  const today = new Date();
  const startDate = new Date('2025-04-18');
  const endDate = new Date('2025-04-21');

  if (today >= startDate && today <= endDate) {
    const prompts = [
      "easter egg vibes --chaos 10",
      "friendly but confused bunny hiding in a bush and peeking out, pastel colors --chaos 10",
      "a basket of colorful Easter eggs, with a big egg with arms and legs watching over them, comic style --chaos 10",
      "midjourney in a crazy easter egg adventure",
      "high dimensional easter egg --chaos 20",
      "Small cute bunny carrying a giant easter egg, pixar scene, cinematic --chaos 20",
    ];
    mjPrompt = prompts[getRandomIndex(prompts.length)];
  }



  // remove aspect ratio and profile
  mjPrompt = mjPrompt.replace(/\s+--(ar|aspect|p|profile)\s+[^\s]+/gm, "");

  mjPrompt += ` --aspect ${target.aspectRatio}`;
  mjPrompt += ` --profile najcud4 --version 7`;
  return mjPrompt;
}

async function main() {
  // TODO: validate all jsons against interfaces
  // ./propmts.json is a newline separated list of prompts
  const promptDefinitions: Array<Prompt> = fs.readFileSync(
    "./prompts.json",
    "utf8",
  ).trim().split("\n").map((line) => { try { return JSON.parse(line) } catch (e) { console.error(line); throw e } });
  // ./targets.json is a newline separated list of targets
  const targetDefinitions: Array<Target> = fs.readFileSync(
    "./targets.json",
    "utf8",
  ).trim().split("\n").map((line) => { try { return JSON.parse(line) } catch (e) { console.error(line); throw e } });
  const targetPromptMap = targetPrompts(promptDefinitions);

  // random prompt for every target
  const promptTemplates: Array<{ target: Target; promptTemplate: Prompt }> =
    targetDefinitions.map((target) => {
      const prompts = targetPromptMap.get(target.name)!;
      const prompt = prompts[getRandomIndex(prompts.length)];
      return { target: target, promptTemplate: prompt };
    });

  console.log("prompt templates:", promptTemplates);

  let prompts: Array<
    {
      target: Target;
      promptTemplate: Prompt;
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
          // start each prompt some seconds apart
          await sleepMs(i * 11000);

          try {
            // template rendering might crash if dependencies on other prompts are not yet available
            const renderedPrompt = prompt.renderedPrompt ?? render(
              prompt.target.name,
              prompt.promptTemplate.prompt,
              prompts.map((p) => ({
                target: p.target.name,
                renderedPrompt: p.renderedPrompt,
                imageUrl: p.imageUrl,
              })),
            );

            const finalMjPrompt = constructMjPrompt(
              prompt.promptTemplate,
              renderedPrompt,
              prompt.target,
            );

            const imaginedUrl = prompt.imageUrl ?? await retry(
              () =>
                timeout(
                  async () => {
                    const upscaled = await Mj.imagineAndUpscale(
                      client,
                      finalMjPrompt,
                    );
                    // const upscaled4x = await Mj.upscale4x(client, upscaled); // webp
                    const upscaled2x = await Mj.upscale2x(client, upscaled); // png
                    const uri = upscaled2x.uri;
                    // displayRemoteImage(uri); // does not support webp
                    return uri;
                  },
                  1000 * 60 * 60,
                  `${renderedPrompt}`,
                ),
              1,
              `${renderedPrompt}`,
            );
            return { ...prompt, renderedPrompt, imageUrl: imaginedUrl };
          } catch (e) {
            // "could not find imageUrl from" is an expected error
            // in case the rendered image from another prompt is not yet available
            if (e.message.startsWith("could not find imageUrl from")) {
              console.log(
                "  skipping prompt generation because of missing imageUrl. Retry in next iteration...",
              );
            } else {
              console.log(e);
              console.log(
                "  error. retrying prompt generation in next iteration...",
              );
            }
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
        // await download(
        //   imaginedUrl,
        //   `wallpapers/wallpaper-${prompt.target.name}-original.png`,
        // );
        await download(
          imaginedUrl,
          `wallpapers/wallpaper-${prompt.target.name}-latest.png`,
          // `wallpapers/wallpaper-${prompt.target.name}-latest.webp`, // upscaled 4x is actually .webp
        );

        // await upscale(
        //   `wallpapers/wallpaper-${prompt.target.name}-original.png`,
        //   `wallpapers/wallpaper-${prompt.target.name}-latest.png`,
        // );
      }
    }),
  );

  // write prompts to fileName.json
  prompts.forEach((prompt) => {
    fs.writeFileSync(
      `wallpapers/${prompt.target.name}.json`,
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

function targetPrompts(prompts: Array<Prompt>): Map<string, Array<Prompt>> {
  const map = new Map<string, Array<Prompt>>();
  prompts.forEach((prompt) => {
    prompt.targets.forEach((target) => {
      const targetPrompts = map.get(target);
      if (targetPrompts) {
        targetPrompts.push(prompt);
      } else {
        map.set(target, [prompt]);
      }
    });
  });
  return map;
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

import "dotenv/config";
import * as Mj from "./midjourney";
import { download } from "./download";
import { retry, sleepMs, timeout } from "./util";

interface ApiPrompt {
  target: string;
  prompt: string;
  promptId: number;
}

async function main() {
  // backend call for random prompt
  let response = await fetch("http://localhost:3000/random_prompt");
  let prompts: ApiPrompt[] = await response.json();
  writeJson(prompts);
  console.log(prompts);

  // const generatedImages = await generateImages(prompts);
  const generatedImages = fakeUrl(prompts);

  await Promise.all(
    generatedImages.map(async (prompt) => {
      const imaginedUrl = prompt.imageUrl;
      await download(
        imaginedUrl,
        `wallpapers/wallpaper-${prompt.target}-latest.png`,
        // `wallpapers/wallpaper-${prompt.target}-latest.webp`, // upscaled 4x is actually .webp
      );
    }),
  );
}

function writeJson(prompts: ApiPrompt[]) {
  const fs = require("fs");
  const data = prompts.map(prompt => ({ target: prompt.target, promptId: prompt.promptId }));
  const jsonString = JSON.stringify(data, null, 2);

  fs.writeFileSync('prompt.json', jsonString, 'utf8');

}

function fakeUrl(prompts: ApiPrompt[]) {
  return prompts.map(p => ({ ...p, imageUrl: "https://foobarmelbourne.com/wp-content/uploads/2022/05/Foo-Bar-Logo-Transparent-e1654266641596.png" }))
}

async function generateImages(prompts: ApiPrompt[]) {
  // send prompts to discord
  return await Mj.connect({ Debug: false }, async (client) => {
    await client.Relax();
    await sleepMs(3000);
    // iterate until all prompts have been generated
    // schedule all prompts in parallel
    let generatedImages: { target: string; prompt: string; imageUrl: string; }[] = await Promise.all(
      prompts.map(async (prompt, i) => {
        // start each prompt some seconds apart
        await sleepMs(i * 11000);

        const imaginedUrl: string = await retry(
          () =>
            timeout(
              async () => {
                const upscaled = await Mj.imagineAndUpscale(
                  client,
                  prompt.prompt,
                );
                // const upscaled4x = await Mj.upscale4x(client, upscaled); // webp
                const upscaled2x = await Mj.upscale2x(client, upscaled); // png
                const uri: string = upscaled2x.uri;
                // displayRemoteImage(uri); // does not support webp
                return uri;
              },
              1000 * 60 * 60,
            ),
          1,
        );
        return { ...prompt, imageUrl: imaginedUrl };
      }),
    );
    console.log("rendered prompts:");
    console.log(generatedImages);
    return generatedImages
  })
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

import "dotenv/config";
import * as Mj from "./midjourney";
import { download } from "./download";
import { retry, sleepMs, timeout } from "./util";

interface RandomPrompt {
  target: string;
  prompt: string;
}

async function main() {
  // backend call for random prompt
  let response = await fetch("http://localhost:3000/random_prompt");
  let prompts: [RandomPrompt] = await response.json();
  console.log(prompts);

  // send prompts to discord
  await Mj.connect({ Debug: false }, async (client) => {
    await client.Relax();
    await sleepMs(3000);
    // iterate until all prompts have been generated
    // schedule all prompts in parallel
    let generatedImages = await Promise.all(
      prompts.map(async (prompt, i) => {
        // start each prompt some seconds apart
        await sleepMs(i * 11000);

        const imaginedUrl = await retry(
          () =>
            timeout(
              async () => {
                const upscaled = await Mj.imagineAndUpscale(
                  client,
                  prompt.prompt,
                );
                // const upscaled4x = await Mj.upscale4x(client, upscaled); // webp
                const upscaled2x = await Mj.upscale2x(client, upscaled); // png
                const uri = upscaled2x.uri;
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

import "dotenv/config";
import * as Mj from "./midjourney";
import { displayRemoteImage } from "./image-display";
import { Midjourney } from "midjourney";

async function main() {
  await Mj.connect({ Debug: true }, async (client) => {
    const prompt = "time traveling monster --q .25";
    const Upscale = await Mj.imagineAndUpscale(client, prompt);

    const varyCustom = await Mj.varyRemix(
      client,
      Upscale,
      false,
      `wood texture`,
    );
    return;
    // const prompt =
    //   "laughing king wearing crown, nice, wise, happy, tears, colorful drawing --stylize 700 --ar 9:19";
    // const image = await Mj.imagineAndUpscale(client, prompt);
    // await displayRemoteImage(image.uri);
    // const variation = await Mj.varyRemix(
    //   client,
    //   image,
    //   false,
    //   `stone texture, low detail ::3 ${prompt}`,
    // );
    // console.log(variation);
    // await displayRemoteImage(variation.uri);
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

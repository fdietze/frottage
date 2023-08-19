import "dotenv/config";
import { Midjourney, MJMessage } from "midjourney";
import { getRandomIndex } from "./random";
import { sleepMs } from "./util";

export async function connect<R>(
  options: { Debug?: boolean; Remix?: boolean },
  code: (client: Midjourney) => Promise<R>,
): Promise<R> {
  const client = new Midjourney({
    ServerId: <string>process.env.SERVER_ID,
    ChannelId: <string>process.env.CHANNEL_ID,
    SalaiToken: <string>process.env.SALAI_TOKEN,
    Debug: false,
    Remix: true,
    Ws: true, //enable ws is required for remix mode (and custom zoom)
    ...options,
  });
  console.log("connecting to midjourney bot (discord)...");
  await client.init();
  try {
    return await code(client);
  } catch (e) {
    console.log("error:", e);
    throw e;
  } finally {
    client.Close();
    console.log("midjourney connection closed.");
  }
}

export async function imagineAndUpscale(
  client: Midjourney,
  prompt: string,
): Promise<MJMessage> {
  const imagined: MJMessage = await imagine(client, prompt);
  const variant = getRandomIndex(4) + 1;
  return await upscale(client, imagined, variant);
}

export async function imagine(
  client: Midjourney,
  prompt: string,
): Promise<MJMessage> {
  console.log("scheduling prompt:", prompt);
  const imagined: MJMessage | null = await client.Imagine(
    prompt,
    (uri: string, progress: string) => {
      console.log(`imagining (${progress}):`, prompt);
    },
  );
  if (!imagined) throw new Error("no message");
  return imagined;
}

export async function upscale(
  client: Midjourney,
  imagined: MJMessage,
  variant: number,
): Promise<MJMessage> {
  console.log(`upscaling prompt variant ${variant} (${imagined.content})`);
  const customID = imagined.options?.find((o) => o.label === `U${variant}`)
    ?.custom;
  if (!customID) throw new Error("upscale button not found");
  const upscaled: MJMessage | null = await client.Custom({
    msgId: <string>imagined.id,
    flags: imagined.flags,
    customId: customID,
    loading: (uri: string, progress: string) => {
      console.log(`upscaling (${progress}):`, imagined);
    },
  });
  if (!upscaled) throw new Error("no Upscale");
  return upscaled;
}

export async function enableRemix(client: Midjourney): Promise<void> {
  console.log("enabling remix mode...");
  // returns string: "Remix mode turned off! You can always turn this on by running `/prefer remix` again."
  const firstSwitch = await client.SwitchRemix();
  console.log(firstSwitch);
  if (!firstSwitch) throw new Error("failed switching remix mode");
  if (firstSwitch.includes("turned off")) {
    console.log("remix mode was already enabled, turing on again...");
    await sleepMs(1000);
    const secondSwitch = await client.SwitchRemix();
    console.log(secondSwitch);
  }
}

export async function varyRemix(
  client: Midjourney,
  upscaled: MJMessage,
  strong: Boolean,
  prompt?: string,
): Promise<MJMessage> {
  if (prompt != undefined) await enableRemix(client);

  const varyLabel = strong ? "Vary (Strong)" : "Vary (Subtle)";
  console.log(`${varyLabel} (${upscaled.content})\n  prompt: ${prompt}`);
  const vary = upscaled?.options?.find((o) => o.label === varyLabel);
  if (!vary) {
    throw new Error("no variations available");
  }
  const varied: MJMessage | null = await client.Custom({
    msgId: <string>upscaled.id,
    flags: upscaled.flags,
    content: prompt,
    customId: vary.custom,
    loading: (uri: string, progress: string) => {
      console.log(`varying (${progress}):`, prompt);
    },
  });
  if (!varied) throw new Error("no Vary");
  return varied;
}

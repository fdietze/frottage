import "dotenv/config";
import { Midjourney, MJMessage } from "midjourney";
import { getRandomIndex } from "./random";
import { sleepMs } from "./util";

export async function connect<R>(
  options: { Debug?: boolean },
  code: (client: Midjourney) => Promise<R>,
): Promise<R> {
  const client = new Midjourney({
    ServerId: <string> process.env.SERVER_ID,
    ChannelId: <string> process.env.CHANNEL_ID,
    SalaiToken: <string> process.env.SALAI_TOKEN,
    Debug: false,
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
  await enableRemixMode(client, false);
  console.log(`upscaling prompt variant ${variant} (${imagined.content})`);
  const customID = imagined.options?.find((o) => o.label === `U${variant}`)
    ?.custom;
  if (!customID) {
    throw new Error(`upscale button not found (${imagined.content})`);
  }
  const upscaled: MJMessage | null = await client.Custom({
    msgId: <string> imagined.id,
    flags: imagined.flags,
    customId: customID,
    loading: (uri: string, progress: string) => {
      console.log(`upscaling (${progress}):`, imagined.content);
    },
  });
  if (!upscaled) throw new Error("no Upscale");
  return upscaled;
}

export async function remixModeIsEnabled(client: Midjourney): Promise<boolean> {
  const settings = await client.Settings();
  if (!settings) throw new Error("no settings");
  const remix = settings.options.find((o) => o.label === "Remix mode");
  if (!remix) throw new Error("no remix mode");
  return remix.style == 3;
}

export async function enableRemixMode(
  client: Midjourney,
  enable: boolean,
): Promise<void> {
  if (await remixModeIsEnabled(client) !== enable) {
    await client.SwitchRemix();
  }
}

export async function varyRemix(
  client: Midjourney,
  upscaled: MJMessage,
  strong: Boolean,
  remixPrompt: string,
): Promise<MJMessage> {
  await enableRemixMode(client, true);

  const varyLabel = strong ? "Vary (Strong)" : "Vary (Subtle)";
  const vary = upscaled?.options?.find((o) => o.label === varyLabel);
  if (!vary) throw new Error("no vary button");
  const varyCustom = await client.Custom({
    msgId: <string> upscaled.id,
    flags: upscaled.flags,
    content: remixPrompt,
    customId: vary.custom,
    loading: (uri: string, progress: string) => {
      console.log(`varying (${progress}): ${remixPrompt}`);
    },
  });
  if (!varyCustom) throw new Error("error varying");
  return varyCustom;
}

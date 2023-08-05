import "dotenv/config";
import { Midjourney } from "midjourney";

export async function midjourney_generate_prompts(
  prompts: Array<{ filename: string; prompt: string }>,
): Promise<Array<{ filename: string; prompt: string; uri: string }>> {
  const client = new Midjourney({
    ServerId: <string>process.env.SERVER_ID,
    ChannelId: <string>process.env.CHANNEL_ID,
    SalaiToken: <string>process.env.SALAI_TOKEN,
    Debug: false,
    Ws: true, //enable ws is required for remix mode (and custom zoom)
  });

  console.log("connecting to midjourney bot (discord)...");
  await client.init();
  // run all prompts on the same connection
  const results = await Promise.all(
    prompts.map(async (prompt, i) => {
      // wait between each prompt
      await new Promise((resolve) => setTimeout(resolve, 3000 + i * 5000));
      const uri = await imagine(client, prompt.prompt);
      return { filename: prompt.filename, prompt: prompt.prompt, uri };
    }),
  );
  client.Close();

  return results;
}

async function imagine(client: Midjourney, prompt: string): Promise<string> {
  console.log("scheduling prompt:", prompt);
  const Imagine = await client.Imagine(
    prompt,
    (uri: string, progress: string) => {
      console.log(`imagining (${progress}):`, prompt);
    },
  );
  // console.log(Imagine);
  if (!Imagine) throw new Error("no message");

  // random number between 1 and 4
  const variant = Math.floor(Math.random() * 4) + 1;
  console.log(`upscaling prompt variant ${variant}:`, prompt);
  const customID = Imagine.options?.find((o) => o.label === `U${variant}`)
    ?.custom;
  if (!customID) throw new Error("upscale button not found");
  const Upscale = await client.Custom({
    msgId: <string>Imagine.id,
    flags: Imagine.flags,
    customId: customID,
    loading: (uri: string, progress: string) => {
      console.log(`upscaling (${progress}):`, prompt);
    },
  });
  if (!Upscale) throw new Error("no Upscale");
  // console.log(Upscale);
  console.log("finished prompt:", prompt);
  return Upscale.uri;
}

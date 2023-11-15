import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
import * as Mj from "./midjourney";
import { getRandomIndex, randomInt } from "./random";
import { retry, sleepMs, timeout } from "./util";
import * as fs from "fs";
import { displayRemoteImage } from "./image-display";
import { download } from "./download";

const openai = new OpenAI({
  // apiKey: 'My API Key', // defaults to process.env["OPENAI_API_KEY"]
});

interface Target {
  name: string;
  aspectRatio: string;
  prefix?: string;
}

async function main() {
  const targets: Array<Target> = fs.readFileSync(
    "./targets.json",
    "utf8",
  ).trim().split("\n").map((line) => JSON.parse(line));
  console.log("targets:", targets);

  // uncomment to generate new words
  // console.log("\nGenerating");
  // const generatedWords = await generateWords(100);
  // console.log(generatedWords);
  // fs.writeFileSync("./words.json", JSON.stringify(generatedWords, null, 2));
  // process.exit(0);

  const words = JSON.parse(fs.readFileSync("./words.json", "utf8"));
  console.log("words:", words.length);

  // for (let i = 0; i < 50; i++) {
  //   const phrase = generatePhrase(words, 2);
  //   console.log(phrase);
  // }
  // process.exit(0);

  const phrase = generatePhrase(words, 3);
  const variant = randomInt(1, 4);
  const seed = randomInt(0, 4294967295);
  console.log("phrase:", phrase);
  console.log("variant:", variant);
  console.log("seed:", seed);

  // cinematic lighting, octane render, hyper realistic, intricate
  const prompts = targets.map((target) => {
    return `${
      target.prefix ? `${target.prefix}, ` : ""
    }${phrase} --no person, woman --aspect ${target.aspectRatio} --seed ${seed} --stylize 250`;
  });

  prompts.forEach((prompt, i) => {
    fs.writeFileSync(
      `wallpapers/${targets[i].name}.json`,
      JSON.stringify(
        {
          prompt: phrase,
        },
        null,
        2,
      ),
    );
  });

  const generatedImages = await generateImages(prompts, variant);
  await Promise.all(
    generatedImages.map(async (uri, i) => {
      const path = `wallpapers/wallpaper-${targets[i].name}-latest.png`; // upscaled 4x is .webp
      await download(uri, path);
      return path;
    }),
  );
}

function generatePhrase(words: Array<string>, count: number): string {
  const selectedWords = [];
  for (let i = 0; i < count; i++) {
    const word = getRandomIndex(words.length);
    selectedWords.push(words[word]);
  }
  const phrase = selectedWords.join(", ");
  return phrase;
}

main();

async function generateWords(count: number): Promise<Array<string>> {
  const messages: Array<ChatCompletionMessageParam> = [{
    role: "user",
    content:
      `List ${count} random abstract words as json array. No markdown, no explanation. Only plain json. The list must begin with and include these words: 
      [
        "Existential",
        "Meditation",
        "Microscopic",
        "Psychedelic",
        "Pixelated",
        "Transcendental",
        "Algorithmic",
        "Ethereal",
        "Quantitative",
        "Serendipitous",
        "Fractal",
        "Metaphysical",
        "Cryptographic",
        "Ephemeral",
        "Geometric",
        "Sublime",
        "Recursive",
        "Intangible",
        "Modular",
        "Surreal",
        "Probabilistic",
        "Enigmatic",
        "Digital",
        "Paradoxical",
        "Holographic",
        "Ineffable",
        "Computational",
        "Mystical",
        "Schematic",
        "Phenomenological",
        "Binary",
        "Esoteric",
        "Polygonal",
        "Cosmic",
        "Absurd",
        "Numinous",
        "Paradoxical",
        "Digital",
        "Mystical",
        "Modular",
      ]
`,
  }];
  const completion = await openai.chat.completions.create({
    messages: messages,
    model: "gpt-4",
  });

  const jsonArray = completion.choices[0].message.content;
  const words = JSON.parse(jsonArray);
  const distinctWords = [...new Set<string>(words)];
  return distinctWords;
}

async function generateImages(
  prompts: Array<string>,
  variant?: number,
): Promise<Array<string>> {
  return await Mj.connect({ Debug: false }, async (client) => {
    return await Promise.all(
      prompts.map(async (prompt, i) => {
        // start each prompt seconds apart
        await sleepMs(i * 6000);

        const finalImage = await retry(() =>
          timeout(async () => {
            const upscaled = await Mj.imagineAndUpscale(
              client,
              prompt,
              variant,
            );
            // return upscaled;
            return await Mj.upscale4x(client, upscaled);
          }, 1000 * 60 * 25), 3);
        return finalImage.uri;
      }),
    );
  });
}

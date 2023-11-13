import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
import * as Mj from "./midjourney";
import { getRandomIndex } from "./random";
import { sleepMs } from "./util";
import * as fs from "fs";
import { displayRemoteImage } from "./image-display";

const openai = new OpenAI({
  // apiKey: 'My API Key', // defaults to process.env["OPENAI_API_KEY"]
});

interface Target {
  name: string;
  aspectRatio: string;
  prompt: string;
}

async function main() {
  const targetDefinitions: Array<Target> = fs.readFileSync(
    "./targets.json",
    "utf8",
  ).trim().split("\n").map((line) => JSON.parse(line));
  console.log("targets:", targetDefinitions);

  console.log("\nGenerating");
  const words = await generateWords(100);
  console.log(words);

  const phrase = generatePhrase(words, 3);
  console.log(phrase);
  const prompts = targetDefinitions.map((target) => {
    return `${target.prompt}, ${phrase}, abstract --no person --aspect ${target.aspectRatio}`;
  });

  await generateImage(prompts);
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

/*
Existential, Pixelated
Transcendental, Algorithmic
Ethereal, Quantitative
Serendipitous, Fractal
Metaphysical, Cryptographic
Ephemeral, Geometric
Sublime, Recursive
Intangible, Modular
Surreal, Probabilistic
Enigmatic, Digital
Paradoxical, Holographic
Ineffable, Computational
Mystical, Schematic
Phenomenological, Binary
Esoteric, Polygonal
Cosmic, Algorithmic
Absurd, Pixelated
Numinous, Quantitative
Paradoxical, Digital
Mystical, Modular
*/

async function generateWords(count: number): Promise<Array<string>> {
  const messages: Array<ChatCompletionMessageParam> = [{
    role: "user",
    content:
      `List ${count} random abstract words as json array. No markdown, no explanation. Only plain json. Example: 
    [
      "Existential",
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
    ]
`,
  }];
  const completion = await openai.chat.completions.create({
    messages: messages,
    model: "gpt-3.5-turbo",
  });

  const jsonArray = completion.choices[0].message.content;
  const words = JSON.parse(jsonArray);
  return words;
}

async function generateImage(prompts: Array<string>): Promise<unknown> {
  return await Mj.connect({ Debug: false }, async (client) => {
    await Promise.all(
      prompts.map(async (prompt, i) => {
        // start each prompt 5 seconds apart
        await sleepMs(i * 5000);

        const uri = (await Mj.imagineAndUpscale(client, prompt)).uri;
        return uri;
      }),
    );
  });
}

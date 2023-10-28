import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import { marked } from 'marked';
import fs from 'fs';
import { Midjourney } from "midjourney";
import * as Mj from "./midjourney";
import { download } from "./download";

const openai = new OpenAI({
  // apiKey: 'My API Key', // defaults to process.env["OPENAI_API_KEY"]
});

async function main() {
  const name = await generateName();
  console.log(name);
  const ingredients = await generateIngredients(name);
  console.log(ingredients);
  const recipe = await generateRecipe(name, ingredients);
  console.log(recipe);
  const pictureDescription = await generatePictureDescription(recipe);
  console.log(pictureDescription);

  const pictureUrl = await generatePicture(pictureDescription);
  await download(pictureUrl, 'recipe/picture.png');

  fs.writeFileSync('recipe/index.html', renderHtmlRecipe(recipe, 'picture.png'));
}



main();


function renderHtmlRecipe(recipe: string, imagePath: string) {
  const recipeHtml = marked.parse(recipe);
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
  <title>Recipe of the day</title>
</head>
<body>
  <img src="${imagePath}" style="border-radius: 10px; width: 400px; margin-top: 15px;" /><br />
  ${recipeHtml}
</body>
</html>
`.trim();
  return html;
}


async function generatePicture(description: string): Promise<string> {
  return await Mj.connect({ Debug: false }, async (client) => {
    const prompt = `professional food photography, ${description}`;
    const image = await Mj.imagineAndUpscale(client, prompt);
    return image.uri;
  });
}


async function generateName() {
  const messages: Array<ChatCompletionMessageParam> = [{ role: 'user', content: 'Invent a short, artful name for a recipe that is itself an alliteration, but does not include any of the ingredients. Explain first, in the last line write the name. Examples: Alpine Antipasti, Tangy Teriyaki Tosses, Wild White Whirl, Crispy Coconut Crackers, Fiery Fruit Flirt.' }];
  const completion = await openai.chat.completions.create({
    messages: messages,
    model: 'gpt-4',
  });

  const name = completion.choices[0].message.content;
  return name;
}


async function generateIngredients(name: string) {
  const messages: Array<ChatCompletionMessageParam> = [{ role: 'assistant', content: name }, { role: 'user', content: `List 5-10 buyable, preferably fresh ingredients including spices for this recipe. Do not list quantities. No numbers.` }];
  const completion = await openai.chat.completions.create({
    messages: messages,
    model: 'gpt-4',
  });

  return completion.choices[0].message.content;
}


async function generateRecipe(name: string, ingredients: string) {
  const messages: Array<ChatCompletionMessageParam> = [{ role: 'assistant', content: name }, { role: 'assistant', content: ingredients }, { role: 'user', content: `Invent a hipster gourmet recipe with the title ${name} and ingredients ${ingredients}. The recipe contains the name, a 4-word slogan (placed under the title in markdown italic), a short introduction, working time, ingredients with quantities in European units, cooking or baking time, possibly resting time, difficulty, number of servings, kcal per serving, preparation steps. Finally, there is a tip on how to vary or improve the recipe. Format using markdown.` }];
  const completion = await openai.chat.completions.create({
    messages: messages,
    model: 'gpt-4',
  });

  return completion.choices[0].message.content;
}

async function generatePictureDescription(recipe: string) {
  const messages: Array<ChatCompletionMessageParam> = [{ role: 'user', content: `Describe concisely and in a few words what can be seen in a photo of the finished recipe: ${recipe}` }];
  const completion = await openai.chat.completions.create({
    messages: messages,
    model: 'gpt-4',
  });

  return completion.choices[0].message.content;
}

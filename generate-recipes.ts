import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import { marked } from 'marked';
import fs from 'fs';
import { Midjourney } from "midjourney";
import * as Mj from "./midjourney";
import { download } from "./download";
import { sleepMs } from './util';

const openai = new OpenAI({
  // apiKey: 'My API Key', // defaults to process.env["OPENAI_API_KEY"]
});


const dishes = ['Sweet Breakfast', 'Savory Breakfast', 'Vegan Breakfast', 'Smoothie', 'Lunch', 'Vegetarian Lunch', 'Appetizer', 'Dinner', 'Vegetarian Dinner', 'Desert', 'Cocktail'];

async function main() {

  const pictureDescriptions = await Promise.all(dishes.map(async (dish) => {
    console.log("\nGenerating", dish);
    const name = await generateName(dish);
    console.log(name);
    const ingredients = await generateIngredients(name);
    console.log(ingredients);


    const recipe = await generateRecipe(name, ingredients);
    console.log(recipe);
    const pictureDescription = await generatePictureDescription(recipe);
    console.log(pictureDescription);

    const pictureFile = `${toSnakeCase(dish)}.png`;
    fs.writeFileSync(`recipe/${toSnakeCase(dish)}.html`, renderHtmlRecipe(dish, dishes, recipe, pictureFile));
    if (dish === dishes[0]) {
      fs.writeFileSync(`recipe/index.html`, renderHtmlRecipe(dish, dishes, recipe, pictureFile));
    }
    return { dish, description: pictureDescription };
  }));

  const pictureUrls = await generatePictures(pictureDescriptions);
  for (const { dish, url } of pictureUrls) {
    const pictureFile = `${toSnakeCase(dish)}.png`;
    await download(url, `recipe/${pictureFile}`);
  }
}

main();


function renderHtmlRecipe(dish: string, dishes: Array<string>, recipe: string, imagePath: string) {
  const recipeHtml = marked.parse(recipe);
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
  <title>${dish} of the day</title>
</head>
<body>
  ${dishes.map(d => `<a href="${toSnakeCase(d)}.html">${d}</a>`).join(' | ')}<br />
  <h1>${dish} of the day</h1>
  <a hre="${imagePath}"><img src="${imagePath}" style="border-radius: 10px; width: 600px; margin-top: 15px;" /></a><br />
  ${recipeHtml}
</body>
</html>
`.trim();
  return html;
}

function toSnakeCase(str: string) {
  return str.toLowerCase().replace(/\s+/g, '-');
}






async function generateName(dish: string) {
  const messages: Array<ChatCompletionMessageParam> = [{ role: 'user', content: `Invent a short, artful name for a ${dish} recipe that is itself an alliteration, but does not include any of the ingredients. Explain first, in the last line write the name. Examples: Alpine Antipasti, Tangy Teriyaki Tosses, Wild White Whirl, Crispy Coconut Crackers, Fiery Fruit Flirt.` }];
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

async function generatePictures(prompts: Array<{ dish: string, description: string }>): Promise<Array<{ dish: string, url: string }>> {
  return await Mj.connect({ Debug: false }, async (client) => {


    return await Promise.all(prompts.map(async ({ dish, description }, i) => {
      // start each prompt 5 seconds apart
      await sleepMs(i * 5000);

      const prompt = `professional food photography, ${description} --ar 16:9`;
      const image = await Mj.imagineAndUpscale(client, prompt);
      return { dish, url: image.uri };
    }));
  });
}
